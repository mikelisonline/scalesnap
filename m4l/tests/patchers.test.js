"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { ROOT, SRC } = require("./helpers");
const Scales = require(path.join(SRC, "scales.js"));
const Snap = require(path.join(SRC, "snap.js"));

const M4L = path.join(ROOT, "m4l");

function walk(dir, out) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== "dist" && e.name !== "node_modules") { walk(p, out); } }
        else if (e.name.endsWith(".maxpat")) { out.push(p); }
    });
    return out;
}
const PATCH_FILES = walk(M4L, []);
const mainFile = path.join(SRC, "Scale Snap.maxpat");

/** Yields {patcher, where} for a patcher and all embedded sub-patchers. */
function allPatchers(patcher, where, out) {
    out = out || [];
    out.push({ patcher: patcher, where: where });
    patcher.boxes.forEach((b) => { if (b.box.patcher) { allPatchers(b.box.patcher, where + "/" + (b.box.text || b.box.id), out); } });
    return out;
}

test("there is at least the main patcher and every .maxpat parses as JSON", () => {
    assert.ok(PATCH_FILES.indexOf(mainFile) >= 0);
    PATCH_FILES.forEach((f) => {
        const d = JSON.parse(fs.readFileSync(f, "utf8"));
        assert.ok(d.patcher && Array.isArray(d.patcher.boxes) && Array.isArray(d.patcher.lines), f);
    });
});

PATCH_FILES.forEach((f) => {
    test("connections are valid in " + path.basename(f), () => {
        const top = JSON.parse(fs.readFileSync(f, "utf8")).patcher;
        allPatchers(top, path.basename(f)).forEach(({ patcher, where }) => {
            const boxes = {};
            patcher.boxes.forEach((b) => {
                const bx = b.box;
                assert.ok(bx.id && !boxes[bx.id], where + ": duplicate/missing id " + bx.id);
                boxes[bx.id] = bx;
                assert.ok(Number.isInteger(bx.numinlets) && Number.isInteger(bx.numoutlets), where + " " + bx.id);
                if (bx.outlettype) { assert.equal(bx.outlettype.length, bx.numoutlets, where + " " + bx.id + " outlettype"); }
            });
            const used = {};
            patcher.lines.forEach((l) => {
                const [sid, so] = l.patchline.source, [did, di] = l.patchline.destination;
                assert.ok(boxes[sid], where + ": unknown source " + sid);
                assert.ok(boxes[did], where + ": unknown destination " + did);
                assert.ok(so >= 0 && so < boxes[sid].numoutlets, where + ": " + sid + " has no outlet " + so);
                assert.ok(di >= 0 && di < boxes[did].numinlets, where + ": " + did + " has no inlet " + di);
                assert.notEqual(sid, did, where + ": self connection");
                const k = sid + ":" + so;
                used[k] = (used[k] || 0) + 1;
                // message outlets must not fan out (Max does not define the order); signal outlets may
                if ((boxes[sid].outlettype || [])[so] !== "signal") {
                    assert.equal(used[k], 1, where + ": outlet " + k + " fans out (Max does not define the order)");
                }
            });
            // inlet/outlet boxes define the I/O of an embedded patcher
            const ins = patcher.boxes.filter((b) => b.box.maxclass === "inlet").map((b) => b.box.index).sort();
            const outs = patcher.boxes.filter((b) => b.box.maxclass === "outlet").map((b) => b.box.index).sort();
            assert.deepEqual(ins, ins.map((_, i) => i + 1), where + " inlet indexes");
            assert.deepEqual(outs, outs.map((_, i) => i + 1), where + " outlet indexes");
            patcher.boxes.filter((b) => b.box.patcher).forEach((b) => {
                const sub = b.box.patcher;
                assert.equal(b.box.numinlets, sub.boxes.filter((x) => x.box.maxclass === "inlet").length);
                assert.equal(b.box.numoutlets, sub.boxes.filter((x) => x.box.maxclass === "outlet").length);
            });
            // every object takes part in the patch (comments and plain UI display objects excepted)
            const connected = {};
            patcher.lines.forEach((l) => { connected[l.patchline.source[0]] = true; connected[l.patchline.destination[0]] = true; });
            patcher.boxes.forEach((b) => {
                if (b.box.maxclass === "comment" || b.box.maxclass === "live.comment") { return; }
                assert.ok(connected[b.box.id], where + ": unconnected " + (b.box.text || b.box.maxclass) + " " + b.box.id);
            });
        });
    });
});

