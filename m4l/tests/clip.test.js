"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SRC } = require("./helpers");
const Clip = require(path.join(SRC, "clip.js"));
const Snap = require(path.join(SRC, "snap.js"));
const Scales = require(path.join(SRC, "scales.js"));
const Detect = require(path.join(SRC, "detect.js"));

const cMajor = (mode) => Snap.buildMap(0, Scales.SCALES[0].mask, mode);
const mk = (id, pitch, start, extra) => Object.assign({ note_id: id, pitch: pitch, start_time: start, duration: 0.5, velocity: 100, mute: 0, probability: 1, velocity_deviation: 0, release_velocity: 64 }, extra || {});

test("remapNotes moves out-of-scale notes and keeps all other fields", () => {
    const notes = [mk(1, 60, 0), mk(2, 61, 1), mk(3, 63, 2), mk(4, 66, 3)];
    const r = Clip.remapNotes(notes, cMajor(Snap.MODE.NEAREST_DOWN));
    assert.equal(r.moved, 3);
    assert.equal(r.changed, 3);
    assert.deepEqual(r.notes.map((n) => [n.note_id, n.pitch]), [[2, 60], [3, 62], [4, 65]]);
    assert.equal(r.notes[0].velocity, 100);
    assert.equal(r.notes[0].release_velocity, 64);
    assert.equal(notes[1].pitch, 61, "input is not mutated");
});

test("block mode mutes instead of deleting", () => {
    const notes = [mk(1, 60, 0), mk(2, 61, 1)];
    const r = Clip.remapNotes(notes, cMajor(Snap.MODE.BLOCK));
    assert.equal(r.muted, 1);
    assert.equal(r.notes.length, 1);
    assert.equal(r.notes[0].note_id, 2);
    assert.equal(r.notes[0].mute, 1);
    assert.equal(r.notes[0].pitch, 61, "pitch of a muted note is kept");
});

test("two notes landing on the same pitch and start: the later one is muted", () => {
    const notes = [mk(1, 60, 0), mk(2, 61, 0), mk(3, 61, 2), mk(4, 60, 2, { mute: 1 })];
    const r = Clip.remapNotes(notes, cMajor(Snap.MODE.NEAREST_DOWN));
    assert.equal(r.collisions, 1);
    const byId = {};
    r.notes.forEach((n) => { byId[n.note_id] = n; });
    assert.equal(byId[2].mute, 1);
    assert.equal(byId[2].pitch, 60);
    assert.equal(byId[3].mute, 0, "a muted note at the same spot does not collide");
    assert.equal(byId[3].pitch, 60);
});

test("a collision keeps the player's sustained in-scale note, not the ghost note that was moved onto it", () => {
    // C major, Nearest (tie up): F# (66) -> G (67). The held G was already in scale.
    const ghost = mk(1, 66, 0, { duration: 0.25, velocity: 40 });
    const held = mk(2, 67, 0, { duration: 4, velocity: 120 });
    const r = Clip.remapNotes([ghost, held], cMajor(Snap.MODE.NEAREST_UP));
    assert.equal(r.collisions, 1);
    assert.deepEqual(r.notes.map((n) => [n.note_id, n.pitch, n.mute]), [[1, 67, 1]], "only the moved ghost note is written, muted");
    // and in the other input order
    const r2 = Clip.remapNotes([held, ghost], cMajor(Snap.MODE.NEAREST_UP));
    assert.deepEqual(r2.notes.map((n) => [n.note_id, n.pitch, n.mute]), [[1, 67, 1]]);
});

test("through the Live API: the held in-scale note is untouched and the status counts the duplicate", () => {
    const { API, calls } = fakeLive({ notes: [mk(1, 66, 0, { duration: 0.25, velocity: 40 }), mk(2, 67, 0, { duration: 4, velocity: 120 })] });
    const r = Clip.snapClip(API, null, cMajor(Snap.MODE.NEAREST_UP));
    assert.ok(r.ok);
    const sent = JSON.parse(calls[1][1]).notes;
    assert.deepEqual(sent.map((n) => n.note_id), [1], "note 2 (the held G) is not modified");
    assert.equal(sent[0].mute, 1);
    assert.match(r.message, /1 duplicate muted/);
});

