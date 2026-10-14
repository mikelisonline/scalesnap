"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { SRC } = require("./helpers");
const { createEnv, bundleSource } = require("./maxenv");
const Scales = require(path.join(SRC, "scales.js"));
const Snap = require(path.join(SRC, "snap.js"));

const OUT = { MAP: 0, KEY: 1, CATEGORY: 2, SCALES: 3, UID: 4, STAR: 5, KB: 6, INFO: 7, RESULTS: 8, SAME: 9, STATUS: 10, AUDIO: 11 };

function mapTable(env) {
    const t = {};
    env.on(OUT.MAP).forEach((a) => { t[a[0]] = a[1]; });
    return t;
}
// The scale id goes to three hidden 8-bit parameters: the script sends [high mid low].
const uidOf = (a) => (a[0] << 16) | (a[1] << 8) | a[2];
const lastUid = (env) => { const m = env.on(OUT.UID); return m.length ? uidOf(m[m.length - 1]) : null; };
const text = (env, out) => { const m = env.on(out); return m.length ? m[m.length - 1].slice(1).join(" ") : null; };

test("bundle loads without require/module and declares 12 outlets", () => {
    const env = createEnv();
    assert.equal(env.ctx.outlets, 12);
    assert.equal(env.ctx.inlets, 1);
    assert.equal(typeof env.ctx.module, "undefined");
});

test("loaded: writes the full 128-entry table (output note + 1) and refreshes the UI", () => {
    const env = createEnv();
    env.call("loaded");
    const t = mapTable(env);
    assert.equal(Object.keys(t).length, 128);
    assert.equal(t[60], 61);  // C stays C
    assert.equal(t[61], 61);  // C# -> C (tie down) => 60 + 1
    assert.equal(t[63], 63);  // D# -> D => 62 + 1
    assert.deepEqual(env.on(OUT.SCALES)[0], ["clear"]);
    assert.equal(env.on(OUT.SCALES).filter((a) => a[0] === "append").length, 162);
    assert.deepEqual(env.on(OUT.SCALES).pop(), ["set", 0]);
    const kb = env.on(OUT.KB);
    assert.deepEqual(kb[0], ["clear"]);
    assert.equal(kb.length - 1, 21); // 36 keys, 21 in C major
    assert.match(text(env, OUT.INFO), /^Major: Ionian/);
    assert.deepEqual(env.on(OUT.STAR).pop(), ["set", 0]);
    assert.ok(env.tasks.some((t) => t.running), "settle task scheduled");
});

test("key/mode/power/scale changes send only the entries that changed", () => {
    const env = createEnv();
    env.call("loaded"); env.clear();
    env.call("key", 2);                                  // D major
    let t = mapTable(env);
    assert.ok(Object.keys(t).length > 0 && Object.keys(t).length < 128);
    const want = Snap.encodeMap(Snap.buildMap(2, Scales.SCALES[0].mask, 0));
    Object.keys(t).forEach((i) => assert.equal(t[i], want[i]));
    env.clear();
    env.call("mode", 4);                                 // Block
    t = mapTable(env);
    Object.keys(t).forEach((i) => assert.equal(t[i], Snap.encodeMap(Snap.buildMap(2, Scales.SCALES[0].mask, 4))[i]));
    assert.equal(t[63], 0);                              // D# is not in D major: blocked
    env.clear();
    env.call("power", 0);                                // bypass = identity table
    t = mapTable(env);
    Object.keys(t).forEach((i) => assert.equal(t[i], Number(i) + 1));
    assert.equal(t[60], 61);
    env.clear();
    env.call("power", 1);
    assert.equal(Object.keys(mapTable(env)).length, Object.keys(t).length);
    env.clear();
    env.call("mode", 4);                                 // same value again: nothing to send
    assert.equal(env.on(OUT.MAP).length, 0);
});

