#!/usr/bin/env python3
"""Frozen Max for Live devices: one .amxd file with every dependency embedded (no Max needed to write one).

    python3 m4l/tools/amxd_frozen.py --roundtrip FILE...   # parse frozen .amxd files, rewrite them, compare bytes

The format was reverse-engineered from 19 devices frozen by Max 7/8/9 (Ableton's maxdevtools test fixtures and
Connection Kit among them); the writer below reproduces every one of them byte for byte (see --roundtrip and
m4l/tests/test_frozen.py). There is no checksum anywhere in the format.

Outer file: chunks, each  tag(4 ASCII) | uint32 LITTLE-endian size | payload
    ampf  4 bytes   device type: 'mmmm' MIDI effect, 'aaaa' audio effect, 'iiii' instrument
    meta  uint32    7 in devices frozen by Max (1 or 0 in unfrozen ones)
    ptch  n bytes   the 'mx@c' collective below (unfrozen: the patcher JSON instead)

'mx@c' collective, every integer BIG-endian, offsets counted from the start of the ptch payload:
    0   'mx@c'
    4   uint32  16                     header size
    8   uint64  D = offset of the 'dlst' footer = 16 + sum of all file sizes
    16  file 0 | file 1 | ...          back to back, no padding. File 0 is the device itself:
                                       the patcher JSON followed by ONE trailing NUL byte.
                                       Dependencies are the raw file bytes.
    D   'dlst' uint32 (8 + size of all 'dire' records)
        one 'dire' record per file, in file order:  'dire' uint32 (8 + size of its fields) then the fields
        below, each  tag | uint32 (8 + data size) | data , in exactly this order:
            type  4cc, NUL padded: JSON (.maxpat/.json), TEXT (.js/.txt), 'svg ', 'PNG ', AIFF, gDSP
            fnam  UTF-8 file name, NUL terminated and NUL padded to a multiple of 4 bytes
            sz32  uint32 file size
            of32  uint32 file offset
            vers  uint32 0
            flag  uint32 17 for the device (file 0), 0 for dependencies
            mdat  uint32 modification time, seconds since 1904-01-01 UTC (HFS+; unix time + 2082844800)

Dependencies are found by plain file name, exactly as for an unfrozen device ([js scalesnap.js] finds the embedded
scalesnap.js, [pfft~ ssd.spec 16384 4] finds the embedded ssd.spec.maxpat); embedded files win over files of the
same name on Max's search path. Max 8 also lists the dependencies in patcher.dependency_cache and the project
block (patcher.project.contents, readonly 1), which we do too.
"""
import argparse
import json
import os
import struct
import sys
from collections import namedtuple

HFS_EPOCH = 2082844800                 # seconds from 1904-01-01 to 1970-01-01
DEFAULT_SOURCE_DATE = 1767225600       # 2026-01-01 UTC: modification time of every file unless SOURCE_DATE_EPOCH is set
FROZEN_META = 7
HEADER_SIZE = 16
DEVICE_FLAG = 17
FIELDS = ("type", "fnam", "sz32", "of32", "vers", "flag", "mdat")      # order inside a 'dire' record

DEVICE_TYPES = {"mmmm": "MIDI Effect", "aaaa": "Audio Effect", "iiii": "Instrument"}
AMXDTYPE = {"mmmm": 1835887981, "aaaa": 1633771873, "iiii": 1768842857}    # patcher.project.amxdtype

# extension -> (4cc file type, folder Max 8 puts it in under "<device> Project/", used for dependency_cache)
FILE_KINDS = {
    ".js": (b"TEXT", "code"), ".txt": (b"TEXT", "data"), ".json": (b"JSON", "data"), ".maxpat": (b"JSON", "patchers"),
    ".gendsp": (b"gDSP", "patchers"), ".svg": (b"svg ", "media"), ".png": (b"PNG ", "media"), ".aif": (b"AIFF", "media"),
    ".aiff": (b"AIFF", "media"),
}

# extension -> (section of patcher.project.contents, "kind") for the kinds seen in devices frozen by Max 8: the .js is
# {"code": {"stringFormat.js": {"kind": "javascript", "local": 1}}} (OSC Send.amxd), the .maxpat and .svg are in
# m4l/tests/fixtures/OSC MIDI Send.amxd, the .txt is in FrozenTest.amxd (Max 9). Max lists no other embedded
# file kinds that we have a sample of (.png, .aif, .gendsp, .json ... are embedded but not listed), so neither do we.
PROJECT_KINDS = {
    ".maxpat": ("patchers", "patcher"), ".svg": ("media", "vectorimagefile"), ".js": ("code", "javascript"),
    ".txt": ("data", "textfile"),
}
PROJECT_SECTIONS = ("patchers", "media", "code", "data")      # order Max writes them in; "patchers" is always there