const main = JSON.parse(fs.readFileSync(mainFile, "utf8")).patcher;
const boxes = main.boxes.map((b) => b.box);
const byVar = (v) => boxes.find((b) => b.varname === v);
const jsSource = fs.readFileSync(path.join(SRC, "scalesnap_main.js"), "utf8");

test("device settings: MIDI effect, 169 px high, opens in presentation mode", () => {
    assert.equal(main.project.amxdtype, 1835887981);
    assert.equal(main.openrect[3], 169);
    assert.ok(main.openrect[2] >= 300 && main.openrect[2] <= 600);
    assert.equal(main.openinpresentation, 1);
    assert.equal(main.appversion.major, 8);
    assert.ok(!boxes.some((b) => /^v8(\.|\s|$)/.test(b.text || "")), "no [v8]: Max 9 only");
});

test("the realtime path is native objects only: midiin -> midiparse -> p snapcore -> midiformat -> midiout", () => {
    const text = (id) => boxes.find((b) => b.id === id).text || boxes.find((b) => b.id === id).maxclass;
    const edges = main.lines.map((l) => [text(l.patchline.source[0]), text(l.patchline.destination[0])]);
    const has = (a, b) => edges.some((e) => e[0] === a && e[1] === b);
    assert.ok(has("midiin", "midiparse"));
    assert.ok(has("midiparse", "p snapcore"));
    assert.ok(has("p snapcore", "midiformat"));
    assert.ok(has("midiformat", "midiout"));
    assert.ok(has("live.thisdevice", "sel 0"));
    // CC / program / pressure / bend / channel go straight to midiformat (non-note MIDI unchanged)
    const direct = main.lines.filter((l) => text(l.patchline.source[0]) === "midiparse" && text(l.patchline.destination[0]) === "midiformat")
        .map((l) => l.patchline.source[1] + ">" + l.patchline.destination[1]).sort();
    assert.deepEqual(direct, ["2>2", "3>3", "4>4", "5>5", "6>6"]);
    // the js object is not on the note path: nothing flows from js into midiformat/midiout
    const js = boxes.find((b) => /^js /.test(b.text));
    main.lines.filter((l) => l.patchline.source[0] === js.id).forEach((l) => {
        const d = text(l.patchline.destination[0]);
        assert.ok(d !== "midiformat" && d !== "midiout" && d !== "midiparse", "js -> " + d);
    });
    // snapcore contains only native objects
    const core = boxes.find((b) => b.text === "p snapcore").patcher;
    const allowed = ["coll", "t", "sel", "unpack", "pack", "+", "-", ">", "int", "gate", "uzi", "loadbang"];
    core.boxes.forEach((b) => {
        const bx = b.box;
        if (bx.maxclass === "newobj") { assert.ok(allowed.indexOf(bx.text.split(" ")[0]) >= 0, "unexpected object " + bx.text); }
    });
});

test("[js] object: bundle name, outlet count and every message it receives is a function in the script", () => {
    const js = boxes.find((b) => /^js /.test(b.text));
    assert.equal(js.text, "js scalesnap.js");
    const m = /outlets\s*=\s*(\d+)/.exec(jsSource);
    assert.equal(js.numoutlets, Number(m[1]));
    assert.equal(js.numinlets, Number(/inlets\s*=\s*(\d+)/.exec(jsSource)[1]));
    const fns = {};
    jsSource.replace(/^function\s+(\w+)\s*\(/gm, (_, n) => { fns[n] = true; });
    const sent = [];
    boxes.forEach((b) => {
        if (/^prepend /.test(b.text || "")) { sent.push(b.text.split(" ")[1]); }
        if (b.maxclass === "message") { sent.push(b.text); }
    });
    sent.push("note", "result");
    sent.forEach((s) => assert.ok(fns[s], "script has no function " + s));
    assert.ok(sent.indexOf("loaded") >= 0 && sent.indexOf("snapclip") >= 0 && sent.indexOf("favchanged") >= 0);
    const names = main.lines.filter((l) => l.patchline.destination[0] === js.id).length;
    assert.ok(names >= 15);
});

test("script outlets go to the intended UI objects", () => {
    const OUT = {};
    /OUT\s*=\s*\{([^}]*)\}/.exec(jsSource)[1].replace(/(\w+)\s*:\s*(\d+)/g, (_, k, v) => { OUT[k] = Number(v); return ""; });
    const target = { KEY: "Key", CATEGORY: "Category", SCALES: "SCALE", UID: "Scale ID", STAR: "FAV", KB: "KB",
        INFO: "INFO", RESULTS: "RESULTS", SAME: "SAME", STATUS: "STATUS", AUDIO: "AUDIO" };
    const js = boxes.find((b) => /^js /.test(b.text));
    Object.keys(target).forEach((k) => {
        const l = main.lines.find((x) => x.patchline.source[0] === js.id && x.patchline.source[1] === OUT[k]);
        assert.ok(l, "js outlet " + k + " is not connected");
        assert.equal(boxes.find((b) => b.id === l.patchline.destination[0]).varname, target[k], k);
    });
    const map = main.lines.find((x) => x.patchline.source[0] === js.id && x.patchline.source[1] === OUT.MAP);
    assert.equal(boxes.find((b) => b.id === map.patchline.destination[0]).text, "p snapcore");
    assert.equal(map.patchline.destination[1], 2);
});

