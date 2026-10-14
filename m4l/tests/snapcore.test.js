"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { SRC, loadGolden, goldenMap } = require("./helpers");
const { SubpatcherHarness, findBox } = require("./maxsim");
const Scales = require(path.join(SRC, "scales.js"));
const Snap = require(path.join(SRC, "snap.js"));

const patcher = JSON.parse(fs.readFileSync(path.join(SRC, "Scale Snap.maxpat"), "utf8")).patcher;
const IN_NOTE = 0, IN_POLY = 1, IN_MAP = 2, IN_FLUSH = 3, OUT_NOTE = 0, OUT_POLY = 1;

function makeCore() {
    const core = new SubpatcherHarness(findBox(patcher, "p snapcore"));
    return {
        h: core,
        setMap(map) { Snap.encodeMap(map).forEach((v, i) => core.in(IN_MAP, [i, v])); },
        on(p, v) { core.in(IN_NOTE, [p, v]); return core.take(OUT_NOTE).map((m) => ({ on: m[1] > 0, note: m[0], vel: m[1] })); },
        off(p) { core.in(IN_NOTE, [p, 0]); return core.take(OUT_NOTE).map((m) => ({ on: m[1] > 0, note: m[0], vel: m[1] })); },
        flush() { core.in(IN_FLUSH, "bang"); return core.take(OUT_NOTE).map((m) => ({ on: false, note: m[0], vel: m[1] })); },
        poly(p, x) { core.in(IN_POLY, [p, x]); return core.take(OUT_POLY); }
    };
}
const ev = (on, note, vel) => ({ on: on, note: note, vel: vel });

test("p snapcore passes notes through unchanged until a table arrives (identity default)", () => {
    const c = makeCore();
    assert.deepEqual(c.on(61, 90), [ev(true, 61, 90)]);
    assert.deepEqual(c.off(61), [ev(false, 61, 0)]);
    assert.deepEqual(c.on(0, 1), [ev(true, 0, 1)]);
    assert.deepEqual(c.on(127, 127), [ev(true, 127, 127)]);
    assert.deepEqual(c.flush().map((e) => e.note), [0, 127]);
});

test("p snapcore snaps through the table and keeps note-ons/offs balanced", () => {
    const c = makeCore();
    c.setMap(Snap.buildMap(0, Scales.SCALES[0].mask, Snap.MODE.NEAREST_DOWN));
    assert.deepEqual(c.on(61, 100), [ev(true, 60, 100)]);
    assert.deepEqual(c.off(61), [ev(false, 60, 0)]);
    assert.deepEqual(c.on(60, 80), [ev(true, 60, 80)]);
    assert.deepEqual(c.off(60), [ev(false, 60, 0)]);
});

test("refcount: two keys on one output note do not cut each other off", () => {
    const c = makeCore();
    c.setMap(Snap.buildMap(0, Scales.SCALES[0].mask, Snap.MODE.NEAREST_DOWN));
    assert.deepEqual(c.on(60, 100), [ev(true, 60, 100)]);
    assert.deepEqual(c.on(61, 90), [ev(false, 60, 0), ev(true, 60, 90)]);
    assert.deepEqual(c.off(60), []);
    assert.deepEqual(c.off(61), [ev(false, 60, 0)]);
});

test("changing the table while a key is held: the note-off goes to the note that was sent", () => {
    const c = makeCore();
    c.setMap(Snap.buildMap(0, Scales.SCALES[0].mask, Snap.MODE.NEAREST_UP));    // 61 -> 62
    assert.deepEqual(c.on(61, 100), [ev(true, 62, 100)]);
    c.setMap(Snap.buildMap(5, Scales.SCALES[0].mask, Snap.MODE.NEAREST_DOWN));  // 61 -> 60 now
    assert.deepEqual(c.off(61), [ev(false, 62, 0)]);
    assert.deepEqual(c.flush(), []);
});

test("block mode: no events at all for blocked notes", () => {
    const c = makeCore();
    c.setMap(Snap.buildMap(0, Scales.SCALES[0].mask, Snap.MODE.BLOCK));
    assert.deepEqual(c.on(61, 100), []);
    assert.deepEqual(c.off(61), []);
    assert.deepEqual(c.on(62, 100), [ev(true, 62, 100)]);
    assert.deepEqual(c.flush(), [ev(false, 62, 0)]);
});

