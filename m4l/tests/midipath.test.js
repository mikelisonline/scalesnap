"use strict";
/* The realtime MIDI path of the real Scale Snap.maxpat, executed with tests/maxsim.js:
 * midiin (raw bytes) -> status router -> { midiout directly | midiparse -> p snapcore -> midiformat -> midiout }.
 * Only note-on, note-off and polyphonic aftertouch may go through midiparse/midiformat; everything else
 * (pitch bend, CC, program, channel pressure, system messages) must come out byte for byte, so a 14-bit
 * pitch bend never loses its LSB (midiparse/midiformat without @hires carry only 7 bits). */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { SRC } = require("./helpers");
const { RealtimePath } = require("./maxsim");
const Scales = require(path.join(SRC, "scales.js"));
const Snap = require(path.join(SRC, "snap.js"));

const patcher = JSON.parse(fs.readFileSync(path.join(SRC, "Scale Snap.maxpat"), "utf8")).patcher;

function makePath(map) {
    const rt = new RealtimePath(patcher);
    if (map) { Snap.encodeMap(map).forEach((v, i) => rt.mapEntry(i, v)); }
    return rt;
}
const cMajorDown = () => Snap.buildMap(0, Scales.SCALES[0].mask, Snap.MODE.NEAREST_DOWN);

test("pitch bend passes byte for byte: every 14-bit value on every channel", () => {
    const rt = makePath(cMajorDown());
    for (let ch = 0; ch < 16; ch++) {
        for (let v = 0; v < 16384; v++) {
            const msg = [0xE0 | ch, v & 0x7F, v >> 7];
            rt.bytes(msg);
            const got = rt.take();
            if (got.length !== 3 || got[0] !== msg[0] || got[1] !== msg[1] || got[2] !== msg[2]) {
                assert.deepEqual(got, msg, "bend " + v + " on channel " + (ch + 1));
            }
        }
    }
    assert.equal(rt.parse.state.status, -1, "midiparse never saw a byte of it");
});

test("every non-note message is untouched and never reaches midiparse", () => {
    const rt = makePath(cMajorDown());
    const msgs = [
        [0xB0, 1, 64], [0xB5, 64, 127], [0xBF, 123, 0],        // CC (mod wheel, sustain, all notes off)
        [0xC0, 12], [0xC9, 127],                                // program change
        [0xD0, 99], [0xDF, 1],                                  // channel pressure
        [0xE3, 0x01, 0x40], [0xE0, 0x7F, 0x7F],                 // pitch bend
        [0xF1, 0x23], [0xF2, 0x10, 0x20], [0xF3, 5],            // system common
        [0xF0, 0x7E, 0x7F, 0x09, 0x01, 0xF7],                   // sysex
        [0xF8], [0xFA], [0xFE]                                  // real-time
    ];
    msgs.forEach((m) => {
        rt.bytes(m);
        assert.deepEqual(rt.take(), m, "message " + m.join(" "));
    });
    assert.equal(rt.parse.state.status, -1);
    // running status for a non-note message
    rt.bytes([0xB0, 1, 10, 1, 20, 1, 30]);
    assert.deepEqual(rt.take(), [0xB0, 1, 10, 1, 20, 1, 30]);
});

test("a real-time byte inside a message does not break it", () => {
    const rt = makePath(cMajorDown());
    rt.bytes([0xE0, 0x12, 0xF8, 0x34]);                         // clock between the data bytes of a bend
    assert.deepEqual(rt.take(), [0xE0, 0x12, 0xF8, 0x34]);
    rt.bytes([0x90, 61, 0xF8, 100]);                            // and inside a note-on
    assert.deepEqual(rt.take(), [0xF8, 0x90, 60, 100]);
});

test("notes are still snapped, on their own channel, and note-offs match", () => {
    const rt = makePath(cMajorDown());
    rt.bytes([0x94, 61, 100]);                                  // channel 5: C# -> C
    assert.deepEqual(rt.take(), [0x94, 60, 100]);
    rt.bytes([0x84, 61, 64]);                                   // note-off
    assert.deepEqual(rt.take(), [0x94, 60, 0], "note-off as note-on velocity 0");
    rt.bytes([0x90, 62, 90]);
    assert.deepEqual(rt.take(), [0x90, 62, 90]);
});

test("running status: several notes after one status byte", () => {
    const rt = makePath(cMajorDown());
    rt.bytes([0x90, 60, 100, 61, 90, 64, 80]);
    assert.deepEqual(rt.take(), [0x90, 60, 100, 0x90, 60, 0, 0x90, 60, 90, 0x90, 64, 80]);
});

test("polyphonic aftertouch follows the snapped note", () => {
    const rt = makePath(cMajorDown());
    rt.bytes([0x92, 61, 100]);
    rt.take();
    rt.bytes([0xA2, 61, 55]);
    assert.deepEqual(rt.take(), [0xA2, 60, 55]);
    rt.bytes([0xA2, 62, 55]);                                   // not held: dropped
    assert.deepEqual(rt.take(), []);
});

test("order is preserved when notes and other messages are interleaved", () => {
    const rt = makePath(cMajorDown());
    rt.bytes([0x90, 64, 100, 0xE0, 0x05, 0x50, 0x90, 61, 90, 0xB0, 64, 127, 0x80, 64, 0, 0xD0, 33]);
    assert.deepEqual(rt.take(), [
        0x90, 64, 100, 0xE0, 0x05, 0x50, 0x90, 60, 90, 0xB0, 64, 127, 0x90, 64, 0, 0xD0, 33]);
});

test("only note-on, note-off and poly aftertouch statuses are routed to midiparse", () => {
    // The structure behind the behaviour above: midiparse has one feeder (the status router's gate)
    // and nothing but its channel outlet is wired straight to midiformat.
    const boxes = patcher.boxes.map((b) => b.box);
    const text = (id) => boxes.find((b) => b.id === id).text || boxes.find((b) => b.id === id).maxclass;
    const into = (t) => patcher.lines.filter((l) => text(l.patchline.destination[0]) === t).map((l) => text(l.patchline.source[0]) + ":" + l.patchline.source[1]);
    assert.deepEqual(into("midiparse"), ["gate 2:1"]);
    const direct = patcher.lines.filter((l) => text(l.patchline.source[0]) === "midiparse" && text(l.patchline.destination[0]) === "midiformat")
        .map((l) => l.patchline.source[1] + ">" + l.patchline.destination[1]);
    assert.deepEqual(direct, ["6>6"], "only the channel is passed on");
    assert.deepEqual(into("midiout").map((s) => s.split(":")[0]).sort(), ["gate 2", "midiformat", "split 0 247"]);
    // the status ranges: 0x80-0xAF are the note statuses
    const splits = boxes.filter((b) => /^split /.test(b.text || "")).map((b) => b.text).sort();
    assert.deepEqual(splits, ["split 0 247", "split 128 175", "split 176 247"]);
});