test("parameters: live.* objects with unique long names, short names, stable ids; hidden Scale ID stored by uid", () => {
    const params = boxes.filter((b) => b.parameter_enable === 1);
    const longs = params.map((b) => b.saved_attribute_attributes.valueof.parameter_longname);
    assert.equal(new Set(longs).size, longs.length);
    params.forEach((b) => {
        assert.ok(/^live\./.test(b.maxclass), b.maxclass);
        const v = b.saved_attribute_attributes.valueof;
        assert.ok(v.parameter_shortname && v.parameter_shortname.length <= 16, v.parameter_longname);
        assert.equal(b.varname, v.parameter_longname, "varname keeps the parameter id stable");
        assert.ok(main.parameters[b.id], "listed in patcher.parameters");
    });
    assert.deepEqual(longs.sort(), ["Category", "Correction", "Detect Memory", "Key", "Next Scale", "Power", "Previous Scale", "Scale ID"]);
    const v = (n) => byVar(n).saved_attribute_attributes.valueof;
    assert.deepEqual(v("Key").parameter_enum, Scales.NOTE_NAMES);
    assert.deepEqual(v("Category").parameter_enum, ["All Scales", "Favorites"].concat(Scales.CATEGORIES));
    assert.equal(v("Correction").parameter_enum.length, Snap.MODE_NAMES.length);
    assert.equal(v("Power").parameter_initial[0], 1);
    const id = byVar("Scale ID");
    assert.equal(id.saved_attribute_attributes.valueof.parameter_invisible, 1, "stored only, not automatable");
    assert.ok(id.presentation !== 1, "not on the device face");
    assert.equal(id.saved_attribute_attributes.valueof.parameter_initial[0], Scales.SCALES[0].uid);
    assert.equal(id.saved_attribute_attributes.valueof.parameter_type, 1);
    assert.ok(id.saved_attribute_attributes.valueof.parameter_mmax >= Math.max.apply(null, Scales.SCALES.map((s) => s.uid)));
});

test("the UI has everything the spec asks for", () => {
    const need = ["Power", "Key", "Category", "SCALE", "Previous Scale", "Next Scale", "FAV", "Correction", "KB",
        "LISTEN", "RESET", "RESULTS", "APPLY", "SNAPCLIP", "ANALYZE"];
    need.forEach((n) => assert.ok(byVar(n), "missing " + n));
    assert.equal(byVar("KB").maxclass, "kslider");
    assert.equal(byVar("FAV").mode, 1);
    assert.equal(byVar("LISTEN").mode, 1);
});

test("presentation layout fits the 169 px device and objects do not overlap", () => {
    const W = main.openrect[2], H = main.openrect[3];
    const pres = boxes.filter((b) => b.presentation === 1);
    assert.ok(pres.length >= 20);
    pres.forEach((b) => {
        const [x, y, w, h] = b.presentation_rect;
        assert.ok(x >= 0 && y >= 0 && x + w <= W && y + h <= H, (b.varname || b.text) + " outside device: " + b.presentation_rect);
    });
    for (let i = 0; i < pres.length; i++) {
        for (let j = i + 1; j < pres.length; j++) {
            const a = pres[i].presentation_rect, b = pres[j].presentation_rect;
            const overlap = a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
            assert.ok(!overlap, (pres[i].varname) + " overlaps " + (pres[j].varname));
        }
    }
});

test("gen_patcher.py --check passes (committed .maxpat is not stale)", () => {
    const r = cp.spawnSync("python3", [path.join(ROOT, "m4l", "tools", "gen_patcher.py"), "--check"], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
});