test("a repeated note-on of a held key releases the previous note first and never sticks", () => {
    const c = makeCore();
    assert.deepEqual(c.on(50, 100), [ev(true, 50, 100)]);
    assert.deepEqual(c.on(50, 90), [ev(false, 50, 0), ev(true, 50, 90)]);
    assert.deepEqual(c.off(50), [ev(false, 50, 0)]);
    assert.deepEqual(c.flush(), []);
    assert.deepEqual(c.off(50), []);
});

test("flush releases each sounding output note once and clears all state", () => {
    const c = makeCore();
    c.setMap(Snap.buildMap(0, Scales.SCALES[0].mask, Snap.MODE.NEAREST_DOWN));
    c.on(60, 100); c.on(61, 100); c.on(64, 100);
    assert.deepEqual(c.flush(), [ev(false, 60, 0), ev(false, 64, 0)]);
    assert.deepEqual(c.off(60), []);
    assert.deepEqual(c.off(61), []);
    assert.deepEqual(c.flush(), []);
    assert.deepEqual(c.on(61, 70), [ev(true, 60, 70)]);   // state is usable again
});

test("polyphonic aftertouch follows the output note of the held key", () => {
    const c = makeCore();
    c.setMap(Snap.buildMap(0, Scales.SCALES[0].mask, Snap.MODE.NEAREST_DOWN));
    c.on(61, 100);
    assert.deepEqual(c.poly(61, 55), [[60, 55]]);
    assert.deepEqual(c.poly(62, 55), []);                // not held
    c.off(61);
    assert.deepEqual(c.poly(61, 55), []);
});

test("the patcher agrees with the JS NoteModel on random input", () => {
    const g = loadGolden();
    const c = makeCore();
    const model = new Snap.NoteModel(Snap.identityMap());
    let seed = 12345;
    const rnd = (n) => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed >>> 8) % n; };
    for (let i = 0; i < 3000; i++) {
        const kind = rnd(10);
        if (kind === 9) {
            const map = goldenMap(g, rnd(162), rnd(5), rnd(12));
            model.setMap(map); c.setMap(map);
        } else if (kind < 5) {
            const p = 56 + rnd(10), v = 1 + rnd(127);
            assert.deepEqual(c.on(p, v), model.note(p, v), "op " + i);
        } else {
            const p = 56 + rnd(10);
            assert.deepEqual(c.off(p), model.note(p, 0), "op " + i);
        }
    }
    assert.deepEqual(c.flush(), model.flush());
});

test("the patcher matches the C++ NoteTracker event for event (randomized scripts)", () => {
    const g = loadGolden();
    let total = 0, stillSounding = 0;
    g.scenarios.forEach((sc, si) => {
        const c = makeCore();
        c.setMap(Snap.buildMap(sc.start[0], Scales.SCALES[sc.start[1]].mask, sc.start[2]));
        sc.ops.forEach((op, i) => {
            let got = [];
            if (op[0] === 0) { got = c.on(op[1], op[2]); }
            else if (op[0] === 1) { got = c.off(op[1]); }
            else { c.setMap(Snap.buildMap(op[1], Scales.SCALES[op[2]].mask, op[3])); }
            const want = sc.events[i].map((e) => ev(e[0] === 1, e[1], e[2]));
            assert.deepEqual(got, want, "scenario " + si + " op " + i + " " + JSON.stringify(op));
            total += want.length;
        });
        // At the end of the script the patcher must have exactly the notes sounding that the C++
        // tracker has (releaseAll on the channel): flushing releases those and nothing else, and
        // afterwards nothing is left.
        assert.ok(Array.isArray(sc.remaining), "golden file records the notes still sounding");
        assert.deepEqual(c.flush(), sc.remaining.map((n) => ev(false, n, 0)), "scenario " + si + ": notes still sounding at the end");
        assert.deepEqual(c.flush(), [], "scenario " + si + ": nothing remains sounding after the flush");
        stillSounding += sc.remaining.length;
    });
    assert.ok(total > 1000);
    assert.ok(stillSounding > 20, "some scenarios end with notes held, so the end-of-script check has teeth");
});
