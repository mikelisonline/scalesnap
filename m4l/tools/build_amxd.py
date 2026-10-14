#!/usr/bin/env python3
"""Build the Max for Live devices into m4l/dist/ as ONE frozen .amxd file each (every dependency embedded).

    python3 m4l/tools/build_amxd.py                 # bundle JS, freeze both devices into dist/, re-parse them
    python3 m4l/tools/build_amxd.py --unfrozen      # development build: plain .amxd + loose .js/.maxpat next to it
    python3 m4l/tools/build_amxd.py --verify FILE   # only re-parse an .amxd and print its structure

Output (m4l/dist/), nothing else:
    Scale Snap.amxd           MIDI effect; embeds scalesnap.js (all modules concatenated: [js] has no include/require)
    Scale Snap Detect.amxd    audio effect (key/scale detection from audio, feeds Scale Snap); embeds
                              scalesnap_detect.js and ssd.spec.maxpat (loaded by [pfft~ ssd.spec 16384 4])

The build fails if a file a patcher references ([js], [pfft~], [poly~], bpatcher, abstractions, also inside
sub-patchers) is not embedded, or if a file is embedded that no patcher references. The output is reproducible:
the same sources give the same bytes (file times come from SOURCE_DATE_EPOCH, default a fixed date).

The container formats are described in amxd_frozen.py. The unfrozen .amxd (matches Ableton's maxdevtools
amxd_textconv.py) is the same three chunks, with the patcher JSON (UTF-8, NUL terminated) as 'ptch'.
"""
import argparse
import json
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import amxd_frozen  # noqa: E402
from amxd_frozen import AMXDTYPE, DEVICE_TYPES  # noqa: E402

REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(REPO, "m4l", "ScaleSnap")
SRC_DETECT = os.path.join(REPO, "m4l", "ScaleSnapDetect")
DIST = os.path.join(REPO, "m4l", "dist")

DEFAULT_META = 0       # 'meta' chunk of an unfrozen device (a frozen one always gets 7)

# ---------------------------------------------------------------------------------------------
# DEVICES. One entry per .amxd. `js_name` is the bundle embedded in (or, unfrozen, written next to) the device: the
# `js_sources` are concatenated in order (verbatim, newline separated) because the legacy [js] object cannot include or
# require other files. The module files expose globals (ScaleSnapScales, ScaleSnapDetect, ...).
# ---------------------------------------------------------------------------------------------
DEVICES = [
    {
        "name": "Scale Snap",
        "patcher": os.path.join(SRC, "Scale Snap.maxpat"),
        "type": "mmmm",
        "js_name": "scalesnap.js",
        "js_sources": ["scales.js", "snap.js", "detect.js", "favorites.js", "clip.js", "scalesnap_main.js"],
    },
    {
        # Audio effect: chromagram from pfft~ magnitudes -> the SAME scorer as the MIDI device -> scalesnap.detect.
        # The shared modules are bundled from the MIDI device's folder (not forked).
        "name": "Scale Snap Detect",
        "src": SRC_DETECT,
        "patcher": os.path.join(SRC_DETECT, "Scale Snap Detect.maxpat"),
        "type": "aaaa",
        "js_name": "scalesnap_detect.js",
        "js_sources": [os.path.join(SRC, "scales.js"), os.path.join(SRC, "detect.js"),
                       os.path.join(SRC_DETECT, "chroma.js"), os.path.join(SRC_DETECT, "scalesnap_detect.js")],
        "extra_files": [os.path.join(SRC_DETECT, "ssd.spec.maxpat")],   # loaded by [pfft~ ssd.spec 16384 4]
    },
]


def bundle_js(sources):
    """Concatenate JS files (in order) into one text, each preceded by a marker comment with its name."""
    parts = []
    for path in sources:
        with open(path, encoding="utf-8") as f:
            text = f.read()
        parts.append("/* ---- %s ---- */\n%s" % (os.path.basename(path), text.rstrip("\n") + "\n"))
    return "\n".join(parts)


def make_amxd(patcher, device_type="mmmm", meta=DEFAULT_META):
    """Wrap a patcher dict (the object that has a top-level "patcher" key) into unfrozen .amxd bytes."""
    got = patcher["patcher"].get("project", {}).get("amxdtype")
    if got != AMXDTYPE.get(device_type):
        raise ValueError("patcher.project.amxdtype is %r, expected %r for %r" % (got, AMXDTYPE.get(device_type), device_type))
    payload = json.dumps(patcher, indent=2, ensure_ascii=True).encode("utf-8") + b"\x00"
    return amxd_frozen.write_chunks(device_type, meta, payload)


