"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SRC } = require("./helpers");
const Scales = require(path.join(SRC, "scales.js"));
const Detect = require(path.join(SRC, "detect.js"));

const NAMES = Scales.NOTE_NAMES;
const pc = (n) => NAMES.indexOf(n);

// ---- helpers ---------------------------------------------------------------------------------

/** Pitch-class weight dictionary -> 12 vector. */
function H(d) {
    const h = new Array(12).fill(0);
    Object.keys(d).forEach((k) => { h[pc(k)] += d[k]; });
    return h;
}
const setOf = (names) => names.reduce((m, n) => m | (1 << pc(n)), 0);
const top = (r) => r.groups[0];
const labels = (r, n) => r.groups.slice(0, n).map((g) => g.label + " " + g.pct);

// The 15 scales of the design-doc prototype (check_score.py).
const PROTOTYPE_IDS = ["major", "natural_minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian",
    "harmonic_minor", "melodic_minor", "phrygian_dominant", "major_pentatonic", "minor_pentatonic", "blues",
    "harmonic_major", "whole_tone"];
const PROTOTYPE = PROTOTYPE_IDS.map((id) => Scales.SCALES[Scales.indexById(id)]);

/** MIDI note list (beats) -> Live API style notes. pitch names like "C4". */
function midi(name) {
    const m = /^([A-G]#?)(-?\d)$/.exec(name);
    return (parseInt(m[2], 10) + 1) * 12 + pc(m[1]);
}
function note(name, start, dur, vel) {
    return { pitch: midi(name), start_time: start, duration: dur, velocity: vel === undefined ? 100 : vel };
}

// ---- prototype parity (numbers from check_score.py, 15-scale library) ---------------------------

const all7 = H({ C: 1, D: 1, E: 1, F: 1, G: 1, A: 1, B: 1 });
const PROTO_CASES = [
    ["T1", all7, all7, ["C Major 97", "F Major 1", "G Major 1"]],
    ["T2", H({ C: 2, E: 2, G: 2, D: 0.5, F: 0.5, A: 0.5, B: 0.5 }), H({ C: 4 }), ["C Major 60", "C Major Pentatonic 19", "C Mixolydian 8", "C Lydian 7"]],
    ["T3", H({ A: 2, C: 2, E: 2, B: 0.5, D: 0.5, F: 0.5, G: 0.5 }), H({ A: 4 }), ["A Natural Minor 57", "A Minor Pentatonic 18", "A Phrygian 7", "A Dorian 7"]],
    ["T4", H({ A: 3, C: 1.5, D: 1, E: 1.5, G: 1 }), H({ A: 4 }), ["A Minor Pentatonic 81", "A Blues 11", "A Natural Minor 3", "A Phrygian 2"]],
    ["T5", H({ A: 3, C: 1.5, D: 1, "D#": 0.5, E: 1.5, G: 1 }), H({ A: 4 }), ["A Blues 49", "A Minor Pentatonic 45", "A Natural Minor 2", "A Phrygian 2"]],
    ["T6", H({ D: 2, F: 2, A: 2, C: 2, G: 1, B: 1 }), H({ D: 3, G: 1 }), ["D Dorian 45", "D Minor Pentatonic 41", "D Blues 7", "D Natural Minor 3"]],
    ["T7", H({ E: 2, F: 1, "G#": 1.5, A: 1, B: 1.5, C: 1, D: 1 }), H({ E: 4 }), ["E Phrygian Dominant 99", "E Phrygian 1"]]
];

PROTO_CASES.forEach(([name, h, b, want]) => {
    test("prototype parity " + name + " (15-scale library, eps 0.05)", () => {
        const r = Detect.detectFromHistogram(h, b, { scales: PROTOTYPE });
        assert.deepEqual(labels(r, want.length), want);
    });
});

test("prototype parity T8 whole tone: group >= 95%, root arbitrary", () => {
    const h = H({ C: 1, D: 1, E: 1, "F#": 1, "G#": 1, "A#": 1 });
    const r = Detect.detectFromHistogram(h, new Array(12).fill(0), { scales: PROTOTYPE });
    assert.equal(top(r).set, setOf(["C", "D", "E", "F#", "G#", "A#"]));
    assert.ok(top(r).pct >= 95, "pct " + top(r).pct);
    assert.equal(top(r).scaleId, "whole_tone");
});

// ---- full library, design-doc test table ----------------------------------------------------------

const MAJOR_SET = setOf(["C", "D", "E", "F", "G", "A", "B"]);

test("T1 C4-B4 ascending quarter notes -> C Major, A Natural Minor listed as same notes", () => {
    const notes = "C4 D4 E4 F4 G4 A4 B4".split(" ").map((n, i) => note(n, i, 1));
    const r = Detect.analyzeNotes(notes);
    assert.ok(r.ready);
    assert.equal(top(r).set, MAJOR_SET);
    assert.equal(top(r).label, "C Major");
    assert.ok(top(r).pct >= 75, "pct " + top(r).pct);
    const same = Detect.sameNotes(top(r), 20).map((x) => x.label);
    assert.ok(same.indexOf("A Natural Minor") >= 0, same.join(","));
    assert.ok(same.indexOf("D Dorian") >= 0);
});

// Weights are chosen so the pitch-class histogram equals the design-doc prototype histograms
// (velocity 127 makes weight == duration in beats).
function chordPlusPassing(bass, chord, passing) {
    const n = [note(bass, 0, 2, 127)];
    chord.forEach((p) => n.push(note(p, 0, 2, 127)));
    passing.forEach((p, i) => n.push(note(p, 0.1 + i * 0.3, 0.5, 127)));
    return n;
}
const t2Notes = () => chordPlusPassing("C2", ["E4", "G4"], ["D4", "F4", "A4", "B4"]);

test("T2 C major triad + passing tones + C bass -> C Major on top", () => {
    const r = Detect.analyzeNotes(t2Notes());
    assert.equal(top(r).set, MAJOR_SET);
    assert.equal(top(r).label, "C Major");
    assert.ok(top(r).pct >= 30, "pct " + top(r).pct); // 60% with the 15-scale prototype; more competitors in the full library
    assert.ok(top(r).conf > r.groups[1].conf * 2);
});

test("T3 A-C-E emphasis + A bass -> same group as T2 labelled A Natural Minor", () => {
    const r = Detect.analyzeNotes(chordPlusPassing("A1", ["C4", "E4"], ["B4", "D4", "F4", "G4"]));
    assert.equal(top(r).set, MAJOR_SET);
    assert.equal(top(r).label, "A Natural Minor");
    assert.equal(top(r).set, top(Detect.analyzeNotes(t2Notes())).set);
});

function riff(extra) {
    // A C D E G riff, A emphasised, bass A.
    const n = [note("A1", 0, 4)];
    ["A3", "C4", "D4", "E4", "A3", "G4", "A3", "E4"].forEach((p, i) => n.push(note(p, i * 0.5, p === "A3" ? 1 : 0.5)));
    return extra ? n.concat(extra) : n;
}

test("T4 A minor pentatonic riff ranks above every 7-note group", () => {
    const r = Detect.detectFromHistogram(...histOf(riff()), {});
    assert.equal(top(r).label, "A Minor Pentatonic");
    const pent = top(r).conf;
    r.groups.slice(1).forEach((g) => {
        if (Scales.popcount(g.members[0].mask) === 7) { assert.ok(g.conf < pent); }
    });
});

/** Helper: histogram + bass vector from Live-style notes using analyzeNotes' weighting (via a probe). */
function histOf(notes) {
    // Re-run the same weighting as analyzeNotes using the Detector on a beat timeline (1 beat = 1 s).
    const d = new Detect.Detector({ memory: 0, minNotes: 0, minPitchClasses: 0, minSeconds: 0 });
    const events = [];
    notes.forEach((n) => { events.push([n.start_time, 1, n]); events.push([n.start_time + n.duration, 0, n]); });
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    events.forEach((e) => (e[1] ? d.noteOn(e[2].pitch, e[2].velocity, e[0]) : d.noteOff(e[2].pitch, e[0])));
    return [d.h, d.b];
}

test("T5 riff plus a blue note (D#, >= 8% of the weight) -> A Blues on top", () => {
    const base = riff();
    const total = Detect.analyzeNotes(base); // sanity
    assert.ok(total.ready);
    const [h] = histOf(base);
    const sum = h.reduce((a, b) => a + b, 0);
    const need = 0.09 * sum / (1 - 0.09);                      // D# weight ~9% of the total
    const sharp = [note("D#4", 0.25, Math.min(need / (0.5 + 0.5 * 100 / 127), 4))];
    const r = Detect.analyzeNotes(base.concat(sharp));
    assert.equal(top(r).label, "A Blues");
});

test("T5 control: at 5% the blue note is a near-tie with Minor Pentatonic", () => {
    const [h] = histOf(riff());
    const sum = h.reduce((a, b) => a + b, 0);
    const d = (0.05 * sum / 0.95) / (0.5 + 0.5 * 100 / 127);
    const r = Detect.analyzeNotes(riff([note("D#4", 0.25, d)]));
    const labs = r.groups.slice(0, 2).map((g) => g.label).sort();
    assert.deepEqual(labs, ["A Blues", "A Minor Pentatonic"]);
});

test("T6 Dm7 <-> G7 vamp with an E passing tone, D bass -> D Dorian", () => {
    const n = [note("D2", 0, 4), note("G2", 4, 2)];
    ["D4", "F4", "A4", "C5"].forEach((p) => n.push(note(p, 0, 2)));      // Dm7
    ["G3", "B3", "D4", "F4"].forEach((p) => n.push(note(p, 4, 2)));      // G7
    n.push(note("E4", 2, 0.5));                                          // passing tone
    n.push(note("D2", 2, 2));
    const r = Detect.analyzeNotes(n);
    assert.equal(top(r).label, "D Dorian");
});

test("T7 E F G# A B C D with E bass -> E Phrygian Dominant (not an alias of the same notes)", () => {
    const n = [note("E2", 0, 2, 127)];
    [["F4", 1], ["G#4", 1.5], ["A4", 1], ["B4", 1.5], ["C5", 1], ["D5", 1]].forEach(([p, d], i) => n.push(note(p, 0.1 + i * 0.2, d, 127)));
    const r = Detect.analyzeNotes(n);
    assert.equal(top(r).label, "E Phrygian Dominant");
    assert.ok(top(r).pct >= 60, "pct " + top(r).pct);
});

test("T8 whole-tone notes -> whole-tone group on top (root arbitrary)", () => {
    const n = ["C4", "D4", "E4", "F#4", "G#4", "A#4"].map((p, i) => note(p, i, 1));
    const r = Detect.analyzeNotes(n);
    assert.equal(top(r).set, setOf(["C", "D", "E", "F#", "G#", "A#"]));
    assert.equal(top(r).scaleId, "whole_tone");
    assert.ok(top(r).pct >= 60, "pct " + top(r).pct); // many 7-note supersets exist in the full library
});

// ---- live listening ---------------------------------------------------------------------------------

test("T9 too little material -> Listening... and no results", () => {
    const d = new Detect.Detector();
    d.noteOn(60, 100, 0); d.noteOff(60, 0.3);
    d.noteOn(60, 100, 1); d.noteOff(60, 1.3);
    d.noteOn(60, 100, 2); d.noteOff(60, 2.3);
    const r = d.result(3);
    assert.equal(r.ready, false);
    assert.equal(r.groups.length, 0);
    assert.equal(r.message, "Listening... 3 notes");
    const d2 = new Detect.Detector();
    for (let i = 0; i < 10; i++) { d2.noteOn(60, 100, i); d2.noteOff(60, i + 0.5); }
    assert.equal(d2.result(10).ready, false); // 10 notes but 1 pitch class
});

test("min-data gate: 8 notes, 4 pitch classes and 3 s of duration are required", () => {
    const d = new Detect.Detector();
    const ps = [60, 62, 64, 65, 60, 62, 64, 65];
    ps.forEach((p, i) => { d.noteOn(p, 100, i * 0.2); d.noteOff(p, i * 0.2 + 0.15); });
    assert.equal(d.result(2).ready, false, "only 1.2 s of duration");
    ps.forEach((p, i) => { d.noteOn(p, 100, 5 + i * 0.5); d.noteOff(p, 5 + i * 0.5 + 0.45); });
    assert.equal(d.result(10).ready, true);
});

function play(d, notes, t0, spacing) {
    notes.forEach((p, i) => { d.noteOn(p, 100, t0 + i * spacing); d.noteOff(p, t0 + i * spacing + spacing * 0.9); });
    return t0 + notes.length * spacing;
}

const C_TUNE = [60, 64, 67, 60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60, 60];
const FS_TUNE = C_TUNE.map((p) => p + 6);

test("T10 30 s of C major, then 60 s of F# major with a 20 s memory -> F# Major", () => {
    const d = new Detect.Detector({ memory: 20 });
    let t = 0;
    while (t < 30) { t = play(d, C_TUNE, t, 0.5); }
    assert.equal(d.result(t).groups[0].set, MAJOR_SET);
    assert.equal(d.result(t).groups[0].label, "C Major");
    const t1 = t;
    while (t < t1 + 60) { t = play(d, FS_TUNE, t, 0.5); }
    const r = d.result(t);
    assert.equal(r.groups[0].label, "F# Major");
    assert.ok(r.groups[0].pct > 60, "pct " + r.groups[0].pct);
});

test("Hold memory keeps old material; reset clears everything", () => {
    const d = new Detect.Detector({ memory: 0 });
    let t = 0;
    while (t < 30) { t = play(d, C_TUNE, t, 0.5); }
    const t1 = t;
    while (t < t1 + 10) { t = play(d, FS_TUNE, t, 0.5); }
    assert.equal(d.result(t).groups[0].label, "C Major");
    d.reset();
    assert.equal(d.noteCount, 0);
    assert.equal(d.result(t).ready, false);
});

test("held notes are credited while sounding (tick) and capped at 4 s", () => {
    const d = new Detect.Detector({ memory: 0 });
    d.noteOn(60, 127, 0);
    d.tick(1); d.tick(2); d.tick(10);
    assert.ok(Math.abs(d.h[0] - 4) < 1e-9, "h[0]=" + d.h[0]);
    assert.ok(Math.abs(d.b[0] - 4) < 1e-9); // lone note is the bass
    d.noteOn(64, 127, 10);                  // higher than the held C: not bass
    d.noteOff(64, 11);
    assert.ok(Math.abs(d.h[4] - 1) < 1e-9);
    assert.equal(d.b[4], 0);
});

test("clip analysis needs >= 4 notes and >= 3 pitch classes", () => {
    assert.equal(Detect.analyzeNotes([note("C4", 0, 1), note("E4", 1, 1), note("G4", 2, 1)]).message, "Not enough notes");
    assert.equal(Detect.analyzeNotes([note("C4", 0, 1), note("C5", 1, 1), note("C4", 2, 1), note("E4", 3, 1)]).message, "Not enough notes");
    const ok = Detect.analyzeNotes([note("C4", 0, 1), note("E4", 1, 1), note("G4", 2, 1), note("C5", 3, 1)]);
    assert.ok(ok.ready);
    assert.equal(Detect.analyzeNotes([]).ready, false);
    const muted = [note("C4", 0, 1), note("D4", 1, 1), note("E4", 2, 1), note("F4", 3, 1)];
    muted[3].mute = 1;
    assert.equal(Detect.analyzeNotes(muted).message, "Not enough notes");
});

test("results are grouped by pitch set, sum to <= 100% and are sorted", () => {
    const r = Detect.detectFromHistogram(H({ C: 2, E: 2, G: 2, D: 0.5, F: 0.5, A: 0.5, B: 0.5 }), H({ C: 4 }));
    assert.equal(r.groups.length, 5);
    const seen = new Set();
    let sum = 0;
    r.groups.forEach((g, i) => {
        assert.ok(!seen.has(g.set)); seen.add(g.set);
        sum += g.conf;
        if (i > 0) { assert.ok(r.groups[i - 1].conf >= g.conf - 1e-12); }
        g.members.forEach((m) => assert.equal(m.set, g.set));
    });
    assert.ok(sum <= 1 + 1e-9);
    assert.equal(Detect.formatGroup(top(r)), top(r).label + " " + top(r).pct + "%");
});

test("Chromatic is never a candidate; empty histogram gives no results", () => {
    const r = Detect.scoreCandidates(H({ C: 1, D: 1, E: 1 }), null);
    assert.ok(r.every((c) => c.k < 12));
    assert.equal(Detect.detectFromHistogram(new Array(12).fill(0), null).groups.length, 0);
});

test("every prior and canonical id exists in the library", () => {
    Object.keys(Detect.PRIORS).forEach((id) => assert.ok(Scales.indexById(id) >= 0, id));
});

test("audio-style call: eps 0.15 is accepted", () => {
    const r = Detect.detectFromHistogram(H({ A: 3, C: 1.5, D: 1, E: 1.5, G: 1 }), H({ A: 4 }), { eps: 0.15 });
    assert.ok(r.groups.length === 5);
    assert.ok(top(r).pct > 0);
});
