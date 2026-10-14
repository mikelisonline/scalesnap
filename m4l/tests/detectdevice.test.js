"use strict";
/* Scale Snap Detect (audio effect): the [js] glue in a [js]-like sandbox, the two patchers, and the built .amxd. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const vm = require("vm");
const { ROOT, SRC, es5Problems } = require("./helpers");
const { createEnv } = require("./maxenv");
const audio = require("./audio");
const DET = path.join(ROOT, "m4l", "ScaleSnapDetect");
const Scales = require(path.join(SRC, "scales.js"));
const Chroma = require(path.join(DET, "chroma.js"));
const P = Chroma.PARAMS;

const SOURCES = [path.join(SRC, "scales.js"), path.join(SRC, "detect.js"), path.join(DET, "chroma.js"), path.join(DET, "scalesnap_detect.js")];
const OUT = { SEND: 0, CHROMA: 1, ROW1: 2, ROW2: 3, ROW3: 4, ROW4: 5, ROW5: 6, SAME: 7, STATUS: 8, TICK: 9 };

// ------------------------------------------------------------------------------------------ sandbox
const SR = 48000, HOP = 12000;
const sceneFrames = {};
function framesOf(scene) {
    if (!sceneFrames[scene]) {
        const x = audio.synth(audio.SCENES[scene](12), 12, SR);
        sceneFrames[scene] = audio.spectra(x, P.fftSize, HOP);
    }
    return sceneFrames[scene];
}

/** A device instance with a scriptable spectrum buffer, level and Live API. */
function device(opts) {
    opts = opts || {};
    const state = { spectrum: null, name: opts.trackName === undefined ? "Bass Gtr" : opts.trackName, frameCount: P.bins, peekThrows: false };
    function FakeBuffer(name) { this.name = name; state.bufferName = name; }
    FakeBuffer.prototype.framecount = function () { return state.frameCount; };
    FakeBuffer.prototype.peek = function (ch, idx, count) {
        if (state.peekThrows) { throw new Error("no such buffer"); }
        assert.equal(ch, 1); assert.equal(idx, 0); assert.equal(count, P.bins);
        return state.spectrum || new Array(count).fill(0);
    };
    function FakeLive(path_) { this.path = path_; this.id = "17"; state.livePath = path_; }
    FakeLive.prototype.get = function (prop) { assert.equal(prop, "name"); return [state.name]; };
    const env = createEnv({
        sources: SOURCES, filename: "scalesnap_detect.js", jsarguments: ["scalesnap_detect.js", "012spec"],
        Buffer: FakeBuffer, LiveAPI: opts.noLive ? undefined : FakeLive
    });
    env.state = state;
    env.frame = 0;
    if (!opts.noSr) { env.call("sr", SR); }                 // the patcher reports it right after loading
    /** One 250 ms tick: new level message (dB re full scale), the next spectrum frame of a scene, then "tick". */
    env.step = function (scene, db, ms) {
        env.advance(ms || 250);
        if (db !== null && db !== undefined) { env.call("level", Math.pow(10, db / 10)); }
        if (scene) {
            const fr = framesOf(scene);
            state.spectrum = fr[env.frame++ % fr.length];
        }
        env.call("tick");
    };
    env.run = function (seconds, scene, db) { for (let i = 0; i < seconds * 4; i++) { env.step(scene, db); } };
    env.last = (n) => { const m = env.on(n); return m.length ? m[m.length - 1] : null; };
    env.text = (n) => { const m = env.last(n); return m ? m.slice(1).join(" ") : null; };
    env.sends = () => env.on(OUT.SEND);
    return env;
}

// ------------------------------------------------------------------------------------------ glue
test("bundle loads without require/module, declares 10 outlets and every handler", () => {
    const env = device();
    assert.equal(env.ctx.outlets, 10);
    assert.equal(env.ctx.inlets, 1);
    assert.equal(typeof env.ctx.module, "undefined");
    ["loaded", "active", "listen", "send", "memory", "gate", "reset", "sr", "level", "tick", "notifydeleted"]
        .forEach((f) => assert.equal(typeof env.ctx[f], "function", f));
    assert.equal(typeof env.ctx.ScaleSnapChroma, "object");
});

