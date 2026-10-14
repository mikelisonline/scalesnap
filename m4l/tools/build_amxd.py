#!/usr/bin/env python3
"""Build the Max for Live device(s) into m4l/dist/.

    python3 m4l/tools/build_amxd.py                 # bundle JS, wrap the patcher, write dist/, verify
    python3 m4l/tools/build_amxd.py --verify FILE   # only re-parse an .amxd and print its structure

Output (m4l/dist/):
    Scale Snap.amxd   MIDI effect device
    scalesnap.js      the device's single [js] file (all modules concatenated; [js] has no include/require)
    INSTALL.md        short install note

.amxd container (matches Ableton's maxdevtools amxd_textconv.py): a flat sequence of chunks, each
    4-byte ASCII tag | uint32 little-endian length | payload
        ampf  4 bytes  device type: 'mmmm' MIDI effect, 'aaaa' audio effect, 'iiii' instrument
        meta  4 bytes  uint32 (0 in Max-saved unfrozen devices from Ableton's own repository)
        ptch  n bytes  patcher JSON, UTF-8, NUL-terminated. (A frozen device starts with 'mx@c' instead.)
"""
import argparse
import json
import os
import shutil
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(REPO, "m4l", "ScaleSnap")
DIST = os.path.join(REPO, "m4l", "dist")

DEVICE_TYPES = {"mmmm": "MIDI Effect", "aaaa": "Audio Effect", "iiii": "Instrument"}
AMXDTYPE = {"mmmm": 1835887981, "aaaa": 1633771873, "iiii": 1768842857}
DEFAULT_META = 0

# ---------------------------------------------------------------------------------------------
# DEVICES. One entry per .amxd. `js` is the bundle written next to the device: the listed files are
# concatenated in order (verbatim, newline separated) because the legacy [js] object cannot include or
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
]


def bundle_js(sources, dest):
    """Concatenate JS files (in order) into one file. Returns the bundled text."""
    parts = []
    for path in sources:
        with open(path, encoding="utf-8") as f:
            text = f.read()
        parts.append("/* ---- %s ---- */\n%s" % (os.path.basename(path), text.rstrip("\n") + "\n"))
    out = "\n".join(parts)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(out)
    return out


def chunk(tag, payload):
    assert len(tag) == 4
    return tag.encode("ascii") + struct.pack("<I", len(payload)) + payload


def make_amxd(patcher, device_type="mmmm", meta=DEFAULT_META):
    """Wrap a patcher dict (the object that has a top-level "patcher" key) into .amxd bytes."""
    if device_type not in DEVICE_TYPES:
        raise ValueError("unknown device type " + device_type)
    got = patcher["patcher"].get("project", {}).get("amxdtype")
    if got != AMXDTYPE[device_type]:
        raise ValueError("patcher.project.amxdtype is %r, expected %d for %s" % (got, AMXDTYPE[device_type], device_type))
    text = json.dumps(patcher, indent=2, ensure_ascii=True)
    payload = text.encode("utf-8") + b"\x00"
    return chunk("ampf", device_type.encode("ascii")) + chunk("meta", struct.pack("<I", meta)) + chunk("ptch", payload)


def parse_amxd(data):
    """Parse .amxd bytes (same rules as amxd_textconv.py). Returns dict(type, meta, chunks, patcher)."""
    pos, chunks, info = 0, [], {"patcher": None, "type": None, "meta": None, "frozen": False}
    while pos < len(data):
        if len(data) - pos < 8:
            raise ValueError("truncated chunk header at offset %d" % pos)
        tag = data[pos:pos + 4].decode("ascii")
        (size,) = struct.unpack("<I", data[pos + 4:pos + 8])
        body = data[pos + 8:pos + 8 + size]
        if len(body) != size:
            raise ValueError("chunk %s claims %d bytes, only %d left" % (tag, size, len(body)))
        chunks.append((tag, size))
        if tag == "ampf":
            if size != 4:
                raise ValueError("ampf must be 4 bytes")
            info["type"] = body.decode("ascii")
        elif tag == "meta":
            if size != 4:
                raise ValueError("meta must be 4 bytes")
            (info["meta"],) = struct.unpack("<I", body)
        elif tag == "ptch":
            if body[:4] == b"mx@c":
                info["frozen"] = True
            else:
                if body[-1:] == b"\x00":
                    body = body[:-1]
                info["patcher"] = json.loads(body.decode("utf-8"))
        else:
            raise ValueError("unknown chunk " + tag)
        pos += 8 + size
    info["chunks"] = chunks
    if info["type"] not in DEVICE_TYPES:
        raise ValueError("missing or unknown device type")
    if [c[0] for c in chunks] != ["ampf", "meta", "ptch"]:
        raise ValueError("unexpected chunk order %r" % [c[0] for c in chunks])
    return info


def build_device(dev, out_dir, meta=DEFAULT_META):
    with open(dev["patcher"], encoding="utf-8") as f:
        patcher = json.load(f)
    js_path = os.path.join(out_dir, dev["js_name"])
    bundle_js([os.path.join(SRC, s) for s in dev["js_sources"]], js_path)
    data = make_amxd(patcher, dev["type"], meta)
    amxd_path = os.path.join(out_dir, dev["name"] + ".amxd")
    with open(amxd_path, "wb") as f:
        f.write(data)
    info = parse_amxd(open(amxd_path, "rb").read())      # re-parse what was written
    assert info["type"] == dev["type"] and info["patcher"] == patcher
    return amxd_path, js_path, info


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=DIST)
    ap.add_argument("--meta", type=int, default=DEFAULT_META, help="value of the 'meta' chunk (default %d)" % DEFAULT_META)
    ap.add_argument("--verify", metavar="FILE", help="parse an existing .amxd and print its structure")
    args = ap.parse_args(argv)

    if args.verify:
        info = parse_amxd(open(args.verify, "rb").read())
        print("%s: %s, meta=%s, chunks=%s%s" % (args.verify, DEVICE_TYPES[info["type"]], info["meta"],
              info["chunks"], ", FROZEN" if info["frozen"] else ""))
        return 0

    os.makedirs(args.out, exist_ok=True)
    for dev in DEVICES:
        amxd, js, info = build_device(dev, args.out, args.meta)
        print("built %s (%s, %d bytes, %d boxes) + %s (%d bytes)" % (
            os.path.relpath(amxd, REPO), DEVICE_TYPES[info["type"]], os.path.getsize(amxd),
            len(info["patcher"]["patcher"]["boxes"]), os.path.relpath(js, REPO), os.path.getsize(js)))
    shutil.copyfile(os.path.join(REPO, "m4l", "INSTALL.md"), os.path.join(args.out, "INSTALL.md"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
