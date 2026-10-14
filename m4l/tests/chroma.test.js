"use strict";
/* Audio detection pipeline: chroma vector / spectrum -> decaying average -> the SHARED scorer (detect.js). */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { ROOT, SRC, es5Problems } = require("./helpers");
const audio = require("./audio");
const DET = path.join(ROOT, "m4l", "ScaleSnapDetect");
const Scales = require(path.join(SRC, "scales.js"));
const Detect = require(path.join(SRC, "detect.js"));
const Chroma = require(path.join(DET, "chroma.js"));
const P = Chroma.PARAMS;

const setOf = (id, root) => Detect.scoreCandidates([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], null, {})
    .find((c) => c.scaleId === id && c.root === root).set;
const pcs = (list) => list.reduce((a, pc) => a | (1 << pc), 0);
const C_MAJOR = setOf("major", 0);                 // C D E F G A B  (= A natural minor, D dorian ...)
const A_MIN_PENT = setOf("minor_pentatonic", 9);   // A C D E G      (= C major pentatonic)

function frameOf(weights, bassPc) {
    const sum = weights.reduce((a, b) => a + b, 0);
    const chroma = weights.map((w) => w / sum), bass = chroma.map(() => 0);
    if (bassPc !== undefined) { bass[bassPc] = 0.15; }
    return { chroma: chroma, bass: bass, tx: 0, ty: 0 };
}
function energy(pcList, base, strong) {
    const w = []; for (let i = 0; i < 12; i++) { w.push(0.01); }
    pcList.forEach((pc) => { w[pc] = 1; });
    if (strong !== undefined) { w[strong] = 2; }
    return w;
}
function feed(acc, frame, seconds, dt) {
    dt = dt || 0.5;
    for (let t = 0; t < seconds; t += dt) { acc.add(frame, dt); }
}

test("parameters match the design: FFT 16384, hop 4096, 60 Hz - 5 kHz, 4 harmonics, memory 8/20/60/hold", () => {
    assert.equal(P.fftSize, 16384);
    assert.equal(P.fftSize / P.overlap, 4096);
    assert.equal(P.bins, P.fftSize / 2);
    assert.equal(P.fMin, 60); assert.equal(P.fMax, 5000); assert.equal(P.fMinHighSr, 100);
    assert.deepEqual(P.harmonics, [1, 0.6, 0.36, 0.22]);
    assert.deepEqual(P.memorySeconds, [8, 20, 60, 0]);
    assert.equal(P.eps, 0.15);
    assert.equal(P.minVoicedSeconds, 4);
});

test("synthetic chroma: C major scale energy (bass C) -> C Major, A Natural Minor listed as the same notes", () => {
    const acc = new Chroma.Accumulator({ memory: 20 });
    feed(acc, frameOf(energy([0, 2, 4, 5, 7, 9, 11]), 0), 6);
    const r = acc.result();
    assert.ok(r.ready);
    assert.equal(r.groups[0].set, C_MAJOR);
    assert.equal(r.groups[0].label, "C Major");
    assert.ok(r.groups[0].pct >= 30, "pct " + r.groups[0].pct);
    assert.ok(Detect.sameNotes(r.groups[0], 10).some((s) => s.label === "A Natural Minor"));
    assert.ok(Detect.sameNotes(r.groups[0], 10).some((s) => s.label === "D Dorian"));
});

test("synthetic chroma: the same notes with the bass on A -> A Natural Minor, same group", () => {
    const acc = new Chroma.Accumulator({ memory: 20 });
    feed(acc, frameOf(energy([0, 2, 4, 5, 7, 9, 11], 0, 9), 9), 6);
    const r = acc.result();
    assert.equal(r.groups[0].set, C_MAJOR);
    assert.equal(r.groups[0].label, "A Natural Minor");
});

test("synthetic chroma: A minor pentatonic -> that family, ahead of every 7-note scale", () => {
    const acc = new Chroma.Accumulator({ memory: 20 });
    feed(acc, frameOf(energy([9, 0, 2, 4, 7], 0, 9), 9), 6);
    const r = acc.result();
    assert.equal(r.groups[0].set, A_MIN_PENT);
    assert.equal(r.groups[0].label, "A Minor Pentatonic");
    assert.ok(r.groups[0].conf > r.groups[1].conf);
    assert.ok(Detect.sameNotes(r.groups[0], 10).some((s) => s.label === "C Major Pentatonic"));
});

