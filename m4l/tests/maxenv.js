"use strict";
/* Loads the device's concatenated [js] bundle into a vm context that imitates the legacy Max [js]
 * environment (no require/module; outlet, post, Task, Dict, File, LiveAPI, messnamed, arrayfromargs). */
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const { SRC } = require("./helpers");

const BUNDLE_ORDER = ["scales.js", "snap.js", "detect.js", "favorites.js", "clip.js", "scalesnap_main.js"];

function bundleSource(sources) {
    const list = sources || BUNDLE_ORDER.map((f) => path.join(SRC, f));
    return list.map((f) => fs.readFileSync(f, "utf8")).join("\n");
}

/* opts.sources: absolute paths of the scripts to concatenate (default: the MIDI device's bundle);
 * opts.jsarguments: the [js] object's arguments; opts.Buffer: constructor for the JS Buffer object. */
function createEnv(opts) {
    opts = opts || {};
    const files = opts.files || {};            // fake file system for Dict/File: path -> text
    const out = [];                            // {n, args}
    const posted = [];
    const tasks = [];
    const sent = [];                           // messnamed calls
    let clock = opts.clock || 1000000;         // ms

    class FakeDict {
        constructor(name) { this.name = name; this.text = "{}"; }
        parse(t) { this.text = t; }
        stringify() { return this.text; }
        import_json(p) { if (!(p in files)) { throw new Error("no such file " + p); } this.text = files[p]; }
        export_json(p) { if (opts.readOnly) { throw new Error("read only"); } files[p] = this.text; }
    }
    class FakeFile {
        constructor(p) { this.isopen = p in files; }
        close() {}
    }
    class FakeTask {
        constructor(fn, obj) { this.fn = fn; this.obj = obj; this.running = false; this.interval = 500; tasks.push(this); }
        repeat(n, delay) { this.running = true; this.count = n; }
        cancel() { this.running = false; }
        fire() { if (this.running) { this.fn.call(this.obj); } }
    }
    class FakeDate extends Date {
        constructor(...a) { if (a.length) { super(...a); } else { super(clock); } }
        static now() { return clock; }
    }

    const sandbox = {
        // Max flattens an array argument into the message's atoms.
        outlet: function (n) {
            let args = Array.prototype.slice.call(arguments, 1);
            if (args.length === 1 && Array.isArray(args[0])) { args = Array.from(args[0]); }
            out.push({ n: n, args: args });
        },
        post: function (s) { posted.push(String(s)); },
        messnamed: function () { sent.push(Array.prototype.slice.call(arguments)); },
        arrayfromargs: function (a) { return Array.prototype.slice.call(a); },
        Task: FakeTask, Dict: FakeDict, File: FakeFile,
        LiveAPI: opts.LiveAPI || function () { throw new Error("no Live API"); },
        jsarguments: opts.jsarguments || ["scalesnap.js"],
        Buffer: opts.Buffer || function () { throw new Error("no Buffer"); },
        Date: FakeDate, JSON: JSON, Math: Math, Object: Object, Array: Array, String: String,
        Number: Number, isNaN: isNaN, parseInt: parseInt, RegExp: RegExp, Error: Error
    };
    const ctx = vm.createContext(sandbox);
    vm.runInContext(bundleSource(opts.sources), ctx, { filename: opts.filename || "scalesnap.js" });
    return {
        ctx: ctx, out: out, posted: posted, tasks: tasks, sent: sent, files: files,
        advance(ms) { clock += ms; },
        clear() { out.length = 0; },
        /** All messages sent to outlet n since the last clear. */
        on(n) { return out.filter((o) => o.n === n).map((o) => o.args); },
        call(fn) { return ctx[fn].apply(null, Array.prototype.slice.call(arguments, 1)); },
        /** Table as the patcher would see it: index -> value (last write wins). */
        table() {
            const t = {};
            out.filter((o) => o.n === 0).forEach((o) => { t[o.args[0]] = o.args[1]; });
            return t;
        }
    };
}

module.exports = { createEnv, bundleSource, BUNDLE_ORDER };
