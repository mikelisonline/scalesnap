"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { SRC } = require("./helpers");
const Fav = require(path.join(SRC, "favorites.js"));
const Scales = require(path.join(SRC, "scales.js"));

function memIo(initial) {
    const io = { text: initial === undefined ? null : initial, writes: 0, fail: false };
    io.read = () => io.text;
    io.write = (t) => { if (io.fail) { return false; } io.text = t; io.writes++; return true; };
    return io;
}
const valid = (id) => Scales.indexById(id) >= 0;

test("parse tolerates garbage and removes duplicates", () => {
    assert.deepEqual(Fav.parse(null), []);
    assert.deepEqual(Fav.parse(""), []);
    assert.deepEqual(Fav.parse("not json"), []);
    assert.deepEqual(Fav.parse('{"favorites": 5}'), []);
    assert.deepEqual(Fav.parse('{"favorites": ["a", "a", 3, "", "b"]}'), ["a", "b"]);
});

test("add / remove / toggle persist to the io and survive a reload", () => {
    const io = memIo();
    const f = new Fav.Favorites(io, valid);
    f.load();
    assert.deepEqual(f.list(), []);
    assert.equal(f.toggle("natural_minor"), true);
    assert.equal(f.toggle("hirajoshi"), true);
    assert.ok(f.has("natural_minor"));
    assert.deepEqual(JSON.parse(io.text), { version: 1, favorites: ["natural_minor", "hirajoshi"] });

    const g = new Fav.Favorites(io, valid);       // a second device / a new session
    g.load();
    assert.deepEqual(g.list(), ["natural_minor", "hirajoshi"]);

    assert.equal(g.toggle("natural_minor"), false);
    assert.deepEqual(JSON.parse(io.text).favorites, ["hirajoshi"]);
    g.set("blues", true); g.set("blues", true);
    assert.deepEqual(JSON.parse(io.text).favorites, ["hirajoshi", "blues"]);
    g.set("hirajoshi", false);
    assert.deepEqual(g.list(), ["blues"]);
});

test("changes made by another device are merged, not overwritten", () => {
    const io = memIo();
    const a = new Fav.Favorites(io, valid), b = new Fav.Favorites(io, valid);
    a.load(); b.load();
    a.toggle("dorian");
    b.toggle("lydian"); // b never saw dorian in memory, but toggle() re-reads the file first
    assert.deepEqual(JSON.parse(io.text).favorites.sort(), ["dorian", "lydian"]);
    assert.equal(a.load(), true);
    assert.equal(a.load(), false);
});

test("unknown ids (removed scales) are dropped on load", () => {
    const f = new Fav.Favorites(memIo('{"version":1,"favorites":["dorian","gone_scale"]}'), valid);
    f.load();
    assert.deepEqual(f.list(), ["dorian"]);
});

test("a failing write is reported", () => {
    const io = memIo(); io.fail = true;
    const f = new Fav.Favorites(io, valid);
    f.toggle("dorian");
    assert.match(f.lastError, /could not write/);
});

// ---- Dict-backed io with a mock Dict/File -------------------------------------------------------------

function mockDicts(files, opts) {
    opts = opts || {};
    class Dict {
        constructor() { this.t = "{}"; }
        parse(t) { this.t = t; }
        stringify() { return this.t; }
        import_json(p) { if (!(p in files)) { throw new Error("nofile"); } this.t = files[p]; }
        export_json(p) { if (opts.deny && opts.deny.indexOf(p) >= 0) { throw new Error("denied"); } files[p] = this.t; }
    }
    class File { constructor(p) { this.isopen = p in files; } close() {} }
    return { Dict, File };
}

test("createDictIo reads, writes and persists via export_json/import_json", () => {
    const files = {};
    const { Dict, File } = mockDicts(files);
    const io = Fav.createDictIo(Dict, File);
    assert.equal(io.read(), null);
    const f = new Fav.Favorites(io, valid);
    f.toggle("phrygian");
    assert.ok(files[Fav.DEFAULT_PATHS[0]]);
    const f2 = new Fav.Favorites(Fav.createDictIo(Dict, File), valid);
    f2.load();
    assert.deepEqual(f2.list(), ["phrygian"]);
});

test("createDictIo falls back to the next location when the folder cannot be written", () => {
    const files = {};
    const { Dict, File } = mockDicts(files, { deny: [Fav.DEFAULT_PATHS[0]] });
    const f = new Fav.Favorites(Fav.createDictIo(Dict, File), valid);
    assert.equal(f.toggle("lydian"), true);
    assert.ok(!files[Fav.DEFAULT_PATHS[0]]);
    assert.ok(files[Fav.DEFAULT_PATHS[1]]);
    const f2 = new Fav.Favorites(Fav.createDictIo(Dict, File), valid);
    f2.load();
    assert.deepEqual(f2.list(), ["lydian"]);
});

test("createDictIo reports failure when nothing is writable", () => {
    const { Dict, File } = mockDicts({}, { deny: Fav.DEFAULT_PATHS });
    const f = new Fav.Favorites(Fav.createDictIo(Dict, File), valid);
    f.toggle("lydian");
    assert.ok(f.lastError);
    assert.ok(f.has("lydian")); // still favorited for this session
});
