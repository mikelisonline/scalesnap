"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { ROOT, SRC } = require("./helpers");
const Scales = require(path.join(SRC, "scales.js"));

test("scales.js has the full library", () => {
    assert.equal(Scales.SCALES.length, 162);
    assert.equal(Scales.CATEGORIES.length, 17);
    assert.equal(Scales.SCALES[0].id, "major");
    assert.equal(Scales.CATEGORIES[0], "Major & Modes");
    assert.equal(Scales.CATEGORIES[16], "Other & Exotic");
});

test("ids and uids are unique, masks contain the root, categories are known", () => {
    const ids = new Set(), uids = new Set();
    Scales.SCALES.forEach((s, i) => {
        assert.ok(!ids.has(s.id)); ids.add(s.id);
        assert.ok(!uids.has(s.uid)); uids.add(s.uid);
        assert.ok(s.uid > 0 && s.uid < (1 << 24));
        assert.equal(s.mask & 1, 1, s.id);
        assert.ok(s.mask > 0 && s.mask < 4096);
        assert.ok(Scales.CATEGORIES.indexOf(s.category) >= 0, s.id);
        assert.equal(Scales.indexById(s.id), i);
        assert.equal(Scales.indexByUid(s.uid), i);
        assert.ok(s.name.length > 0);
        assert.ok(/^[\x20-\x7e]*$/.test(s.name + s.info), "ASCII only: " + s.id);
    });
    assert.equal(Scales.indexById("no_such_scale"), -1);
    assert.equal(Scales.indexByUid(123), -1);
});

test("masks match the C++ library for spot-checked scales", () => {
    const m = (d) => d.reduce((a, x) => a | (1 << x), 0);
    const mask = (id) => Scales.SCALES[Scales.indexById(id)].mask;
    assert.equal(mask("major"), m([0, 2, 4, 5, 7, 9, 11]));
    assert.equal(mask("hirajoshi"), m([0, 2, 3, 7, 8]));
    assert.equal(mask("maqam_hijaz"), m([0, 1, 4, 5, 7, 8, 10]));
    assert.equal(mask("raga_malkauns"), m([0, 3, 5, 8, 10]));
    assert.equal(mask("blues"), m([0, 3, 5, 6, 7, 10]));
});

test("category helper lists scales in library order", () => {
    let total = 0;
    Scales.CATEGORIES.forEach((c) => {
        const idx = Scales.indicesInCategory(c);
        assert.ok(idx.length > 0, c);
        for (let i = 1; i < idx.length; i++) { assert.ok(idx[i] > idx[i - 1]); }
        total += idx.length;
    });
    assert.equal(total, 162);
    assert.equal(Scales.indicesInCategory("Japanese").length, 8);
});

test("gen_scales.py --check passes (scales.js is not stale)", () => {
    const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "gen_scales.py"), "--check"], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("gen_scales.py --check fails on a stale file", () => {
    const tmp = path.join(require("os").tmpdir(), "stale_scales_" + process.pid + ".js");
    fs.writeFileSync(tmp, fs.readFileSync(path.join(SRC, "scales.js"), "utf8") + "\n// stale\n");
    try {
        const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "gen_scales.py"), "--check", "--output", tmp], { encoding: "utf8" });
        assert.equal(r.status, 1);
        assert.match(r.stdout, /STALE/);
    } finally { fs.unlinkSync(tmp); }
});

test("golden_snap.json.gz is current (needs a C++ compiler; skipped without one)", (t) => {
    const probe = cp.spawnSync("sh", ["-c", "command -v g++ || command -v c++ || command -v clang++"], { encoding: "utf8" });
    if (probe.status !== 0 && !process.env.CXX) { t.skip("no C++ compiler"); return; }
    const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "gen_golden.py"), "--check"], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
});