test("a moved note that overlaps an existing note of the same pitch in time (different start) is muted", () => {
    // C#3 (61) 0..2 -> C (60); an existing C 1..3 sounds over its second half.
    const moved = mk(1, 61, 0, { duration: 2 });
    const existing = mk(2, 60, 1, { duration: 2 });
    const r = Clip.remapNotes([moved, existing], cMajor(Snap.MODE.NEAREST_DOWN));
    assert.equal(r.collisions, 1);
    assert.deepEqual(r.notes.map((n) => [n.note_id, n.pitch, n.mute]), [[1, 60, 1]]);
    // the same when the moved note sits inside a long existing note
    const r2 = Clip.remapNotes([mk(1, 61, 1, { duration: 0.5 }), mk(2, 60, 0, { duration: 4 })], cMajor(Snap.MODE.NEAREST_DOWN));
    assert.deepEqual(r2.notes.map((n) => [n.note_id, n.mute]), [[1, 1]]);
});

test("notes that only touch end to end, or sit at other pitches, do not collide", () => {
    const r = Clip.remapNotes([mk(1, 61, 0, { duration: 1 }), mk(2, 60, 1, { duration: 1 }), mk(3, 60, 3, { duration: 1 })], cMajor(Snap.MODE.NEAREST_DOWN));
    assert.equal(r.collisions, 0);
    assert.deepEqual(r.notes.map((n) => [n.note_id, n.pitch, n.mute]), [[1, 60, 0]]);
});

test("when two moved notes collide the longer one is kept, then the louder, then the earlier", () => {
    const run = (a, b) => Clip.remapNotes([a, b], cMajor(Snap.MODE.NEAREST_DOWN)).notes.filter((n) => n.mute).map((n) => n.note_id);
    // two C#s that both become C
    assert.deepEqual(run(mk(1, 61, 0, { duration: 1 }), mk(2, 61, 0, { duration: 3 })), [1], "longer wins");
    assert.deepEqual(run(mk(1, 61, 0, { velocity: 50 }), mk(2, 61, 0, { velocity: 90 })), [1], "louder wins");
    assert.deepEqual(run(mk(1, 61, 0.25), mk(2, 61, 0)), [1], "earlier wins");
    assert.deepEqual(run(mk(1, 61, 0), mk(2, 61, 0)), [2], "identical notes: the first in the clip wins");
});

test("existing overlapping notes that were already in scale are never touched", () => {
    const r = Clip.remapNotes([mk(1, 60, 0, { duration: 2 }), mk(2, 60, 1, { duration: 2 }), mk(3, 61, 8)], cMajor(Snap.MODE.NEAREST_DOWN));
    assert.equal(r.collisions, 0);
    assert.deepEqual(r.notes.map((n) => n.note_id), [3]);
});

test("a muted note does not block later notes: only notes that overlap a kept note are muted", () => {
    // all three land on C: A 0..2 (kept, longest), B 1.5..2.5 overlaps A (muted), C 2.2..3.2 overlaps only B
    const r = Clip.remapNotes([mk(1, 61, 0, { duration: 2 }), mk(2, 61, 1.5, { duration: 1 }), mk(3, 61, 2.2, { duration: 1 })], cMajor(Snap.MODE.NEAREST_DOWN));
    assert.equal(r.collisions, 1);
    assert.deepEqual(r.notes.map((n) => [n.note_id, n.pitch, n.mute]), [[1, 60, 0], [2, 60, 1], [3, 60, 0]]);
});

test("already muted notes are left alone and in-scale clips need no changes", () => {
    const r = Clip.remapNotes([mk(1, 61, 0, { mute: 1 }), mk(2, 62, 1)], cMajor(0));
    assert.equal(r.changed, 0);
});

