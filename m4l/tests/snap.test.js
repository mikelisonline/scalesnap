"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SRC, loadGolden, goldenMap } = require("./helpers");
const Scales = require(path.join(SRC, "scales.js"));
const Snap = require(path.join(SRC, "snap.js"));
const { MODE } = Snap;

test("buildMap is identical to C++ ScaleEngine::snap for all scales x modes x roots x notes", () => {
    const g = loadGolden();
    assert.equal(g.scaleCount, Scales.SCALES.length);
    let checked = 0;
    for (let s = 0; s < Scales.SCALES.length; s++) {
        for (let mode = 0; mode < 5; mode++) {
            for (let root = 0; root < 12; root++) {
                const got = Snap.buildMap(root, Scales.SCALES[s].mask, mode);
                const want = goldenMap(g, s, mode, root);
                for (let n = 0; n < 128; n++) {
                    if (got[n] !== want[n]) {
                        assert.fail("scale " + Scales.SCALES[s].id + " mode " + mode + " root " + root +
                                    " note " + n + ": js " + got[n] + " c++ " + want[n]);
                    }
                    checked++;
                }
            }
        }
    }
    assert.equal(checked, 162 * 5 * 12 * 128);
});

test("snap spot checks from Tests/ScaleEngineTests.cpp", () => {
    const major = Scales.SCALES[Scales.indexById("major")].mask;
    const pent = Scales.SCALES[Scales.indexById("minor_pentatonic")].mask;
    [60, 62, 64, 65, 67, 69, 71, 72].forEach((n) => assert.equal(Snap.snap(n, 0, major, MODE.NEAREST_DOWN), n));
    assert.equal(Snap.snap(61, 0, major, MODE.NEAREST_DOWN), 60);
    assert.equal(Snap.snap(61, 0, major, MODE.NEAREST_UP), 62);
    assert.equal(Snap.snap(61, 0, major, MODE.ALWAYS_UP), 62);
    assert.equal(Snap.snap(61, 0, major, MODE.ALWAYS_DOWN), 60);
    assert.equal(Snap.snap(61, 0, major, MODE.BLOCK), -1);
    assert.equal(Snap.snap(60, 0, major, MODE.BLOCK), 60);
    assert.equal(Snap.snap(70, 9, pent, MODE.NEAREST_DOWN), 69);
    assert.equal(Snap.snap(65, 9, pent, MODE.NEAREST_DOWN), 64);
    assert.equal(Snap.snap(66, 9, pent, MODE.NEAREST_DOWN), 67);
    assert.equal(Snap.snap(66, 9, pent, MODE.ALWAYS_DOWN), 64);
    assert.equal(Snap.snap(126, 0, major, MODE.ALWAYS_UP), 127);
    assert.equal(Snap.snap(127, 1, major, MODE.ALWAYS_UP), 126);
    assert.equal(Snap.snap(0, 11, major, MODE.ALWAYS_DOWN), 1);
    assert.equal(Snap.snap(-1, 0, major, 0), -1);
    assert.equal(Snap.snap(128, 0, major, 0), -1);
    const chromatic = Scales.SCALES[Scales.indexById("chromatic")].mask;
    for (let n = 0; n < 128; n++) { assert.equal(Snap.snap(n, 0, chromatic, MODE.BLOCK), n); }
});

test("encodeMap uses output+1 with 0 for blocked", () => {
    const major = Scales.SCALES[0].mask;
    const enc = Snap.encodeMap(Snap.buildMap(0, major, MODE.BLOCK));
    assert.equal(enc[60], 61);
    assert.equal(enc[61], 0);
    assert.equal(enc.length, 128);
    assert.deepEqual(Snap.encodeMap(Snap.identityMap()).slice(0, 3), [1, 2, 3]);
});

test("pitchClassSet marks in-scale pitch classes", () => {
    const major = Scales.SCALES[0].mask;
    assert.deepEqual(Snap.pitchClassSet(0, major), [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]);
    assert.equal(Snap.pitchClassSet(2, major)[3], 0); // D major has no D#
    assert.equal(Snap.pitchClassSet(2, major)[1], 1); // but has C#
});

// ---------------------------------------------------------------- NoteModel (mirrors Tests/ScaleEngineTests.cpp)

function modelWith(rootNames) {
    return new Snap.NoteModel(rootNames);
}
const ev = (on, note, vel) => ({ on: on, note: note, vel: vel });

