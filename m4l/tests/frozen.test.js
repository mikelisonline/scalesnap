"use strict";
/* The shipped devices: ONE frozen .amxd per device, every dependency embedded.
 * The container is parsed here by an independent reader (JavaScript, written from the format description in
 * m4l/tools/amxd_frozen.py), then compared with the sources. test_frozen.py covers the Python writer/parser. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const { ROOT } = require("./helpers");

const BUILD = path.join(ROOT, "m4l", "tools", "build_amxd.py");
const HFS_EPOCH = 2082844800;
const DEVICES = [
    { name: "Scale Snap", type: "mmmm", amxdtype: 1835887981, patcher: "ScaleSnap/Scale Snap.maxpat",
      deps: { "scalesnap.js": null } },
    { name: "Scale Snap Detect", type: "aaaa", amxdtype: 1633771873, patcher: "ScaleSnapDetect/Scale Snap Detect.maxpat",
      deps: { "scalesnap_detect.js": null, "ssd.spec.maxpat": "ScaleSnapDetect/ssd.spec.maxpat" } },
];

/** Frozen .amxd -> { type, meta, files: [{ type, name, size, offset, vers, flag, mdat, data }] }; throws on any inconsistency. */
function parseFrozen(buf) {
    const chunks = [];
    for (let pos = 0; pos < buf.length;) {
        const size = buf.readUInt32LE(pos + 4);
        assert.ok(pos + 8 + size <= buf.length, "chunk overruns the file");
        chunks.push({ tag: buf.toString("ascii", pos, pos + 4), data: buf.subarray(pos + 8, pos + 8 + size) });
        pos += 8 + size;
    }
    assert.deepEqual(chunks.map((c) => c.tag), ["ampf", "meta", "ptch"]);
    const p = chunks[2].data;
    assert.equal(p.toString("ascii", 0, 4), "mx@c");
    assert.equal(p.readUInt32BE(4), 16, "header size");
    const footer = Number(p.readBigUInt64BE(8));
    assert.equal(p.toString("ascii", footer, footer + 4), "dlst");
    assert.equal(footer + p.readUInt32BE(footer + 4), p.length, "dlst ends the payload");
    const files = [];
    let pos = footer + 8, expect = 16;
    while (pos < p.length) {
        assert.equal(p.toString("ascii", pos, pos + 4), "dire");
        const end = pos + p.readUInt32BE(pos + 4);
        const f = {};
        let q = pos + 8;
        for (const tag of ["type", "fnam", "sz32", "of32", "vers", "flag", "mdat"]) {
            assert.equal(p.toString("ascii", q, q + 4), tag, "field order");
            const size = p.readUInt32BE(q + 4);
            f[tag] = p.subarray(q + 8, q + size);
            q += size;
        }
        assert.equal(q, end);
        const e = { type: f.type.toString("latin1"), name: f.fnam.toString("utf8").replace(/\0+$/, ""), size: f.sz32.readUInt32BE(0),
            offset: f.of32.readUInt32BE(0), vers: f.vers.readUInt32BE(0), flag: f.flag.readUInt32BE(0), mdat: f.mdat.readUInt32BE(0) };
        assert.equal(f.fnam.length % 4, 0, "fnam padded to 4 bytes");
        assert.equal(e.offset, expect, e.name + " follows the previous file without a gap");
        e.data = p.subarray(e.offset, e.offset + e.size);
        expect = e.offset + e.size;
        files.push(e);
        pos = end;
    }
    assert.equal(expect, footer, "the files fill the data area");
    return { type: chunks[0].data.toString("ascii"), meta: chunks[1].data.readUInt32LE(0), files: files };
}