test("loaded: clears the display, starts the analysis clock (qmetro) because Listen defaults to on", () => {
    const env = device();
    env.call("loaded");
    assert.deepEqual(env.on(OUT.TICK).pop(), [1]);
    assert.equal(env.text(OUT.STATUS), "Listening...");
    assert.deepEqual(env.last(OUT.CHROMA), ["set"].concat(new Array(12).fill(0)));
    for (let i = 0; i < 5; i++) { assert.deepEqual(env.last(OUT.ROW1 + i), ["set"], "row " + i + " cleared"); }
    assert.equal(env.state.livePath, "this_device canonical_parent");
    assert.equal(env.state.bufferName, undefined, "buffer is bound lazily, on the first tick");
});

test("silence: below the gate nothing is analysed, nothing is sent, status says so", () => {
    const env = device();
    env.call("loaded"); env.call("send", 1); env.clear();
    env.run(12, "cMajorScale", -80);                       // frames present but level -80 dB < gate -50 dB
    assert.equal(env.sends().length, 0);
    assert.match(env.text(OUT.STATUS), /^Listening\.\.\. \(silence\)$/);
    assert.equal(env.ctx.sd.acc.voiced, 0);
    assert.deepEqual(env.last(OUT.CHROMA), ["set"].concat(new Array(12).fill(0)));
    assert.equal(env.state.bufferName, undefined, "spectrum is not even read while the gate is closed");
});

test("no analysis until the sample rate is known (a wrong rate would transpose the key), then it starts", () => {
    const env = device({ noSr: true });
    env.call("loaded"); env.call("send", 1);
    env.run(6, "cMajorScale", -20);
    assert.equal(env.text(OUT.STATUS), "Waiting for the sample rate");
    assert.equal(env.ctx.sd.acc.voiced, 0);
    assert.equal(env.sends().length, 0);
    env.call("sr", 1);                                    // dspstate~ also sends on/off, vector sizes: not a sample rate
    env.call("sr", 128);
    assert.equal(env.ctx.sd.sr, 0);
    env.call("sr", SR);
    env.run(8, "cMajorScale", -20);
    assert.match(env.text(OUT.STATUS), /^C Major \d+%$/);
});