test("silence and too little audio give no result", () => {
    const acc = new Chroma.Accumulator();
    let r = acc.result();
    assert.equal(r.ready, false); assert.deepEqual(r.groups, []); assert.equal(r.message, "Need more audio");
    assert.deepEqual(acc.display(), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const zeros = []; for (let k = 0; k < P.bins; k++) { zeros.push(0); }
    assert.equal(Chroma.chromaFromSpectrum(zeros, 48000), null, "all-zero spectrum is no frame");
    acc.add(null, 1);                                                // a null frame adds nothing
    assert.equal(acc.voiced, 0);
    feed(acc, frameOf(energy([0, 2, 4, 5, 7, 9, 11])), 3.5);         // < 4 s of voiced frames
    r = acc.result();
    assert.equal(r.ready, false); assert.equal(r.message, "Need more audio");
    feed(acc, frameOf(energy([0, 2, 4, 5, 7, 9, 11])), 1);
    assert.equal(acc.result().ready, true);
    acc.reset();
    assert.equal(acc.result().ready, false);
    assert.equal(acc.voiced, 0);
});

test("scoring is the shared module: groups equal detectFromHistogram(h, bass, eps 0.15) of the accumulated vectors", () => {
    const acc = new Chroma.Accumulator({ memory: 20 });
    feed(acc, frameOf(energy([2, 4, 6, 7, 9, 11, 1], 0, 2), 2), 6);
    const direct = Detect.detectFromHistogram(acc.h, acc.b, { eps: 0.15, maxGroups: 5 });
    assert.deepEqual(acc.result().groups, direct.groups);
    // different from the MIDI eps (0.05): the audio device really uses the leakier model
    assert.notDeepEqual(direct.groups.map((g) => g.conf), Detect.detectFromHistogram(acc.h, acc.b, { eps: 0.05 }).groups.map((g) => g.conf));
    // chroma.js does not re-implement the formula
    const src = fs.readFileSync(path.join(DET, "chroma.js"), "utf8");
    assert.ok(/Detect\.detectFromHistogram\(/.test(src));
    assert.ok(!/Math\.log\(\(1 - /.test(src) && !/pearson/.test(src));
});

test("memory: Short follows a key change, Hold keeps the history", () => {
    const cMaj = frameOf(energy([0, 2, 4, 5, 7, 9, 11], 0, 0), 0);
    const fsMaj = frameOf(energy([6, 8, 10, 11, 1, 3, 5], 0, 6), 6);
    const FS_MAJOR = setOf("major", 6);
    const short = new Chroma.Accumulator({ memory: 8 }), hold = new Chroma.Accumulator({ memory: 0 });
    [short, hold].forEach((a) => { feed(a, cMaj, 60); feed(a, fsMaj, 30); });
    assert.equal(short.result().groups[0].set, FS_MAJOR);
    assert.equal(hold.result().groups[0].set, C_MAJOR);
    short.setMemory(0); assert.equal(short.memory, 0);
    // fade() lets old audio die out during silence without adding anything
    const a = new Chroma.Accumulator({ memory: 8 });
    feed(a, cMaj, 10);
    const before = a.h[0];
    a.fade(8);
    assert.ok(Math.abs(a.h[0] / before - Math.exp(-1)) < 1e-9);
    assert.equal(a.voiced, 10, "voiced time is not forgotten");
});

test("display: tallest bin is 1, empty is all zeros", () => {
    const acc = new Chroma.Accumulator();
    feed(acc, frameOf(energy([0, 4, 7], 0, 0)), 2);
    const d = acc.display();
    assert.equal(Math.max.apply(null, d), 1);
    assert.equal(d[0], 1);
    assert.ok(d[4] < 1 && d[7] < 1 && d[1] < 0.1);
});

test("chromaFromSpectrum: one sine at A4 puts most energy on A (and its bass copy stays empty)", () => {
    const sr = 48000, x = audio.synth([{ midi: 69, t0: 0, dur: 1, amp: 0.5 }], 1, sr, { harmonics: [1] });
    const f = Chroma.chromaFromSpectrum(audio.magnitudes(x, 8000, P.fftSize), sr);
    assert.ok(f);
    const best = f.chroma.indexOf(Math.max.apply(null, f.chroma));
    assert.equal(best, 9);
    assert.ok(Math.abs(f.chroma.reduce((a, b) => a + b, 0) - 1) < 1e-9, "normalised to sum 1");
    assert.equal(f.bass.reduce((a, b) => a + b, 0), 0, "440 Hz is above the bass limit");
    assert.ok(f.peaks >= 1);
    // the tuning vote of an in-tune sine points at 0 cents; +30 cents points the other way round the circle
    const sharp = audio.synth([{ midi: 69, t0: 0, dur: 1, amp: 0.5 }], 1, sr, { harmonics: [1], cents: 30 });
    const g = Chroma.chromaFromSpectrum(audio.magnitudes(sharp, 8000, P.fftSize), sr);
    const cents = Math.atan2(g.ty, g.tx) / (2 * Math.PI) * 100;
    assert.ok(Math.abs(cents - 30) < 3, "estimated " + cents);
    assert.ok(Math.abs(Math.atan2(f.ty, f.tx) / (2 * Math.PI) * 100) < 3);
});

test("chromaFromSpectrum: a bass note below 250 Hz feeds the bass vector on its own pitch class", () => {
    const sr = 48000, x = audio.synth([{ midi: 40, t0: 0, dur: 1, amp: 0.5 }], 1, sr, { harmonics: [1, 0.5] });  // E2 82 Hz
    const f = Chroma.chromaFromSpectrum(audio.magnitudes(x, 8000, P.fftSize), sr);
    assert.equal(f.bass.indexOf(Math.max.apply(null, f.bass)), 4);
    assert.ok(f.bass[4] > 0.1);
});

test("chromaFromSpectrum: at 96 kHz the lower limit rises from 60 to 100 Hz", () => {
    const two = [{ midi: 43, t0: 0, dur: 1, amp: 0.4 }, { midi: 64, t0: 0, dur: 1, amp: 0.4 }];   // G2 98 Hz + E4
    const at = (sr) => Chroma.chromaFromSpectrum(audio.magnitudes(audio.synth(two, 1, sr, { harmonics: [1] }), 16000, P.fftSize), sr);
    const f48 = at(48000), f96 = at(96000);
    assert.ok(f48.bass[7] > 0.05, "98 Hz is used at 48 kHz");
    assert.equal(f96.bass.reduce((a, b) => a + b, 0), 0, "98 Hz is below the 96 kHz limit");
    assert.equal(f96.chroma.indexOf(Math.max.apply(null, f96.chroma)), 4, "E4 still found");
});

test("audio -> pfft~ frames -> chroma -> scorer (design test 11): A minor triad + pentatonic line", () => {
    const sr = 48000, hop = 8192;
    [0, 30, -40].forEach((cents) => {
        const x = audio.synth(audio.SCENES.aMinorPent(10), 10, sr, { cents: cents });
        const acc = new Chroma.Accumulator({ memory: 20 });
        audio.spectra(x, P.fftSize, hop).forEach((mag) => {
            acc.add(Chroma.chromaFromSpectrum(mag, sr, { tuningCents: acc.tuningCents() }), hop / sr);
        });
        const r = acc.result();
        assert.ok(r.ready, "ready at " + cents);
        const top2 = r.groups.slice(0, 2).map((g) => g.set);
        const aMinorFamily = [C_MAJOR, A_MIN_PENT];
        assert.ok(top2.some((s) => aMinorFamily.indexOf(s) >= 0), cents + " cents: " + r.groups.map((g) => g.label + " " + g.pct).join(", "));
        assert.ok(r.groups.slice(0, 2).some((g) => g.label === "A Natural Minor" || g.label === "A Minor Pentatonic"),
            cents + " cents: " + r.groups.map((g) => g.label).join(", "));
        if (cents !== 0) { assert.ok(Math.abs(acc.tuningCents() - cents) < 6, "tuning estimate " + acc.tuningCents()); }
    });
});

test("audio -> chroma -> scorer: C major, E Phrygian dominant and F# major scales rank first", () => {
    const sr = 48000, hop = 12000;
    const cases = [
        ["cMajorScale", "C Major", setOf("major", 0)],
        ["eFrygianDom", "E Phrygian Dominant", setOf("phrygian_dominant", 4)],
        ["fSharpMajor", "F# Major", setOf("major", 6)]
    ];
    cases.forEach(([scene, label, set]) => {
        const x = audio.synth(audio.SCENES[scene](10), 10, sr);
        const acc = new Chroma.Accumulator({ memory: 20 });
        audio.spectra(x, P.fftSize, hop).forEach((mag) => acc.add(Chroma.chromaFromSpectrum(mag, sr, { tuningCents: acc.tuningCents() }), hop / sr));
        const r = acc.result();
        assert.equal(r.groups[0].set, set, scene + ": " + r.groups.map((g) => g.label + " " + g.pct).join(", "));
        assert.equal(r.groups[0].label, label, scene);
    });
});

test("audio: silence and a very quiet noise floor give no frame; broadband noise gives no confident answer", () => {
    const sr = 48000, n = P.fftSize;
    const silent = new Float32Array(n * 2);
    assert.equal(Chroma.chromaFromSpectrum(audio.magnitudes(silent, 0, n), sr), null);
    // white noise has no peaks above the -60 dB window of its own maximum worth speaking of: whatever comes out is flat
    let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 - 0.5; };
    const noise = new Float32Array(n * 6); for (let i = 0; i < noise.length; i++) { noise[i] = rnd(); }
    const acc = new Chroma.Accumulator({ memory: 0 });
    audio.spectra(noise, n, n).forEach((mag) => acc.add(Chroma.chromaFromSpectrum(mag, sr), 1));
    const d = acc.display();
    assert.ok(Math.min.apply(null, d) > 0.4, "noise chroma is roughly flat: " + d.map((v) => v.toFixed(2)).join(" "));
});

test("broadcast atoms follow the shared interface: trackName, then up to 3 (rootPc, scaleId, pct) triplets", () => {
    const acc = new Chroma.Accumulator();
    feed(acc, frameOf(energy([9, 0, 2, 4, 7], 0, 9), 9), 6);
    const groups = acc.result().groups;
    const a = Chroma.resultAtoms("Bass Gtr", groups);
    assert.equal(a[0], "Bass Gtr");
    assert.equal((a.length - 1) % 3, 0);
    assert.ok(a.length === 1 + 9, "three triplets");
    for (let i = 1; i < a.length; i += 3) {
        assert.ok(Number.isInteger(a[i]) && a[i] >= 0 && a[i] <= 11);
        assert.ok(Scales.indexById(a[i + 1]) >= 0, "scale id, not index/uid: " + a[i + 1]);
        assert.ok(Number.isInteger(a[i + 2]) && a[i + 2] >= 0 && a[i + 2] <= 100);
    }
    assert.deepEqual(a.slice(1, 4), [9, "minor_pentatonic", groups[0].pct]);
    assert.deepEqual(Chroma.resultAtoms("", []), ["Audio"], "empty name falls back, no groups = clear message");
    assert.deepEqual(Chroma.resultAtoms("Lead", []), ["Lead"]);
});

test("chroma.js is ES5 and loads in a bare [js]-like context after scales.js and detect.js", () => {
    assert.deepEqual(es5Problems(fs.readFileSync(path.join(DET, "chroma.js"), "utf8"), "chroma.js"), []);
    const vm = require("vm");
    const ctx = vm.createContext({});
    ["scales.js", "detect.js"].forEach((f) => vm.runInContext(fs.readFileSync(path.join(SRC, f), "utf8"), ctx));
    vm.runInContext(fs.readFileSync(path.join(DET, "chroma.js"), "utf8"), ctx);
    assert.equal(typeof ctx.ScaleSnapChroma.chromaFromSpectrum, "function");
    assert.equal(typeof ctx.module, "undefined");
});

test("offline NumPy check (tools/check_chroma.py): synthesised chords/scales rank the expected key first", (t) => {
    const probe = cp.spawnSync("python3", ["-c", "import numpy"], { encoding: "utf8" });
    if (probe.status !== 0) { t.skip("numpy is not installed"); return; }
    const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "check_chroma.py")], { encoding: "utf8", timeout: 240000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /all checks passed/);
});