test("scale selection by menu position and by stable uid", () => {
    const env = createEnv();
    env.call("loaded");
    env.call("category", 1 + 1 + Scales.CATEGORIES.indexOf("Japanese")); // 2 + index
    const japanese = Scales.indicesInCategory("Japanese");
    env.clear();
    env.call("scalemenu", 1);
    const idx = japanese[1];
    assert.equal(lastUid(env), Scales.SCALES[idx].uid);
    assert.match(text(env, OUT.INFO), new RegExp("^" + Scales.SCALES[idx].name.split(" ")[0]));
    const t = mapTable(env);
    const want = Snap.encodeMap(Snap.buildMap(0, Scales.SCALES[idx].mask, 0));
    Object.keys(t).forEach((i) => assert.equal(t[i], want[i]));

    env.clear();
    env.call("scaleuid", Scales.SCALES[7].uid);          // restore from a saved Live Set
    assert.equal(lastUid(env), Scales.SCALES[7].uid);
    env.clear();
    env.call("scaleuid", Scales.SCALES[7].uid);          // echo of our own output: no-op (no loop)
    assert.equal(env.out.length, 0);
    env.call("scaleuid", 12345);                         // unknown uid ignored
    assert.equal(env.out.length, 0);
});

test("Scale ID: 24-bit uid <-> three 8-bit Int parameters, exact for every scale and robust to quantisation", () => {
    // What the device does with a stored Set: Live hands back each hidden parameter as a number in 0..255
    // (an Int parameter; Max for Live's Int type is 0-255), possibly as a float that only needs rounding.
    Scales.SCALES.forEach((sc) => {
        const env = createEnv();
        env.call("loaded"); env.clear();
        env.call("scaleuid", Scales.SCALES[sc === Scales.SCALES[0] ? 1 : 0].uid);   // be somewhere else first
        env.clear();
        env.call("scaleuid", sc.uid);                                              // what the script writes ...
        const bytes = env.on(OUT.UID).pop();
        assert.equal(bytes.length, 3, sc.id);
        bytes.forEach((b) => assert.ok(Number.isInteger(b) && b >= 0 && b <= 255, sc.id + " byte " + b));
        assert.equal(uidOf(bytes), sc.uid);

        // ... and what comes back from a Set, in every arrival order, with float noise
        const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        orders.forEach((order, oi) => {
            const e2 = createEnv();
            e2.call("loaded"); e2.clear();
            order.forEach((k) => e2.call("scaleuidbyte", k, bytes[k] + (oi % 2 ? 0.3 : -0.3)));
            assert.equal(e2.ctx.ss.scaleIndex, Scales.indexByUid(sc.uid), sc.id + " order " + order.join(""));
            assert.equal(lastUid(e2) === null || lastUid(e2) === sc.uid, true, "no wrong scale is announced at the end");
        });
    });
});

test("Scale ID bytes: out-of-range and unknown values are ignored; our own echo does nothing", () => {
    const env = createEnv();
    env.call("loaded");
    env.call("scaleuid", Scales.SCALES[7].uid);
    const bytes = env.on(OUT.UID).pop();
    env.clear();
    bytes.forEach((b, k) => env.call("scaleuidbyte", k, b));    // the three parameters report what we just wrote
    assert.equal(env.out.length, 0, "echo of our own output is a no-op");
    env.call("scaleuidbyte", 2, (bytes[2] + 1) & 255);          // a uid that no scale has
    assert.equal(env.ctx.ss.scaleIndex, 7);
    env.call("scaleuidbyte", 5, 3);                             // not a byte number
    env.call("scaleuidbyte", 0, "x");
    assert.equal(env.ctx.ss.scaleIndex, 7);
    assert.equal(env.out.length, 0);
});

test("category filter: menu contents, selection shown as -1 when the scale is elsewhere", () => {
    const env = createEnv();
    env.call("loaded"); env.clear();
    env.call("category", 2 + Scales.CATEGORIES.indexOf("Japanese"));
    const appended = env.on(OUT.SCALES).filter((a) => a[0] === "append").map((a) => a.slice(1).join(" "));
    assert.deepEqual(appended, Scales.indicesInCategory("Japanese").map((i) => Scales.SCALES[i].name.replace(/[;,]/g, " -")));
    assert.deepEqual(env.on(OUT.SCALES).pop(), ["set", -1]);
    env.clear();
    env.call("category", 0);
    assert.deepEqual(env.on(OUT.SCALES).pop(), ["set", 0]);
});