# One file of the collective. `type` is the raw 4 bytes; `mdat` is in HFS seconds, as stored.
Entry = namedtuple("Entry", "name type data flag vers mdat")

JS_OBJECTS = ("js", "jsui", "v8", "v8ui")        # first argument: script file
PATCHER_OBJECTS = ("pfft~", "poly~")             # first argument: sub-patcher file, without extension


class DependencyError(ValueError):
    """The files embedded in a device are not exactly the files its patchers reference."""


# ------------------------------------------------------------------------------------- outer chunks
def read_chunks(data):
    """Split an .amxd into [(tag, payload)]; raises ValueError on truncation or an unexpected layout."""
    pos, chunks = 0, []
    while pos < len(data):
        if len(data) - pos < 8:
            raise ValueError("truncated chunk header at offset %d" % pos)
        tag = data[pos:pos + 4].decode("ascii")
        (size,) = struct.unpack("<I", data[pos + 4:pos + 8])
        payload = data[pos + 8:pos + 8 + size]
        if len(payload) != size:
            raise ValueError("chunk %s claims %d bytes, only %d left" % (tag, size, len(payload)))
        chunks.append((tag, payload))
        pos += 8 + size
    if [t for t, _ in chunks] != ["ampf", "meta", "ptch"]:
        raise ValueError("unexpected chunk order %r" % [t for t, _ in chunks])
    if len(chunks[0][1]) != 4 or chunks[0][1].decode("ascii") not in DEVICE_TYPES:
        raise ValueError("missing or unknown device type %r" % chunks[0][1])
    if len(chunks[1][1]) != 4:
        raise ValueError("meta must be 4 bytes")
    return chunks


def write_chunks(device_type, meta, ptch):
    if device_type not in DEVICE_TYPES:
        raise ValueError("unknown device type " + device_type)
    out = b""
    for tag, payload in (("ampf", device_type.encode("ascii")), ("meta", struct.pack("<I", meta)), ("ptch", ptch)):
        out += tag.encode("ascii") + struct.pack("<I", len(payload)) + payload
    return out


# ------------------------------------------------------------------------------------- the collective
def _field(tag, data):
    return tag + struct.pack(">I", 8 + len(data)) + data


def _u32(tag, value):
    return _field(tag, struct.pack(">I", value))


def write_collective(entries):
    """Entries -> 'mx@c' payload. entries[0] is the device patcher."""
    blobs, dires, offset = [], [], HEADER_SIZE
    for e in entries:
        name = e.name.encode("utf-8") + b"\0"
        name += b"\0" * (-len(name) % 4)
        fields = (_field(b"type", e.type.ljust(4, b"\0")) + _field(b"fnam", name) + _u32(b"sz32", len(e.data))
                  + _u32(b"of32", offset) + _u32(b"vers", e.vers) + _u32(b"flag", e.flag) + _u32(b"mdat", e.mdat))
        dires.append(_field(b"dire", fields))
        blobs.append(e.data)
        offset += len(e.data)
    return (b"mx@c" + struct.pack(">IQ", HEADER_SIZE, offset) + b"".join(blobs)
            + _field(b"dlst", b"".join(dires)))


def parse_collective(payload):
    """'mx@c' payload -> [Entry]. Strict: the files must tile the data area exactly and the footer must end the payload."""
    if payload[:4] != b"mx@c":
        raise ValueError("not a frozen device (no 'mx@c' collective)")
    header, footer = struct.unpack(">IQ", payload[4:16])
    if header != HEADER_SIZE:
        raise ValueError("unexpected collective header size %d" % header)
    if payload[footer:footer + 4] != b"dlst":
        raise ValueError("no 'dlst' footer at offset %d" % footer)
    (dlst_size,) = struct.unpack(">I", payload[footer + 4:footer + 8])
    if footer + dlst_size != len(payload):
        raise ValueError("'dlst' footer does not end the payload")
    entries, pos, expect = [], footer + 8, HEADER_SIZE
    while pos < len(payload):
        if payload[pos:pos + 4] != b"dire":
            raise ValueError("expected a 'dire' record at offset %d" % pos)
        (dsize,) = struct.unpack(">I", payload[pos + 4:pos + 8])
        fields, fpos = {}, pos + 8
        for tag in FIELDS:
            if payload[fpos:fpos + 4] != tag.encode("ascii"):
                raise ValueError("expected field '%s' at offset %d" % (tag, fpos))
            (fsize,) = struct.unpack(">I", payload[fpos + 4:fpos + 8])
            fields[tag] = payload[fpos + 8:fpos + fsize]
            fpos += fsize
        if fpos != pos + dsize:
            raise ValueError("'dire' record at offset %d has unexpected fields" % pos)
        size, offset = struct.unpack(">I", fields["sz32"])[0], struct.unpack(">I", fields["of32"])[0]
        if offset != expect or offset + size > footer:
            raise ValueError("file '%s' does not follow the previous one (offset %d, expected %d)" % (fields["fnam"], offset, expect))
        expect = offset + size
        entries.append(Entry(fields["fnam"].rstrip(b"\0").decode("utf-8"), fields["type"], payload[offset:offset + size],
                             *(struct.unpack(">I", fields[t])[0] for t in ("flag", "vers", "mdat"))))
        pos += dsize
    if expect != footer:
        raise ValueError("%d bytes of file data are not listed in the footer" % (footer - expect))
    if not entries:
        raise ValueError("empty collective")
    return entries