test("analysis: Need more audio before 4 s, then the best group with its percentage; rows and bars follow", () => {
    const env = device();
    env.call("loaded"); env.clear();
    env.run(2.5, "cMajorScale", -20);
    assert.equal(env.text(OUT.STATUS), "Need more audio");
    assert.deepEqual(env.last(OUT.ROW1), ["set"]);
    env.run(6, "cMajorScale", -20);
    assert.equal(env.state.bufferName, "012spec", "buffer name comes from jsarguments[1]");
    assert.match(env.text(OUT.STATUS), /^C Major \d+%$/);
    const rows = [1, 2, 3, 4, 5].map((i) => env.text(OUT.ROW1 + i - 1));
    assert.equal(rows[0], env.text(OUT.STATUS));
    rows.forEach((r) => assert.match(r, /^[A-G]#? .+ \d+%$/));
    const pcts = rows.map((r) => Number(/(\d+)%$/.exec(r)[1]));
    assert.deepEqual(pcts.slice().sort((a, b) => b - a), pcts, "sorted by confidence");
    assert.match(env.text(OUT.SAME), /^same notes: .*A Natural Minor/);
    const bars = env.last(OUT.CHROMA);
    assert.equal(bars[0], "set"); assert.equal(bars.length, 13);
    assert.equal(Math.max.apply(null, bars.slice(1)), 1);
    assert.ok(bars[1] === 1, "C is the tallest bar (pedal + scale)");
    assert.ok(bars.slice(1).every((v) => v >= 0 && v <= 1));
});

test("A minor pentatonic material: the A minor family is on top (design test 11 through the whole device)", () => {
    const env = device();
    env.call("loaded");
    env.run(10, "aMinorPent", -25);
    assert.match(env.text(OUT.STATUS), /^A (Natural Minor|Minor Pentatonic) \d+%$/);
    const rows = [0, 1, 2, 3, 4].map((i) => env.text(OUT.ROW1 + i));
    assert.ok(rows.slice(0, 2).some((r) => /^A Minor Pentatonic /.test(r)), rows.join(" | "));
});

test("Send to Scale Snap off: nothing is broadcast. On: 'result <track> <root> <scaleId> <pct> ...' about once a second", () => {
    const env = device();
    env.call("loaded");
    env.run(10, "cMajorScale", -20);
    assert.equal(env.sends().length, 0, "Send is off by default");
    env.clear();
    env.call("send", 1);
    env.run(10, "cMajorScale", -20);
    const sent = env.sends();
    assert.ok(sent.length >= 8 && sent.length <= 11, "about one per second, got " + sent.length);
    sent.forEach((m) => {
        assert.equal(m[0], "result");
        assert.equal(m[1], "Bass Gtr", "the track name is ONE atom even though it has a space");
        assert.equal((m.length - 2) % 3, 0);
        assert.ok(m.length >= 5 && m.length <= 11, "1..3 triplets");
        for (let i = 2; i < m.length; i += 3) {
            assert.ok(Number.isInteger(m[i]) && m[i] >= 0 && m[i] <= 11);
            assert.equal(typeof m[i + 1], "string");
            assert.ok(Scales.indexById(m[i + 1]) >= 0, m[i + 1]);
            assert.ok(Number.isInteger(m[i + 2]) && m[i + 2] >= 0 && m[i + 2] <= 100);
        }
    });
    assert.deepEqual(sent[sent.length - 1].slice(2, 4), [0, "major"], "top triplet = C Major");
    assert.match(env.text(OUT.ROW1), /^C Major /);
});

test("the broadcast is understood by the Scale Snap MIDI device (end to end through its 'result' handler)", () => {
    const det = device();
    det.call("loaded"); det.call("send", 1);
    det.run(10, "eFrygianDom", -20);
    const msg = det.sends().pop();
    const midi = createEnv();                         // the MIDI device bundle
    midi.call("loaded"); midi.clear();
    midi.call.apply(midi, ["result"].concat(msg.slice(1)));
    const line = midi.on(11).pop().slice(1).join(" ");
    assert.match(line, /^Audio \(Bass Gtr\): E Phrygian Dominant \d+%$/);
    midi.call("audioapply");
    assert.deepEqual(midi.on(1).pop(), [4], "Key = E");
    // clearing message
    midi.clear();
    det.call("reset");
    const clear = det.sends().pop();
    assert.deepEqual(clear, ["result", "Bass Gtr"]);
    midi.call.apply(midi, ["result"].concat(clear.slice(1)));
    assert.deepEqual(midi.on(11).pop(), ["set"]);
});

test("the gate: a threshold above the level closes it, below opens it; broadcasts stop with the gate", () => {
    const env = device();
    env.call("loaded"); env.call("send", 1);
    env.call("gate", -10);                                          // level -20 dB < -10 dB gate
    env.run(8, "cMajorScale", -20);
    assert.equal(env.ctx.sd.acc.voiced, 0);
    assert.equal(env.sends().length, 0);
    env.call("gate", -40);
    env.run(8, "cMajorScale", -20);
    assert.ok(env.ctx.sd.acc.voiced > 6);
    const n = env.sends().length;
    assert.ok(n >= 3);
    env.run(3, "cMajorScale", -90);                                 // silence again
    assert.equal(env.sends().length, n, "nothing sent while the gate is closed");
    env.run(6, "cMajorScale", -90);                                 // >= 8 s of silence in total: the audio line is cleared once
    const clears = env.sends().filter((m) => m.length === 2);
    assert.equal(clears.length, 1);
    assert.deepEqual(clears[0], ["result", "Bass Gtr"]);
    env.run(4, "cMajorScale", -90);
    assert.equal(env.sends().filter((m) => m.length === 2).length, 1, "only once");
    env.call("gate", "bogus"); assert.equal(env.ctx.sd.gateDb, -40);
});

test("Reset, Send off, Listen off, device off: the audio line at the receivers is cleared and the clock stops", () => {
    const env = device();
    env.call("loaded"); env.call("send", 1);
    env.run(8, "cMajorScale", -20);
    env.clear();
    env.call("send", 0);
    assert.deepEqual(env.sends(), [["result", "Bass Gtr"]]);
    env.call("send", 0);
    assert.equal(env.sends().length, 1, "no repeated clears");
    env.call("send", 1); env.run(3, "cMajorScale", -20);
    env.clear();
    env.call("reset");
    assert.deepEqual(env.sends(), [["result", "Bass Gtr"]]);
    assert.equal(env.ctx.sd.acc.voiced, 0);
    assert.equal(env.text(OUT.STATUS), "Listening...");
    assert.deepEqual(env.last(OUT.ROW1), ["set"]);
    env.run(6, "cMajorScale", -20);
    env.clear();
    env.call("listen", 0);
    assert.deepEqual(env.on(OUT.TICK).pop(), [0]);
    assert.equal(env.text(OUT.STATUS), "Listen is off");
    assert.equal(env.sends().length, 1);
    env.clear();
    env.step("cMajorScale", -20);                                   // ticks that still arrive are ignored
    assert.equal(env.out.length, 0);
    env.call("listen", 1); env.call("active", 0);
    assert.deepEqual(env.on(OUT.TICK).pop(), [0]);
    assert.equal(env.text(OUT.STATUS), "Device is off");
    env.call("active", 1);
    assert.deepEqual(env.on(OUT.TICK).pop(), [1]);
});

test("notifydeleted tells the receivers to drop the line (through the global bus, outlets may be gone)", () => {
    const env = device();
    env.call("loaded"); env.call("send", 1);
    env.run(8, "cMajorScale", -20);
    env.sent.length = 0;
    env.call("notifydeleted");
    assert.deepEqual(env.sent, [["scalesnap.detect", "result", "Bass Gtr"]]);
    env.call("notifydeleted");
    assert.equal(env.sent.length, 1);
    const never = device();
    never.call("loaded"); never.call("notifydeleted");
    assert.equal(never.sent.length, 0, "nothing was shown, nothing to clear");
});

test("memory menu sets the averaging time: 8 s / 20 s / 60 s / hold; sample rate and track name handling", () => {
    const env = device();
    env.call("loaded");
    [[0, 8], [1, 20], [2, 60], [3, 0], [9, 0], [-4, 8]].forEach(([i, s]) => { env.call("memory", i); assert.equal(env.ctx.sd.acc.memory, s, "memory " + i); });
    env.call("sr", 96000); assert.equal(env.ctx.sd.sr, 96000);
    env.call("sr", 3); assert.equal(env.ctx.sd.sr, 96000, "nonsense ignored");
    // track name: renamed track is picked up, separators stripped, never empty
    env.state.name = "Lead, 2; (x)";
    env.call("send", 1); env.run(8, "cMajorScale", -20);
    assert.equal(env.sends().pop()[1], "Lead 2 (x)");
    const none = device({ noLive: true });
    none.call("loaded"); none.call("send", 1); none.run(8, "cMajorScale", -20);
    assert.equal(none.sends().pop()[1], "Audio", "no Live API: generic name");
    const empty = device({ trackName: "" });
    empty.call("loaded"); empty.call("send", 1); empty.run(8, "cMajorScale", -20);
    assert.equal(empty.sends().pop()[1], "Audio");
});

test("problems are reported in the status line: no level, empty spectrum, missing buffer", () => {
    let env = device();
    env.call("loaded");
    for (let i = 0; i < 16; i++) { env.step("cMajorScale", null); }          // no level message ever (snapshot~ not running)
    assert.equal(env.text(OUT.STATUS), "No audio level (is audio running?)");

    env = device();
    env.call("loaded");
    for (let i = 0; i < 20; i++) { env.step(null, -20); }                    // level ok, pfft~ writes nothing (buffer all zeros)
    assert.equal(env.text(OUT.STATUS), "No spectrum (pfft~ not writing)");
    env.step("cMajorScale", -20); env.step("cMajorScale", -20); env.step("cMajorScale", -20); env.step("cMajorScale", -20);
    assert.notEqual(env.text(OUT.STATUS), "No spectrum (pfft~ not writing)", "recovers when data appears");

    env = device();
    env.call("loaded"); env.state.peekThrows = true;
    env.run(2, "cMajorScale", -20);
    assert.equal(env.text(OUT.STATUS), "No spectrum buffer");

    env = device();
    env.call("loaded"); env.state.frameCount = 100;
    env.run(2, "cMajorScale", -20);
    assert.equal(env.text(OUT.STATUS), "Spectrum buffer too small");
});

test("stale frames (pfft~ did not refresh) are not counted twice", () => {
    const env = device();
    env.call("loaded");
    env.state.spectrum = framesOf("cMajorScale")[3];
    for (let i = 0; i < 12; i++) { env.advance(250); env.call("level", 0.01); env.call("tick"); }    // identical spectrum 12 times
    assert.ok(env.ctx.sd.acc.frames <= 1, "frames counted: " + env.ctx.sd.acc.frames);
});

test("a tick is cheap and the script has no per-sample or high-priority machinery", () => {
    const env = device();
    env.call("loaded");
    env.run(5, "aMinorPent", -20);
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 20; i++) { env.step("aMinorPent", -20); }
    const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 20;
    assert.ok(ms < 60, "avg ms per tick " + ms.toFixed(1));        // scoring runs every 2nd tick; generous bound for slow CI
    const src = fs.readFileSync(path.join(DET, "scalesnap_detect.js"), "utf8");
    assert.ok(!/\bTask\b|setInterval|setTimeout|immediate/.test(src), "timing comes from [qmetro 250], which runs at low priority");
});

// ------------------------------------------------------------------------------------------ ES5
test("ES5 only: no modern syntax in the audio device scripts", () => {
    ["chroma.js", "scalesnap_detect.js"].forEach((f) => {
        assert.deepEqual(es5Problems(fs.readFileSync(path.join(DET, f), "utf8"), f), []);
    });
    // the shared modules are bundled, not forked: the bundle must contain them verbatim
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ssd-"));
    const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "build_amxd.py"), "--out", tmp], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const bundle = fs.readFileSync(path.join(tmp, "scalesnap_detect.js"), "utf8");
    ["scales.js", "detect.js"].forEach((f) => assert.ok(bundle.indexOf(fs.readFileSync(path.join(SRC, f), "utf8").trimEnd()) >= 0, f + " not bundled verbatim"));
    assert.deepEqual([...bundle.matchAll(/\/\* ---- (\S+) ---- \*\//g)].map((m) => m[1]), ["scales.js", "detect.js", "chroma.js", "scalesnap_detect.js"]);
    fs.rmSync(tmp, { recursive: true, force: true });
});

// ------------------------------------------------------------------------------------------ patchers
const mainFile = path.join(DET, "Scale Snap Detect.maxpat");
const specFile = path.join(DET, "ssd.spec.maxpat");
const main = JSON.parse(fs.readFileSync(mainFile, "utf8")).patcher;
const spec = JSON.parse(fs.readFileSync(specFile, "utf8")).patcher;
const boxes = main.boxes.map((b) => b.box);
const byVar = (v) => boxes.find((b) => b.varname === v);
const byText = (re) => boxes.find((b) => re.test(b.text || ""));
const textOf = (id) => { const b = boxes.find((x) => x.id === id); return b.text || b.maxclass; };
const jsSource = fs.readFileSync(path.join(DET, "scalesnap_detect.js"), "utf8");

test("device settings: AUDIO effect, 169 px high, opens in presentation, Max 8, no [v8]", () => {
    assert.equal(main.project.amxdtype, 1633771873);
    assert.equal(main.openrect[3], 169);
    assert.ok(main.openrect[2] >= 300 && main.openrect[2] <= 600);
    assert.equal(main.openinpresentation, 1);
    assert.equal(main.appversion.major, 8);
    assert.equal(main.latency, 0);
    assert.ok(!boxes.some((b) => /^v8(\.|\s|$)/.test(b.text || "")), "no [v8]: Max 9 only");
});

test("audio passes through untouched: plugin~ -> plugout~ directly, both channels, nothing else feeds plugout~", () => {
    const into = main.lines.filter((l) => textOf(l.patchline.destination[0]) === "plugout~")
        .map((l) => textOf(l.patchline.source[0]) + ":" + l.patchline.source[1] + ">" + l.patchline.destination[1]).sort();
    assert.deepEqual(into, ["plugin~:0>0", "plugin~:1>1"]);
    assert.equal(byText(/^plugin~$/).numoutlets, 2);
    assert.equal(byText(/^plugout~$/).numinlets, 2);
});

test("analysis chain: mono sum -> pfft~ (FFT size/overlap = ScaleSnapChroma.PARAMS); level via average~ + snapshot~ 250", () => {
    const pfft = byText(/^pfft~ /);
    const m = /^pfft~ (\S+) (\d+) (\d+)$/.exec(pfft.text);
    assert.ok(m, pfft.text);
    assert.equal(m[1], "ssd.spec");
    assert.equal(Number(m[2]), P.fftSize);
    assert.equal(Number(m[3]), P.overlap);
    const edges = main.lines.map((l) => [textOf(l.patchline.source[0]), textOf(l.patchline.destination[0])]);
    const has = (a, b) => edges.some((e) => e[0] === a && e[1] === b);
    assert.ok(has("plugin~", "+~") && has("+~", "*~ 0.5") && has("*~ 0.5", pfft.text));
    assert.ok(has("*~ 0.5", "*~") && has("*~", "average~ 16384") && has("average~ 16384", "snapshot~ 250") && has("snapshot~ 250", "prepend level"));
    assert.ok(has("prepend level", jsText()));
    // sample rate: dspstate~ and a [sig~ 1000] -> [mstosamps~] -> [snapshot~] probe both report "sr"
    assert.ok(has("sig~ 1000", "mstosamps~") && has("mstosamps~", "snapshot~ 250") && has("snapshot~ 250", "prepend sr"));
    assert.ok(has("dspstate~", "prepend sr") && has("prepend sr", jsText()));
    function jsText() { return byText(/^js /).text; }
    // no [js] on any signal connection: JavaScript never sees samples
    const js = byText(/^js /);
    main.lines.forEach((l) => {
        const s = boxes.find((b) => b.id === l.patchline.source[0]);
        if ((s.outlettype || [])[l.patchline.source[1]] === "signal") {
            assert.notEqual(l.patchline.destination[0], js.id);
        }
    });
    assert.equal(js.numoutlets, 10);
});

test("pfft~ sub-patcher: fftin~ (Hann) -> cartopol~ -> poke~ into the same device-local buffer~ the script reads", () => {
    const sb = spec.boxes.map((b) => b.box);
    const t = (re) => sb.find((b) => re.test(b.text || ""));
    assert.equal(t(/^fftin~ /).text, "fftin~ 1 hanning");
    assert.ok(t(/^cartopol~$/));
    const poke = t(/^poke~ /);
    const buf = byText(/^buffer~ /);
    assert.equal(poke.text.split(" ")[1], buf.text.split(" ")[1], "poke~ and buffer~ use one name");
    assert.ok(/^---/.test(buf.text.split(" ")[1]), "three dashes: local to the device instance");
    assert.equal(byText(/^js /).text, "js scalesnap_detect.js " + buf.text.split(" ")[1], "the script gets the buffer name as jsarguments[1]");
    assert.equal(boxes.find((b) => b.maxclass === "message" && /^sizeinsamps/.test(b.text)).text, "sizeinsamps " + P.bins);
    assert.equal(P.bins, P.fftSize / 2);
    const edge = (a, ao, b, bi) => spec.lines.some((l) => textOfSpec(l.patchline.source[0]) === a && l.patchline.source[1] === ao &&
        textOfSpec(l.patchline.destination[0]) === b && l.patchline.destination[1] === bi);
    function textOfSpec(id) { return sb.find((b) => b.id === id).text; }
    assert.ok(edge("fftin~ 1 hanning", 0, "cartopol~", 0) && edge("fftin~ 1 hanning", 1, "cartopol~", 1));
    assert.ok(edge("cartopol~", 0, poke.text, 0), "amplitude is written");
    assert.ok(edge("fftin~ 1 hanning", 2, poke.text, 1), "bin index addresses the buffer");
    assert.ok(fs.existsSync(specFile) && path.dirname(specFile) === path.dirname(mainFile), "next to the device");
});

test("qmetro 250 is the only clock; started/stopped by the script; ticks go back to the script", () => {
    const qm = byText(/^qmetro /);
    assert.equal(qm.text, "qmetro 250");
    assert.match(jsSource, /var TICK_MS = 250;/);
    const js = byText(/^js /);
    const fromJs = main.lines.filter((l) => l.patchline.source[0] === js.id && l.patchline.source[1] === OUT.TICK);
    assert.equal(fromJs.length, 1);
    assert.equal(fromJs[0].patchline.destination[0], qm.id);
    const toMsg = main.lines.find((l) => l.patchline.source[0] === qm.id);
    assert.equal(textOf(toMsg.patchline.destination[0]), "tick");
    assert.equal(byText(/^snapshot~ /).text, "snapshot~ 250");
});

test("[js] object: outlet count, and every message the patcher sends is a function in the script", () => {
    const js = byText(/^js /);
    assert.equal(js.numoutlets, Number(/outlets\s*=\s*(\d+)/.exec(jsSource)[1]));
    assert.equal(js.numinlets, Number(/inlets\s*=\s*(\d+)/.exec(jsSource)[1]));
    const fns = {};
    jsSource.replace(/^function\s+(\w+)\s*\(/gm, (_, n) => { fns[n] = true; });
    const sent = [];
    boxes.forEach((b) => {
        if (/^prepend /.test(b.text || "")) { sent.push(b.text.split(" ")[1]); }
        if (b.maxclass === "message") { sent.push(b.text); }
    });
    sent.filter((s) => !/^(sizeinsamps|250)/.test(s)).forEach((s) => assert.ok(fns[s], "script has no function " + s));
    ["loaded", "reset", "tick", "level", "sr", "active", "listen", "send", "memory", "gate"].forEach((s) => assert.ok(sent.indexOf(s) >= 0, "patcher never sends " + s));
});

test("script outlets go to the intended objects (and OUT in the script matches)", () => {
    const map = {};
    /OUT\s*=\s*\{([^}]*)\}/.exec(jsSource)[1].replace(/(\w+)\s*:\s*(\d+)/g, (_, k, v) => { map[k] = Number(v); return ""; });
    assert.deepEqual(map, OUT);
    const js = byText(/^js /);
    const dest = (k) => {
        const l = main.lines.find((x) => x.patchline.source[0] === js.id && x.patchline.source[1] === OUT[k]);
        assert.ok(l, k + " not connected");
        return boxes.find((b) => b.id === l.patchline.destination[0]);
    };
    assert.equal(dest("SEND").text, "s scalesnap.detect");
    assert.equal(dest("CHROMA").maxclass, "multislider");
    for (let i = 1; i <= 5; i++) { assert.equal(dest("ROW" + i).varname, "ROW" + i); }
    assert.equal(dest("SAME").varname, "SAME");
    assert.equal(dest("STATUS").varname, "STATUS");
    assert.equal(dest("TICK").text, "qmetro 250");
});

test("parameters: live.* objects with unique long names, short names, stable ids", () => {
    const params = boxes.filter((b) => b.parameter_enable === 1);
    const longs = params.map((b) => b.saved_attribute_attributes.valueof.parameter_longname);
    assert.deepEqual(longs.slice().sort(), ["Gate Threshold", "Listen", "Memory", "Send to Scale Snap"]);
    params.forEach((b) => {
        assert.ok(/^live\./.test(b.maxclass), b.maxclass);
        const v = b.saved_attribute_attributes.valueof;
        assert.ok(v.parameter_shortname && v.parameter_shortname.length <= 16);
        assert.equal(b.varname, v.parameter_longname);
        assert.ok(main.parameters[b.id]);
    });
    const v = (n) => byVar(n).saved_attribute_attributes.valueof;
    assert.equal(v("Listen").parameter_initial[0], 1);
    assert.equal(v("Send to Scale Snap").parameter_initial[0], 0, "never broadcasts until the user enables it");
    assert.equal(byVar("Listen").mode, 1); assert.equal(byVar("Send to Scale Snap").mode, 1);
    assert.equal(v("Memory").parameter_enum.length, P.memorySeconds.length);
    assert.deepEqual(v("Memory").parameter_enum.map((e) => (/(\d+) s/.exec(e) || [0, 0])[1] * 1), P.memorySeconds);
    assert.equal(v("Memory").parameter_initial[0], 1, "Medium (20 s)");
    assert.equal(v("Gate Threshold").parameter_unitstyle, 4, "dB");
    assert.ok(v("Gate Threshold").parameter_mmin < -50 && v("Gate Threshold").parameter_mmax > -30);
    assert.equal(v("Gate Threshold").parameter_initial[0], -50);
});

test("the UI has everything the spec asks for", () => {
    ["Listen", "RESET", "Send to Scale Snap", "Memory", "Gate Threshold", "CHROMA", "ROW1", "ROW2", "ROW3", "ROW4", "ROW5", "STATUS", "SAME"]
        .forEach((n) => assert.ok(byVar(n), "missing " + n));
    const ms = byVar("CHROMA");
    assert.equal(ms.size, 12);
    assert.deepEqual(ms.setminmax, [0, 1]);
    assert.equal(ms.ignoreclick, 1, "display only");
    const labels = boxes.filter((b) => /^NOTE_/.test(b.varname || "")).sort((a, b) => a.presentation_rect[0] - b.presentation_rect[0]).map((b) => b.text);
    assert.deepEqual(labels, Scales.NOTE_NAMES);
    assert.equal(byVar("RESET").mode, 0);
});

test("presentation layout fits the 169 px device and objects do not overlap", () => {
    const W = main.openrect[2], H = main.openrect[3];
    const pres = boxes.filter((b) => b.presentation === 1);
    assert.ok(pres.length >= 25);
    pres.forEach((b) => {
        const [x, y, w, h] = b.presentation_rect;
        assert.ok(x >= 0 && y >= 0 && x + w <= W + 1e-9 && y + h <= H, (b.varname || b.text) + " outside device: " + b.presentation_rect);
    });
    for (let i = 0; i < pres.length; i++) {
        for (let j = i + 1; j < pres.length; j++) {
            const a = pres[i].presentation_rect, b = pres[j].presentation_rect;
            const overlap = a[0] < b[0] + b[2] - 1e-9 && b[0] < a[0] + a[2] - 1e-9 && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
            assert.ok(!overlap, pres[i].varname + " overlaps " + pres[j].varname);
        }
    }
});

test("gen_patcher_detect.py --check passes (committed patchers are not stale)", () => {
    const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "gen_patcher_detect.py"), "--check"], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
});