test("prev/next step through the filtered list and wrap around", () => {
    const env = createEnv();
    env.call("loaded");
    env.call("category", 2);                              // Major & Modes (11)
    const list = Scales.indicesInCategory("Major & Modes");
    env.call("prev");                                     // from index 0: wraps to the last
    assert.equal(lastUid(env), Scales.SCALES[list[list.length - 1]].uid);
    env.call("next");
    assert.equal(lastUid(env), Scales.SCALES[list[0]].uid);
    env.call("category", 2 + Scales.CATEGORIES.indexOf("Persian"));
    env.clear();
    env.call("next");                                     // current scale not in list: jump to its first
    assert.equal(lastUid(env), Scales.SCALES[Scales.indicesInCategory("Persian")[0]].uid);
});

test("favorites: toggle persists, star updates, Favorites category lists them, other devices are notified", () => {
    const env = createEnv();
    env.call("loaded");
    env.call("scaleuid", Scales.SCALES[Scales.indexById("hirajoshi")].uid);
    env.clear();
    env.call("togglefav");
    assert.deepEqual(env.on(OUT.STAR).pop(), ["set", 1]);
    assert.deepEqual(env.sent.pop(), ["scalesnap.favorites", "changed"]);
    const file = Object.keys(env.files)[0];
    assert.deepEqual(JSON.parse(env.files[file]).favorites, ["hirajoshi"]);

    env.call("scaleuid", Scales.SCALES[0].uid);
    assert.deepEqual(env.on(OUT.STAR).pop(), ["set", 0]);
    env.call("category", 1);                              // Favorites
    const appended = env.on(OUT.SCALES).filter((a) => a[0] === "append");
    assert.equal(appended.slice(-1)[0].join(" "), "append Hirajoshi");

    // A second device (new env sharing the same file) sees the favorite after a restart
    const env2 = createEnv({ files: env.files });
    env2.call("loaded"); env2.clear();
    env2.call("category", 1);
    assert.equal(env2.on(OUT.SCALES).filter((a) => a[0] === "append").length, 1);

    // favchanged from another device refreshes the list
    const f = JSON.parse(env.files[file]); f.favorites.push("dorian"); env.files[file] = JSON.stringify(f);
    env.clear();
    env.call("favchanged");
    assert.equal(env.on(OUT.SCALES).filter((a) => a[0] === "append").length, 2);
    env.clear();
    env.call("favchanged");                               // unchanged: no work
    assert.equal(env.out.length, 0);
});

test("MIDI detection: listen, results, apply sets key and scale", () => {
    const env = createEnv();
    env.call("loaded");
    env.call("listen", 1);
    const tune = [62, 66, 69, 62, 64, 66, 67, 69, 71, 73, 74, 73, 71, 69, 67, 66, 64, 62, 62]; // D major
    let n = 0;
    while (n < 40 || env.tasks.length === 0) {
        tune.forEach((p) => {
            env.call("note", p, 100); env.advance(450); env.call("note", p, 0); env.advance(50);
            env.tasks.forEach((t) => t.fire());
            env.advance(0);
        });
        n++;
        if (n > 4) { break; }
    }
    // drive the 250 ms ticker
    for (let i = 0; i < 8; i++) { env.advance(250); env.tasks.forEach((t) => t.fire()); }
    const results = env.on(OUT.RESULTS).filter((a) => a[0] === "append").map((a) => a.slice(1).join(" "));
    assert.ok(results.some((r) => /^D Major \d+%$/.test(r)), results.join(" | "));
    assert.match(text(env, OUT.STATUS) || "", /Listening/);
    env.clear();
    env.call("resultselect", 0);
    env.call("apply");
    assert.deepEqual(env.on(OUT.KEY).pop(), [2]);
    assert.match(text(env, OUT.STATUS), /^Applied D Major/);
    const t = mapTable(env);
    const want = Snap.encodeMap(Snap.buildMap(2, Scales.SCALES[0].mask, 0));
    Object.keys(t).forEach((i) => assert.equal(t[i], want[i]));
});

test("detection needs listening, shows progress, and Reset clears", () => {
    const env = createEnv();
    env.call("loaded");
    env.call("note", 60, 100);                            // not listening: ignored
    env.call("listen", 1);
    env.call("note", 60, 100); env.advance(300); env.call("note", 60, 0);
    env.advance(250);
    env.call("reset");
    assert.match(text(env, OUT.STATUS), /Listening... 0 notes/);
    env.call("listen", 0);
    assert.match(text(env, OUT.STATUS), /Stopped/);
    assert.ok(env.tasks.every((t) => !t.running || t === env.tasks[0]));
});

