#!/usr/bin/env python3
"""Generate m4l/ScaleSnap/scales.js from Source/ScaleLibrary.h.

The C++ table is the single source of truth for the scale library. This script
parses it and writes an ES5 data module (usable from Max's legacy [js] object and
from Node) so that the VST3 and the Max for Live device share the same scales.

    python3 m4l/tools/gen_scales.py            # (re)write m4l/ScaleSnap/scales.js
    python3 m4l/tools/gen_scales.py --check    # exit 1 if scales.js is stale

Each scale also gets a stable numeric `uid` (24-bit FNV-1a hash of its id). The
device stores `uid` in a Live parameter instead of the list position, so
reordering or extending the library never changes what a saved Live Set selects.
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
HEADER = os.path.join(REPO, "Source", "ScaleLibrary.h")
OUTPUT = os.path.join(REPO, "m4l", "ScaleSnap", "scales.js")

STR = r'"((?:[^"\\]|\\.)*)"'
ROW = re.compile(
    r"\{\s*" + STR + r",\s*" + STR + r",\s*" + STR + r",\s*makeMask\s*\(\{([^}]*)\}\),\s*" + STR + r"\s*\}"
)


def c_unescape(s):
    return re.sub(r"\\(.)", lambda m: {"n": "\n", "t": "\t"}.get(m.group(1), m.group(1)), s)


def fnv1a24(text):
    h = 0x811C9DC5
    for b in text.encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return (h ^ (h >> 24)) & 0xFFFFFF  # fold to 24 bits: exactly representable as a float


def parse_header(path=HEADER):
    src = open(path, encoding="utf-8").read()
    scales = []
    for m in ROW.finditer(src):
        sid, name, cat, degrees, info = (c_unescape(m.group(i)) if i != 4 else m.group(i) for i in range(1, 6))
        degs = [int(x) for x in degrees.split(",") if x.strip()]
        mask = 0
        for d in degs:
            mask |= 1 << d
        scales.append({"id": sid, "name": name, "category": cat, "mask": mask, "info": info})

    cat_block = re.search(r"getCategories\(\)\s*\{(.*?)\n\}", src, re.S)
    if not cat_block:
        raise SystemExit("could not find getCategories() in " + path)
    categories = [c_unescape(x) for x in re.findall(STR, cat_block.group(1))]

    if not scales or not categories:
        raise SystemExit("parsed no scales/categories from " + path)
    ids = [s["id"] for s in scales]
    if len(set(ids)) != len(ids):
        raise SystemExit("duplicate scale ids in " + path)
    if scales[0]["id"] != "major":
        raise SystemExit("scale 0 must be 'major'")
    for s in scales:
        if s["category"] not in categories:
            raise SystemExit("unknown category %r for %s" % (s["category"], s["id"]))
        if not s["mask"] & 1:
            raise SystemExit("scale %s does not contain its root" % s["id"])
        s["uid"] = fnv1a24(s["id"])
    uids = [s["uid"] for s in scales]
    if len(set(uids)) != len(uids) or 0 in uids:
        raise SystemExit("uid collision: change fnv1a24 salt handling before adding scales")
    return scales, categories


def js_str(s):
    # ASCII-only, JSON-compatible string literal (valid ES5).
    return json.dumps(s, ensure_ascii=True)


TEMPLATE = """\
/* GENERATED FILE - DO NOT EDIT.
 * Source: Source/ScaleLibrary.h   Generator: m4l/tools/gen_scales.py
 * Regenerate with: python3 m4l/tools/gen_scales.py
 *
 * ES5 module: loads in Max's legacy [js] object (global ScaleSnapScales) and in Node (require).
 * mask: 12-bit pitch-class set, bit i set => i semitones above the root is in the scale.
 * uid:  stable 24-bit id hash (FNV-1a of `id`), stored in the Live Set instead of the list index.
 */
var ScaleSnapScales = (function () {
    var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    var CATEGORIES = [
@CATEGORIES@
    ];

    var SCALES = [
@SCALES@
    ];

    var byId = {};
    var byUid = {};
    (function () {
        for (var i = 0; i < SCALES.length; i++) {
            SCALES[i].index = i;
            byId[SCALES[i].id] = i;
            byUid[SCALES[i].uid] = i;
        }
    })();

    function popcount(mask) {
        var n = 0;
        while (mask) { n += mask & 1; mask >>= 1; }
        return n;
    }

    return {
        NOTE_NAMES: NOTE_NAMES,
        CATEGORIES: CATEGORIES,
        SCALES: SCALES,
        /** Library position of a scale id, or -1. */
        indexById: function (id) { return byId.hasOwnProperty(id) ? byId[id] : -1; },
        /** Library position of a scale uid, or -1. */
        indexByUid: function (uid) { return byUid.hasOwnProperty(uid) ? byUid[uid] : -1; },
        /** Number of notes in a scale mask. */
        popcount: popcount,
        /** Library positions of all scales in a category (by category name), in library order. */
        indicesInCategory: function (category) {
            var out = [];
            for (var i = 0; i < SCALES.length; i++) {
                if (SCALES[i].category === category) { out.push(i); }
            }
            return out;
        }
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ScaleSnapScales;
}
"""


def render(scales, categories):
    cats = ",\n".join("        " + js_str(c) for c in categories)
    rows = []
    for s in scales:
        rows.append(
            "        { id: %s, name: %s, category: %s, mask: %d, uid: %d, info: %s }"
            % (js_str(s["id"]), js_str(s["name"]), js_str(s["category"]), s["mask"], s["uid"], js_str(s["info"]))
        )
    return TEMPLATE.replace("@CATEGORIES@", cats).replace("@SCALES@", ",\n".join(rows))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="fail if scales.js is not up to date")
    ap.add_argument("--header", default=HEADER)
    ap.add_argument("--output", default=OUTPUT)
    args = ap.parse_args(argv)

    scales, categories = parse_header(args.header)
    text = render(scales, categories)

    if args.check:
        current = open(args.output, encoding="utf-8").read() if os.path.exists(args.output) else None
        if current != text:
            print("STALE: %s does not match %s. Run: python3 m4l/tools/gen_scales.py" % (args.output, args.header))
            return 1
        print("scales.js is up to date (%d scales, %d categories)" % (len(scales), len(categories)))
        return 0

    with open(args.output, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote %s (%d scales, %d categories)" % (args.output, len(scales), len(categories)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