def parse_amxd(data):
    """Parse .amxd bytes, frozen or not. Returns dict(type, meta, chunks, frozen, patcher, files, entries):
    `files` maps embedded dependency names to their bytes and `entries` lists every embedded file (both empty if unfrozen)."""
    chunks = amxd_frozen.read_chunks(data)
    info = {"type": chunks[0][1].decode("ascii"), "meta": struct.unpack("<I", chunks[1][1])[0],
            "chunks": [(tag, len(payload)) for tag, payload in chunks]}
    if chunks[2][1][:4] == b"mx@c":
        info.update(amxd_frozen.parse_frozen(data), frozen=True)
    else:
        body = chunks[2][1]
        info.update(frozen=False, files={}, entries=[], patcher=json.loads((body[:-1] if body[-1:] == b"\x00" else body).decode("utf-8")))
    return info


def parse_file(path):
    with open(path, "rb") as f:
        return parse_amxd(f.read())


def device_files(dev):
    """The dependency files of a device as {name: bytes}: its js bundle first, then the extra files."""
    base = dev.get("src", SRC)       # relative JS sources are looked up here; absolute paths pass through
    files = {dev["js_name"]: bundle_js([os.path.join(base, s) for s in dev["js_sources"]]).encode("utf-8")}
    for path in dev.get("extra_files", []):
        with open(path, "rb") as f:
            files[os.path.basename(path)] = f.read()
    return files


def build_device(dev, out_dir, frozen=True, meta=DEFAULT_META):
    """Write one device into out_dir. Frozen: only `<name>.amxd`. Unfrozen: the plain .amxd plus its loose files.

    Raises amxd_frozen.DependencyError if the embedded files and the patcher's references differ. Returns (path, info)."""
    with open(dev["patcher"], encoding="utf-8") as f:
        patcher = json.load(f)
    files = device_files(dev)
    patcher_dir = os.path.dirname(dev["patcher"])
    abstractions = {n for n in os.listdir(patcher_dir) if n.endswith(".maxpat")} - {os.path.basename(dev["patcher"])}
    path = os.path.join(out_dir, dev["name"] + ".amxd")
    if frozen:
        data = amxd_frozen.freeze(dev["type"], dev["name"], patcher, files, abstractions)
        for name in files:       # loose files an earlier --unfrozen build left behind
            if os.path.exists(os.path.join(out_dir, name)):
                os.remove(os.path.join(out_dir, name))
    else:
        amxd_frozen.check_dependencies(patcher, files, abstractions)
        data = make_amxd(patcher, dev["type"], meta)
        for name, content in files.items():
            with open(os.path.join(out_dir, name), "wb") as f:
                f.write(content)
    with open(path, "wb") as f:
        f.write(data)
    info = parse_file(path)      # re-parse what was written
    expected = {"type": dev["type"], "frozen": frozen, "files": files if frozen else {}}
    if {k: info[k] for k in expected} != expected:
        raise AssertionError("%s does not read back as written" % path)
    if frozen:
        if info["patcher"] != amxd_frozen.with_project(amxd_frozen.with_dependency_cache(patcher, dev["name"], list(files)), list(files)):
            raise AssertionError("%s: embedded patcher differs from the source patcher" % path)
    elif info["patcher"] != patcher:
        raise AssertionError("%s: patcher differs from the source patcher" % path)
    return path, info


def describe(path, info):
    text = "%s: %s, meta=%s, %d bytes" % (path, DEVICE_TYPES[info["type"]], info["meta"], os.path.getsize(path))
    if info["frozen"]:
        text += ", FROZEN, embeds " + ", ".join("%s (%d bytes)" % (e.name, len(e.data)) for e in info["entries"][1:])
    return text


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=DIST)
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--freeze", dest="frozen", action="store_true", default=True,
                      help="one self-contained frozen .amxd per device (the default)")
    mode.add_argument("--unfrozen", dest="frozen", action="store_false",
                      help="development build: plain .amxd with its .js/.maxpat files next to it")
    ap.add_argument("--meta", type=int, default=DEFAULT_META, help="'meta' chunk of an unfrozen device (default %d)" % DEFAULT_META)
    ap.add_argument("--verify", metavar="FILE", help="parse an existing .amxd and print its structure")
    args = ap.parse_args(argv)

    if args.verify:
        print(describe(args.verify, parse_file(args.verify)))
        return 0

    os.makedirs(args.out, exist_ok=True)
    for dev in DEVICES:
        try:
            path, info = build_device(dev, args.out, args.frozen, args.meta)
        except amxd_frozen.DependencyError as e:
            print("error: %s: %s" % (dev["name"], e), file=sys.stderr)
            return 1
        print("built " + describe(os.path.relpath(path, REPO), info) + ", %d boxes" % len(info["patcher"]["patcher"]["boxes"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