test("apply of a scale outside the current category switches to All Scales", () => {
    const env = createEnv();
    env.call("loaded");
    env.call("category", 2 + Scales.CATEGORIES.indexOf("Japanese"));
    env.clear();
    env.call("result", "Bass Gtr", 9, "minor_pentatonic", 71, 9, "natural_minor", 12);
    assert.equal(text(env, OUT.AUDIO), "Audio (Bass Gtr): A Minor Pentatonic 71%");
    env.call("audioapply");
    assert.deepEqual(env.on(OUT.CATEGORY).pop(), [0]);
    assert.deepEqual(env.on(OUT.KEY).pop(), [9]);
    assert.equal(lastUid(env), Scales.SCALES[Scales.indexById("minor_pentatonic")].uid);
});

test("audio result parsing: multi-word track names, empty results, unknown scales", () => {
    const env = createEnv();
    env.call("loaded"); env.clear();
    env.call("result", "My", "Bass", "Track", 4, "phrygian", 80);
    assert.equal(text(env, OUT.AUDIO), "Audio (My Bass Track): E Phrygian 80%");
    env.call("result", "My", "Bass", "Track");            // cleared by the same device
    assert.deepEqual(env.on(OUT.AUDIO).pop(), ["set"]);
    env.call("audioapply");
    assert.match(text(env, OUT.STATUS), /No audio result/);
    env.clear();
    env.call("result", "Bass", 4, "no_such_scale", 80);   // not a result: shows nothing
    assert.ok(!env.on(OUT.AUDIO).some((a) => a[0] === "set" && a.length > 1));
});

test("Fav pressed while the Favorites category is shown refreshes the Scale menu and Prev/Next", () => {
    const env = createEnv();
    env.call("loaded");
    const appended = () => env.on(OUT.SCALES).filter((a) => a[0] === "append").map((a) => a.slice(1).join(" "));
    const dorian = Scales.indexById("dorian"), hirajoshi = Scales.indexById("hirajoshi");
    env.call("scaleuid", Scales.SCALES[dorian].uid); env.call("togglefav");
    env.call("scaleuid", Scales.SCALES[hirajoshi].uid); env.call("togglefav");
    env.call("favchanged");                                // Max delivers our own broadcast back to us
    env.call("category", 1);                               // Favorites: [Dorian, Hirajoshi]
    env.clear();
    env.call("category", 1);
    assert.deepEqual(appended(), ["Dorian", "Hirajoshi"]);

    // un-favorite the current scale (Hirajoshi): it leaves the menu at once, selection shows nothing
    env.clear();
    env.call("togglefav");
    env.call("favchanged");
    assert.deepEqual(appended(), ["Dorian"], "menu rebuilt without Hirajoshi");
    assert.deepEqual(env.on(OUT.SCALES).pop(), ["set", -1]);
    assert.deepEqual(env.on(OUT.STAR).pop(), ["set", 0]);
    env.clear();
    env.call("next");                                      // Prev/Next only know the remaining favorite
    assert.equal(lastUid(env), Scales.SCALES[dorian].uid);

    // favorite another scale while in Favorites: it appears at once
    env.call("category", 0);
    env.call("scaleuid", Scales.SCALES[Scales.indexById("blues")].uid);
    env.call("category", 1);
    env.clear();
    env.call("togglefav");
    env.call("favchanged");
    assert.deepEqual(appended().sort(), ["Blues", "Dorian"]);
    assert.deepEqual(env.on(OUT.SCALES).pop(), ["set", env.ctx.ss.list.indexOf(Scales.indexById("blues"))]);
    assert.equal(env.ctx.ss.list.length, 2);
});

test("a clear from one Detect device only clears its own result; others stay", () => {
    const env = createEnv();
    env.call("loaded"); env.clear();
    env.call("result", "Keys", 9, "natural_minor", 74);
    assert.equal(text(env, OUT.AUDIO), "Audio (Keys): A Natural Minor 74%");

    env.clear();
    env.call("result", "Bass");                           // Bass has nothing to show (Send off / silent)
    assert.equal(env.on(OUT.AUDIO).length, 0, "the line for Keys is not touched");
    env.call("audioapply");
    assert.equal(text(env, OUT.STATUS), "Applied audio result", "Keys' result is still current");
    assert.deepEqual(env.on(OUT.KEY).pop(), [9]);

    // several tracks: the most recent non-empty one is shown, and clearing it falls back to the other
    env.call("result", "Bass", 4, "phrygian", 80);
    assert.equal(text(env, OUT.AUDIO), "Audio (Bass): E Phrygian 80%");
    env.call("result", "Bass");
    assert.equal(text(env, OUT.AUDIO), "Audio (Keys): A Natural Minor 74%");
    env.call("result", "Keys");
    assert.deepEqual(env.on(OUT.AUDIO).pop(), ["set"]);
    env.clear();
    env.call("audioapply");
    assert.match(text(env, OUT.STATUS), /No audio result/);
});

