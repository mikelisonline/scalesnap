#!/usr/bin/env node
"use strict";
/* Helper for check_chroma.py (not part of the device).
 *   node chroma_runner.js --params          print ScaleSnapChroma.PARAMS as JSON
 *   node chroma_runner.js SPEC.json         run the device's JS (chromaFromSpectrum + Accumulator + the shared
 *                                           scorer) over spectra written by Python
 * SPEC.json: { file: "<float32 little-endian, frames x bins>", frames, bins, sr, hop, memory }
 * Prints JSON: { chroma: [[12]...], bass: [[12]...], display: [12], tuning: cents, groups: [...] }
 */
const fs = require("fs");
const path = require("path");
const Chroma = require(path.join(__dirname, "..", "ScaleSnapDetect", "chroma.js"));

if (process.argv[2] === "--params") {
    process.stdout.write(JSON.stringify(Chroma.PARAMS));
    process.exit(0);
}
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const raw = fs.readFileSync(spec.file);
const all = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
const acc = new Chroma.Accumulator({ memory: spec.memory });
const chroma = [], bass = [];
for (let f = 0; f < spec.frames; f++) {
    const mag = Array.prototype.slice.call(all.subarray(f * spec.bins, (f + 1) * spec.bins));
    const fr = Chroma.chromaFromSpectrum(mag, spec.sr, { tuningCents: acc.tuningCents() });
    chroma.push(fr ? fr.chroma : null);
    bass.push(fr ? fr.bass : null);
    acc.add(fr, spec.hop / spec.sr);
}
const r = acc.result();
process.stdout.write(JSON.stringify({
    chroma: chroma, bass: bass, display: acc.display(), tuning: acc.tuningCents(), ready: r.ready,
    groups: r.groups.map((g) => ({ label: g.label, set: g.set, pct: g.pct, root: g.root, scaleId: g.scaleId }))
}));