function build(dir, args, env) {
    const r = cp.spawnSync("python3", [BUILD, "--out", dir].concat(args || []), { encoding: "utf8", env: Object.assign({}, process.env, env || {}) });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ssfrozen-"));
const frozenDir = path.join(tmp, "frozen"), looseDir = path.join(tmp, "loose");
build(frozenDir);
build(looseDir, ["--unfrozen"]);

test("the default build writes exactly the two frozen .amxd files and nothing else", () => {
    assert.deepEqual(fs.readdirSync(frozenDir).sort(), ["Scale Snap Detect.amxd", "Scale Snap.amxd"]);
});

for (const dev of DEVICES) {
    test(dev.name + ".amxd: frozen container of the right device type with exactly its dependencies embedded", () => {
        const f = parseFrozen(fs.readFileSync(path.join(frozenDir, dev.name + ".amxd")));
        assert.equal(f.type, dev.type);
        assert.equal(f.meta, 7);
        assert.deepEqual(f.files.map((e) => e.name), [dev.name + ".amxd"].concat(Object.keys(dev.deps)));
        assert.deepEqual(f.files.map((e) => e.flag), f.files.map((e, i) => (i === 0 ? 17 : 0)));
        assert.deepEqual(f.files.map((e) => e.vers), f.files.map(() => 0));
        assert.deepEqual(f.files.map((e) => e.type), f.files.map((e) => (e.name.endsWith(".js") ? "TEXT" : "JSON")));
    });

    test(dev.name + ".amxd: embedded files equal the sources (js: the unfrozen build's bundle)", () => {
        const f = parseFrozen(fs.readFileSync(path.join(frozenDir, dev.name + ".amxd")));
        for (const e of f.files.slice(1)) {
            const src = dev.deps[e.name] ? path.join(ROOT, "m4l", dev.deps[e.name]) : path.join(looseDir, e.name);
            assert.ok(e.data.equals(fs.readFileSync(src)), e.name);
        }
    });

    test(dev.name + ".amxd: main patcher is the unfrozen patcher plus dependency_cache", () => {
        const f = parseFrozen(fs.readFileSync(path.join(frozenDir, dev.name + ".amxd")));
        const main = f.files[0].data;
        assert.equal(main[main.length - 1], 0, "one trailing NUL");
        assert.notEqual(main[main.length - 2], 0);
        const json = JSON.parse(main.subarray(0, main.length - 1).toString("utf8"));
        const cache = json.patcher.dependency_cache;
        delete json.patcher.dependency_cache;
        const source = JSON.parse(fs.readFileSync(path.join(ROOT, "m4l", dev.patcher), "utf8"));
        assert.deepEqual(json, source);
        assert.equal(json.patcher.project.amxdtype, dev.amxdtype);
        assert.deepEqual(cache.map((c) => c.name), Object.keys(dev.deps));
        for (const c of cache) {
            assert.equal(c.implicit, 1);
            assert.equal(c.type, c.name.endsWith(".js") ? "TEXT" : "JSON");
            assert.match(c.bootpath, /Max for Live Devices\/.* Project\/(code|patchers)$/);
        }
        // the same names, found independently in the patcher text: every [js x] and [pfft~ x] has its file embedded
        const refs = [];
        (function walk(inner) {
            for (const b of inner.boxes) {
                const m = b.box.maxclass === "newobj" && /^(js|pfft~) (\S+)/.exec(b.box.text || "");
                if (m) { refs.push(m[1] === "js" ? m[2] : m[2] + ".maxpat"); }
                if (b.box.patcher) { walk(b.box.patcher); }
            }
        })(json.patcher);
        assert.deepEqual(refs.sort(), Object.keys(dev.deps).sort());
    });
}

test("--unfrozen is the development build: plain .amxd files plus the loose .js/.maxpat", () => {
    const loose = fs.readdirSync(looseDir).sort();
    assert.deepEqual(loose, ["Scale Snap Detect.amxd", "Scale Snap.amxd", "scalesnap.js", "scalesnap_detect.js", "ssd.spec.maxpat"]);
});

test("reproducible: identical sources give byte-identical files; file times come from SOURCE_DATE_EPOCH", () => {
    const again = path.join(tmp, "again");
    build(again);
    const epoch = path.join(tmp, "epoch");
    build(epoch, [], { SOURCE_DATE_EPOCH: "1700000000" });
    for (const dev of DEVICES) {
        const name = dev.name + ".amxd";
        const a = fs.readFileSync(path.join(frozenDir, name));
        assert.ok(a.equals(fs.readFileSync(path.join(again, name))), name + " differs between two builds");
        const mtimes = parseFrozen(a).files.map((e) => e.mdat);
        assert.deepEqual([...new Set(mtimes)], [1767225600 + HFS_EPOCH], "default file time is a fixed date, not the clock");
        const e = parseFrozen(fs.readFileSync(path.join(epoch, name)));
        assert.deepEqual([...new Set(e.files.map((x) => x.mdat))], [1700000000 + HFS_EPOCH]);
    }
});

test("build_amxd.py --verify lists a frozen device and still rejects damaged files", () => {
    const file = path.join(frozenDir, "Scale Snap Detect.amxd");
    const ok = cp.spawnSync("python3", [BUILD, "--verify", file], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /Audio Effect.*FROZEN, embeds scalesnap_detect\.js .*ssd\.spec\.maxpat/);
    const bad = path.join(tmp, "bad.amxd");
    fs.writeFileSync(bad, fs.readFileSync(file).subarray(0, 50000));
    assert.notEqual(cp.spawnSync("python3", [BUILD, "--verify", bad], { encoding: "utf8" }).status, 0);
});

test("fixtures: frozen devices saved by Max parse with the independent reader", () => {
    const dir = path.join(__dirname, "fixtures");
    const f = parseFrozen(fs.readFileSync(path.join(dir, "OSC MIDI Send.amxd")));
    assert.equal(f.type, "mmmm");
    assert.deepEqual(f.files.map((e) => e.name), ["OSC MIDI Send.amxd", "Overlay.maxpat", "close-btn_click.svg", "close-btn_black.svg", "close-btn_default.svg"]);
    assert.equal(parseFrozen(fs.readFileSync(path.join(dir, "WithGarbage.amxd"))).files.length, 1);
});

test("test_frozen.py: writer reproduces real frozen devices byte for byte; missing/extra dependencies fail the build", () => {
    const r = cp.spawnSync("python3", [path.join(__dirname, "test_frozen.py")], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
});

test.after(() => { fs.rmSync(tmp, { recursive: true, force: true }); });