# ------------------------------------------------------------------------------------- frozen devices
def source_date_mdat(environ=os.environ):
    """HFS modification time for every embedded file: SOURCE_DATE_EPOCH (unix seconds) or a fixed date, never the clock."""
    mdat = int(environ.get("SOURCE_DATE_EPOCH", DEFAULT_SOURCE_DATE)) + HFS_EPOCH
    if not 0 <= mdat < 1 << 32:
        raise ValueError("SOURCE_DATE_EPOCH is outside the range of the 32-bit mdat field")
    return mdat


def patcher_bytes(patcher):
    """The device patcher as stored in the collective: JSON plus one trailing NUL."""
    return json.dumps(patcher, indent=1, ensure_ascii=True).encode("utf-8") + b"\0"


def file_kind(name):
    """(4cc type, Max 8 project folder) of a dependency file, from its extension."""
    try:
        return FILE_KINDS[os.path.splitext(name)[1]]
    except KeyError:
        raise ValueError("cannot embed '%s': unsupported file type" % name)


def with_dependency_cache(patcher, device_name, names):
    """Copy of the patcher with patcher.dependency_cache listing `names`, the way Max 8 writes it (before 'autosave')."""
    cache = [{"name": n, "bootpath": "~/Documents/Max 8/Max for Live Devices/%s Project/%s" % (device_name, file_kind(n)[1]),
              "type": file_kind(n)[0].decode("ascii").strip(), "implicit": 1} for n in names]
    inner = {}
    for key, value in patcher["patcher"].items():
        if key == "autosave":
            inner["dependency_cache"] = cache
        if key != "dependency_cache":
            inner[key] = value
    inner.setdefault("dependency_cache", cache)
    return dict(patcher, patcher=inner)


def with_project(patcher, names):
    """Copy of the patcher whose patcher.project lists the embedded files the way Max 8 does for a frozen device.

    Only `contents` (every embedded file of a kind in PROJECT_KINDS as {"kind": ..., "local": 1} under its section,
    "patchers" first and always present) and `readonly` (1, as in every frozen fixture) change; the rest of the
    project block is kept as the patcher has it."""
    listed = [(n, PROJECT_KINDS[os.path.splitext(n)[1]]) for n in names if os.path.splitext(n)[1] in PROJECT_KINDS]
    contents = {section: {n: {"kind": kind, "local": 1} for n, (sec, kind) in listed if sec == section}
                for section in PROJECT_SECTIONS if section == "patchers" or any(sec == section for _, (sec, _) in listed)}
    project = dict(patcher["patcher"]["project"], contents=contents, readonly=1)
    return dict(patcher, patcher=dict(patcher["patcher"], project=project))


def freeze(device_type, device_name, patcher, files, abstractions=(), mdat=None):
    """Frozen .amxd bytes for a device patcher plus its dependency files ({file name: bytes}, embedded in that order).

    Raises DependencyError unless `files` is exactly what the patcher (and the embedded patchers) reference;
    `abstractions` is passed on to check_dependencies."""
    got = patcher["patcher"].get("project", {}).get("amxdtype")
    if got != AMXDTYPE.get(device_type):
        raise ValueError("patcher.project.amxdtype is %r, expected %r for %r" % (got, AMXDTYPE.get(device_type), device_type))
    check_dependencies(patcher, files, abstractions)
    mdat = source_date_mdat() if mdat is None else mdat
    device = with_project(with_dependency_cache(patcher, device_name, list(files)), list(files))
    entries = [Entry(device_name + ".amxd", b"JSON", patcher_bytes(device), DEVICE_FLAG, 0, mdat)]
    for name, data in files.items():
        entries.append(Entry(name, file_kind(name)[0], data, 0, 0, mdat))
    return write_chunks(device_type, FROZEN_META, write_collective(entries))