// ------------------------------------------------------------------------------------------ .amxd
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ssdamxd-"));
const build = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "build_amxd.py"), "--out", tmp], { encoding: "utf8" });
const amxdPath = path.join(tmp, "Scale Snap Detect.amxd");

function parseAmxd(buf) {
    const chunks = [];
    let pos = 0;
    while (pos < buf.length) {
        const tag = buf.toString("ascii", pos, pos + 4);
        const len = buf.readUInt32LE(pos + 4);
        assert.ok(pos + 8 + len <= buf.length, "chunk " + tag + " overruns the file");
        chunks.push({ tag: tag, len: len, data: buf.subarray(pos + 8, pos + 8 + len) });
        pos += 8 + len;
    }
    return chunks;
}

test("build_amxd.py builds both devices and copies the pfft~ sub-patcher next to the audio device", () => {
    assert.equal(build.status, 0, build.stdout + build.stderr);
    ["Scale Snap.amxd", "Scale Snap Detect.amxd", "scalesnap.js", "scalesnap_detect.js", "ssd.spec.maxpat", "INSTALL.md"]
        .forEach((f) => assert.ok(fs.existsSync(path.join(tmp, f)), f));
    assert.equal(fs.readFileSync(path.join(tmp, "ssd.spec.maxpat"), "utf8"), fs.readFileSync(specFile, "utf8"));
});

