"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "m4l", "ScaleSnap");

function loadGolden() {
    const gz = fs.readFileSync(path.join(__dirname, "golden_snap.json.gz"));
    const g = JSON.parse(zlib.gunzipSync(gz).toString("utf8"));
    g.snapBytes = Buffer.from(g.snap, "base64");
    return g;
}

/** Golden snap table entry: output note or -1. */
function goldenMap(g, scale, mode, root) {
    const off = (((scale * 5) + mode) * 12 + root) * 128;
    const out = [];
    for (let n = 0; n < 128; n++) {
        const b = g.snapBytes[off + n];
        out.push(b === 255 ? -1 : b - 128 + n);
    }
    return out;
}

module.exports = { ROOT, SRC, loadGolden, goldenMap };
