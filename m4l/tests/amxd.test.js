"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const vm = require("vm");
const { ROOT, SRC } = require("./helpers");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ssamxd-"));
const build = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "build_amxd.py"), "--unfrozen", "--out", tmp], { encoding: "utf8" });
const amxdPath = path.join(tmp, "Scale Snap.amxd");

/** Independent re-implementation of the container parser (chunks: tag, uint32 LE length, payload). */
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

test("build_amxd.py --unfrozen succeeds and writes the plain amxd and the loose js bundle", () => {
    assert.equal(build.status, 0, build.stdout + build.stderr);
    ["Scale Snap.amxd", "scalesnap.js"].forEach((f) => assert.ok(fs.existsSync(path.join(tmp, f)), f));
});

test(".amxd structure: ampf('mmmm') + meta + ptch(JSON, NUL terminated), lengths consistent", () => {
    const buf = fs.readFileSync(amxdPath);
    assert.equal(buf.toString("ascii", 0, 4), "ampf");
    assert.deepEqual([...buf.subarray(4, 8)], [4, 0, 0, 0]);
    assert.equal(buf.toString("ascii", 8, 12), "mmmm");
    assert.equal(buf.toString("ascii", 12, 16), "meta");
    const chunks = parseAmxd(buf);
    assert.deepEqual(chunks.map((c) => c.tag), ["ampf", "meta", "ptch"]);
    assert.equal(chunks[0].len, 4);
    assert.equal(chunks[1].len, 4);
    const ptch = chunks[2];
    assert.equal(ptch.data[ptch.len - 1], 0, "NUL terminated");
    assert.notEqual(ptch.data.toString("ascii", 0, 4), "mx@c", "not frozen");
    const json = JSON.parse(ptch.data.subarray(0, ptch.len - 1).toString("utf8"));
    const src = JSON.parse(fs.readFileSync(path.join(SRC, "Scale Snap.maxpat"), "utf8"));
    assert.deepEqual(json, src);
    assert.equal(json.patcher.project.amxdtype, 1835887981);
    assert.equal(buf.length, 8 + 4 + 8 + 4 + 8 + ptch.len);
});

test("build_amxd.py --verify re-parses a built device and rejects damaged ones", () => {
    const ok = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "build_amxd.py"), "--verify", amxdPath], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /MIDI Effect/);
    const bad = path.join(tmp, "bad.amxd");
    fs.writeFileSync(bad, fs.readFileSync(amxdPath).subarray(0, 4000));
    const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "build_amxd.py"), "--verify", bad], { encoding: "utf8" });
    assert.notEqual(r.status, 0);
});

test("the js bundle is ES5 [js]-loadable: runs in a bare context with no require/module and defines every handler", () => {
    const code = fs.readFileSync(path.join(tmp, "scalesnap.js"), "utf8");
    const ctx = vm.createContext({ outlet() {}, post() {}, messnamed() {}, arrayfromargs: (a) => Array.prototype.slice.call(a),
        Task: function () { this.repeat = function () {}; this.cancel = function () {}; }, Dict: function () {}, File: function () {}, LiveAPI: function () {} });
    vm.runInContext(code, ctx);
    ["ScaleSnapScales", "ScaleSnapSnap", "ScaleSnapDetect", "ScaleSnapFavorites", "ScaleSnapClip"].forEach((n) => assert.equal(typeof ctx[n], "object", n));
    ["loaded", "key", "mode", "power", "category", "scalemenu", "scaleuid", "prev", "next", "togglefav", "note", "listen",
        "reset", "memory", "analyze", "resultselect", "apply", "snapclip", "result", "audioapply", "favchanged"].forEach((f) => assert.equal(typeof ctx[f], "function", f));
    assert.equal(ctx.outlets, 12);
});

test("bundle order: scales, snap, detect, favorites, clip, main", () => {
    const code = fs.readFileSync(path.join(tmp, "scalesnap.js"), "utf8");
    const marks = [...code.matchAll(/\/\* ---- (\S+) ---- \*\//g)].map((m) => m[1]);
    assert.deepEqual(marks, ["scales.js", "snap.js", "detect.js", "favorites.js", "clip.js", "scalesnap_main.js"]);
});

test.after(() => { fs.rmSync(tmp, { recursive: true, force: true }); });