test("Scale Snap Detect.amxd: ampf('aaaa') + meta + ptch(JSON, NUL terminated); re-parses to the source patcher", () => {
    const buf = fs.readFileSync(amxdPath);
    assert.equal(buf.toString("ascii", 8, 12), "aaaa", "audio effect");
    const chunks = parseAmxd(buf);
    assert.deepEqual(chunks.map((c) => c.tag), ["ampf", "meta", "ptch"]);
    assert.equal(chunks[0].len, 4); assert.equal(chunks[1].len, 4);
    const ptch = chunks[2];
    assert.equal(ptch.data[ptch.len - 1], 0);
    assert.notEqual(ptch.data.toString("ascii", 0, 4), "mx@c");
    const json = JSON.parse(ptch.data.subarray(0, ptch.len - 1).toString("utf8"));
    assert.deepEqual(json, JSON.parse(fs.readFileSync(mainFile, "utf8")));
    assert.equal(json.patcher.project.amxdtype, 1633771873);
    const ver = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "build_amxd.py"), "--verify", amxdPath], { encoding: "utf8" });
    assert.equal(ver.status, 0, ver.stderr);
    assert.match(ver.stdout, /Audio Effect/);
    const midi = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "build_amxd.py"), "--verify", path.join(tmp, "Scale Snap.amxd")], { encoding: "utf8" });
    assert.match(midi.stdout, /MIDI Effect/, "the MIDI device is still a MIDI effect");
});

test("the audio device's js bundle loads in a bare context and defines the handlers the patcher sends", () => {
    const code = fs.readFileSync(path.join(tmp, "scalesnap_detect.js"), "utf8");
    const ctx = vm.createContext({ outlet() {}, post() {}, messnamed() {}, arrayfromargs: (a) => Array.prototype.slice.call(a),
        jsarguments: ["scalesnap_detect.js", "x"], Buffer: function () {}, LiveAPI: function () {} });
    vm.runInContext(code, ctx);
    ["ScaleSnapScales", "ScaleSnapDetect", "ScaleSnapChroma"].forEach((n) => assert.equal(typeof ctx[n], "object", n));
    assert.equal(typeof ctx.ScaleSnapSnap, "undefined", "the audio device does not need the snap module");
    assert.equal(ctx.outlets, 10);
    ["loaded", "active", "listen", "send", "memory", "gate", "reset", "sr", "level", "tick"].forEach((f) => assert.equal(typeof ctx[f], "function", f));
    assert.equal(ctx.sd.bufName, "x");
});

test.after(() => { fs.rmSync(tmp, { recursive: true, force: true }); });