test("Snap Clip / Analyze Clip use the Live API and report in the status line", () => {
    const written = [];
    const notes = [60, 61, 63, 64, 66, 67].map((p, i) => ({ note_id: i + 1, pitch: p, start_time: i, duration: 1, velocity: 100, mute: 0 }));
    function API() {
        this.id = "5";
        this.get = (p) => (p === "is_midi_clip" ? [1] : [8]);
        this.call = function (name, arg) {
            if (name === "get_notes_extended") { return JSON.stringify({ notes: notes }); }
            written.push(JSON.parse(arg)); return undefined;
        };
    }
    const env = createEnv({ LiveAPI: API });
    env.call("loaded"); env.clear();
    env.call("snapclip");
    assert.match(text(env, OUT.STATUS), /^Snapped 3 notes/);
    const pitches = written[0].notes.map((n) => n.pitch);
    pitches.forEach((p) => assert.ok(Snap.inScale(p, 0, Scales.SCALES[0].mask)));
    env.clear();
    env.call("analyze");
    assert.ok(env.on(OUT.RESULTS).some((a) => a[0] === "append"));
    const bad = createEnv();
    bad.call("loaded"); bad.clear();
    bad.call("snapclip");
    assert.match(text(bad, OUT.STATUS), /Live API unavailable/);
});

test("text sent to comments never contains Max separators", () => {
    const env = createEnv();
    env.call("loaded");
    Scales.SCALES.forEach((s) => {
        env.clear();
        env.call("scaleuid", s.uid);
        env.on(OUT.INFO).concat(env.on(OUT.SCALES)).forEach((a) => a.forEach((w) => assert.ok(!/[;,]/.test(String(w)), s.id + ": " + w)));
    });
});

test("ES5 only: no modern syntax in any device script", () => {
    const strip = (src) => src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
        .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
        .replace(/\/(?![*/])(?:[^/\\\n]|\\.)+\/[gimy]*(?=\s*[.,;)])/g, "/re/");
    const bad = [
        [/=>/, "arrow function"], [/`/, "template literal"], [/\b(let|const)\s+[\w{[]/, "let/const"],
        [/\bclass\s+\w+/, "class"], [/\.\.\.[\w[(]/, "spread/rest"], [/\bfor\s*\([^)]*\sof\s/, "for-of"],
        [/\basync\b|\bawait\b/, "async/await"], [/\byield\b/, "generator"], [/\*\*[^/]/, "exponent operator"],
        [/\bfunction\s*\w*\s*\([^)]*=[^)]*\)/, "default parameter"], [/\b(Map|Set|Promise|Symbol)\s*\(/, "ES6 global"],
        [/\bnew\s+(Map|Set|WeakMap|Promise)\b/, "ES6 global"], [/\.(includes|startsWith|endsWith|padStart|find|findIndex)\s*\(/, "ES6+ method"],
        [/\bObject\.(assign|entries|values)\b/, "ES2015+ Object method"], [/\brequire\s*\(/, null]
    ];
    ["scales.js", "snap.js", "detect.js", "favorites.js", "clip.js", "scalesnap_main.js"].forEach((f) => {
        const src = strip(fs.readFileSync(path.join(SRC, f), "utf8"));
        bad.forEach(([re, what]) => {
            if (what === null) { return; }
            const m = re.exec(src);
            assert.ok(!m, f + ": " + what + " near '" + (m && src.substr(m.index, 40).replace(/\n/g, " ")) + "'");
        });
    });
    // [js] has no require: the only allowed use is behind a typeof guard in detect.js
    const detect = fs.readFileSync(path.join(SRC, "detect.js"), "utf8");
    assert.match(detect, /typeof ScaleSnapScales !== "undefined"\) \? ScaleSnapScales : require/);
    assert.ok(bundleSource().length > 20000);
});