def parse_frozen(data):
    """Frozen .amxd bytes -> dict(type, meta, entries, patcher, files). `files` maps dependency name -> bytes."""
    chunks = read_chunks(data)
    entries = parse_collective(chunks[2][1])
    if entries[0].flag != DEVICE_FLAG or not entries[0].name.endswith(".amxd"):
        raise ValueError("first embedded file is not the device")
    if entries[0].data[-1:] != b"\0":
        raise ValueError("device patcher is not NUL terminated")
    return {"type": chunks[0][1].decode("ascii"), "meta": struct.unpack("<I", chunks[1][1])[0], "entries": entries,
            "patcher": json.loads(entries[0].data[:-1].decode("utf-8")), "files": {e.name: e.data for e in entries[1:]}}


# ------------------------------------------------------------------------------------- dependencies
def _script_name(arg):
    return arg if os.path.splitext(arg)[1] in (".js", ".mjs", ".cjs") else arg + ".js"


def _patcher_name(arg):
    return arg if os.path.splitext(arg)[1] in (".maxpat", ".gendsp") else arg + ".maxpat"


def referenced_files(patcher, abstractions=()):
    """File names one patcher refers to, looking into its embedded sub-patchers too.

    Found: [js x.js] [jsui] [v8] [v8ui] (script), [pfft~ x ...] [poly~ x ...] (x.maxpat), bpatchers with a "name",
    jsui "filename", and any object whose name is one of `abstractions` (file names of patchers that can be used
    as objects, e.g. ["foo.maxpat"] makes [foo 1 2] a reference). Data files (coll, buffer~, ...) are not tracked."""
    refs = set()

    def walk(inner):
        for item in inner.get("boxes", []):
            box = item["box"]
            tokens = box.get("text", "").split() if box.get("maxclass") == "newobj" else []
            arg = tokens[1] if len(tokens) > 1 and not tokens[1].startswith("@") else None
            if tokens and tokens[0] in JS_OBJECTS and arg:
                refs.add(_script_name(arg))
            elif tokens and tokens[0] in PATCHER_OBJECTS and arg:
                refs.add(_patcher_name(arg))
            elif tokens and tokens[0] + ".maxpat" in abstractions:
                refs.add(tokens[0] + ".maxpat")
            if box.get("maxclass") == "bpatcher" and box.get("name"):
                refs.add(_patcher_name(box["name"]))
            if box.get("maxclass") == "jsui" and box.get("filename"):
                refs.add(_script_name(box["filename"]))
            if "patcher" in box:
                walk(box["patcher"])

    walk(patcher["patcher"])
    return refs


def check_dependencies(patcher, files, abstractions=()):
    """Raise DependencyError unless `files` ({name: bytes}) is exactly what `patcher` references.

    Embedded .maxpat files are scanned as well, so what a sub-patcher needs must be embedded too and what only
    a sub-patcher uses is not 'unused'."""
    wanted, queue, seen = set(), [patcher], set()
    while queue:
        found = referenced_files(queue.pop(), abstractions)
        wanted |= found
        for name in sorted(found & set(files) - seen):
            seen.add(name)
            if name.endswith(".maxpat"):
                queue.append(json.loads(files[name].decode("utf-8")))
    missing, extra = sorted(wanted - set(files)), sorted(set(files) - wanted)
    problems = []
    if missing:
        problems.append("referenced by a patcher but not embedded: " + ", ".join(missing))
    if extra:
        problems.append("embedded but referenced by no patcher: " + ", ".join(extra))
    if problems:
        raise DependencyError("; ".join(problems))


# ------------------------------------------------------------------------------------- command line
def roundtrip(path):
    """Parse a frozen .amxd and write it again from the parsed fields. Returns None if identical, else a message."""
    with open(path, "rb") as f:
        data = f.read()
    chunks = read_chunks(data)
    rebuilt = write_chunks(chunks[0][1].decode("ascii"), struct.unpack("<I", chunks[1][1])[0],
                           write_collective(parse_collective(chunks[2][1])))
    if rebuilt == data:
        return None
    n = next((i for i in range(min(len(rebuilt), len(data))) if rebuilt[i] != data[i]), min(len(rebuilt), len(data)))
    return "rewritten file differs at byte %d (%d vs %d bytes)" % (n, len(rebuilt), len(data))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--roundtrip", nargs="+", metavar="FILE", required=True,
                    help="parse frozen .amxd files, write them again and require identical bytes")
    status = 0
    for path in ap.parse_args(argv).roundtrip:
        problem = roundtrip(path)
        print("%s: %s" % (path, problem or "rewritten byte for byte"))
        status |= problem is not None
    return status


if __name__ == "__main__":
    sys.exit(main())