test("two keys on the same output note do not cut each other off (refcount)", () => {
    // C (60) and C# (61 -> 60) held together: one C sounding, released only when both keys are up.
    const major = Snap.buildMap(0, Scales.SCALES[0].mask, MODE.NEAREST_DOWN);
    const m = modelWith(major);
    assert.deepEqual(m.note(60, 100), [ev(true, 60, 100)]);
    assert.deepEqual(m.note(61, 90), [ev(false, 60, 0), ev(true, 60, 90)]); // retrigger: off + on
    assert.deepEqual(m.note(60, 0), []);                                     // C# still holds the C
    assert.equal(m.count[60], 1);
    assert.deepEqual(m.note(61, 0), [ev(false, 60, 0)]);
    assert.equal(m.count[60], 0);
});

test("note-off goes to the note that was actually played after a scale change", () => {
    const m = modelWith(Snap.buildMap(0, Scales.SCALES[0].mask, MODE.NEAREST_UP)); // C major: 61 -> 62
    assert.deepEqual(m.note(61, 100), [ev(true, 62, 100)]);
    m.setMap(Snap.buildMap(5, Scales.SCALES[0].mask, MODE.NEAREST_DOWN));          // F major: 61 -> 60
    assert.deepEqual(m.note(61, 0), [ev(false, 62, 0)]);                           // not 60
    assert.ok(m.held.every((x) => x === 0));
});

test("double note-on of the same key leaves nothing stuck", () => {
    const m = modelWith(Snap.identityMap());
    m.note(50, 100); m.note(50, 100); m.note(50, 0);
    assert.equal(m.count[50], 0);
    assert.deepEqual(m.flush(), []);
});

test("blocked notes produce nothing, including their note-off", () => {
    const m = modelWith(Snap.buildMap(0, Scales.SCALES[0].mask, MODE.BLOCK));
    assert.deepEqual(m.note(61, 100), []);
    assert.deepEqual(m.note(61, 0), []);
    assert.deepEqual(m.note(60, 100), [ev(true, 60, 100)]);
});

test("changing the scale while holding keys never leaves stuck notes", () => {
    const g = loadGolden();
    const m = new Snap.NoteModel(Snap.identityMap());
    for (let s = 0; s < 30; s++) {
        m.setMap(goldenMap(g, s, s % 5, s % 12));
        for (let n = 50; n < 62; n++) { m.note(n, 80); }
    }
    for (let n = 50; n < 62; n++) { m.note(n, 0); }
    assert.deepEqual(m.flush(), []);
});

test("flush releases every sounding note once and clears state", () => {
    const m = new Snap.NoteModel(Snap.buildMap(0, Scales.SCALES[0].mask, MODE.NEAREST_DOWN));
    m.note(60, 100); m.note(61, 100); m.note(64, 100);
    const ev2 = m.flush();
    assert.deepEqual(ev2, [ev(false, 60, 0), ev(false, 64, 0)]);
    assert.deepEqual(m.note(61, 0), []);
    assert.deepEqual(m.flush(), []);
});

test("outputFor reports the note a held key plays (poly aftertouch routing)", () => {
    const m = new Snap.NoteModel(Snap.buildMap(0, Scales.SCALES[0].mask, MODE.NEAREST_DOWN));
    m.note(61, 100);
    assert.equal(m.outputFor(61), 60);
    assert.equal(m.outputFor(62), -1);
});

test("random scenarios match the C++ NoteTracker event for event", () => {
    const g = loadGolden();
    assert.ok(g.scenarios.length >= 40);
    let totalEvents = 0;
    g.scenarios.forEach((sc, si) => {
        let [root, sIdx, mode] = sc.start;
        const m = new Snap.NoteModel(Snap.buildMap(root, Scales.SCALES[sIdx].mask, mode));
        sc.ops.forEach((op, i) => {
            let got = [];
            if (op[0] === 0) { got = m.note(op[1], op[2]); }
            else if (op[0] === 1) { got = m.note(op[1], 0); }
            else { m.setMap(Snap.buildMap(op[1], Scales.SCALES[op[2]].mask, op[3])); }
            const want = sc.events[i].map((e) => ev(e[0] === 1, e[1], e[2]));
            // C++ note-offs carry the release velocity passed in (0 here); the model uses 0 as well.
            assert.deepEqual(got, want, "scenario " + si + " op " + i + " " + JSON.stringify(op));
            totalEvents += want.length;
        });
    });
    assert.ok(totalEvents > 1000);
});