test("parseNotes accepts JSON strings, objects, arrays and dict names", () => {
    const notes = [mk(1, 60, 0)];
    assert.deepEqual(Clip.parseNotes(JSON.stringify({ notes: notes })), notes);
    assert.deepEqual(Clip.parseNotes({ notes: notes }), notes);
    assert.deepEqual(Clip.parseNotes([JSON.stringify({ notes: notes })]), notes);
    assert.deepEqual(Clip.parseNotes(JSON.stringify(notes)), notes);
    class D { constructor(n) { this.n = n; } stringify() { return JSON.stringify({ notes: notes }); } }
    assert.deepEqual(Clip.parseNotes("dictionary u123", D), notes);
    assert.equal(Clip.parseNotes("garbage"), null);
    assert.equal(Clip.parseNotes(undefined), null);
});

function fakeLive(opts) {
    const calls = [];
    class API {
        constructor(p) { this.path = p; this.id = opts.noClip ? "0" : "12"; }
        get(prop) {
            if (prop === "is_midi_clip") { return [opts.audio ? 0 : 1]; }
            if (prop === "length") { return [8]; }
            if (prop === "end_marker") { return [8]; }
            return [0];
        }
        call() { const a = Array.prototype.slice.call(arguments); calls.push(a); return a[0] === "get_notes_extended" ? JSON.stringify({ notes: opts.notes || [] }) : undefined; }
    }
    return { API, calls };
}

test("snapClip reads, remaps and writes through the Live API", () => {
    const { API, calls } = fakeLive({ notes: [mk(1, 60, 0), mk(2, 61, 1), mk(3, 66, 2)] });
    const r = Clip.snapClip(API, null, cMajor(0));
    assert.ok(r.ok);
    assert.match(r.message, /Snapped 2 notes/);
    assert.equal(calls[0][0], "get_notes_extended");
    assert.deepEqual(calls[0].slice(1, 4), [0, 128, 0]);
    assert.equal(calls[1][0], "apply_note_modifications");
    const sent = JSON.parse(calls[1][1]);
    assert.deepEqual(sent.notes.map((n) => [n.note_id, n.pitch]), [[2, 60], [3, 65]]);
});

test("snapClip reports problems instead of throwing", () => {
    assert.equal(Clip.snapClip(fakeLive({ noClip: true }).API, null, cMajor(0)).message, "Select a MIDI clip");
    assert.equal(Clip.snapClip(fakeLive({ audio: true }).API, null, cMajor(0)).message, "Select a MIDI clip");
    assert.equal(Clip.snapClip(fakeLive({ notes: [] }).API, null, cMajor(0)).message, "Clip has no notes");
    const inScale = fakeLive({ notes: [mk(1, 60, 0)] });
    const r = Clip.snapClip(inScale.API, null, cMajor(0));
    assert.match(r.message, /already in scale/);
    assert.equal(inScale.calls.length, 1, "nothing written when nothing changed");
    assert.equal(Clip.snapClip(function () { throw new Error("x"); }, null, cMajor(0)).message, "Live API unavailable");
});

test("analyzeClip runs the detector on the clip notes", () => {
    const notes = ["C", "D", "E", "F", "G", "A", "B"].map((n, i) => mk(i, 60 + [0, 2, 4, 5, 7, 9, 11][i], i, { duration: 1 }));
    const r = Clip.analyzeClip(fakeLive({ notes: notes }).API, null, Detect);
    assert.ok(r.ready);
    assert.equal(r.groups[0].label, "C Major");
    const bad = Clip.analyzeClip(fakeLive({ notes: notes.slice(0, 2) }).API, null, Detect);
    assert.equal(bad.ready, false);
    assert.equal(bad.message, "Not enough notes");
    assert.equal(Clip.analyzeClip(fakeLive({ noClip: true }).API, null, Detect).message, "Select a MIDI clip");
});
