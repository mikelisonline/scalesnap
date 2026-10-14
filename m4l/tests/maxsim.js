"use strict";
/* A small interpreter for the Max objects used inside [p snapcore], so the REAL patcher JSON
 * (m4l/ScaleSnap/Scale Snap.maxpat) can be executed in Node and compared with the C++ NoteTracker.
 *
 * Messages are: numbers (ints), arrays (lists of numbers) and the string "bang".
 * Implemented with Max's message-passing rules: depth-first, [t] and [unpack] fire right to left,
 * [pack]/[+]/[int] etc. are hot on the left inlet only. Fan-out from one outlet is rejected because Max
 * does not define its order (the generator never uses it).
 */

function atom(s) { const n = Number(s); return Number.isNaN(n) ? s : n; }

class Graph {
    constructor(patcher, parentNode) {
        this.parentNode = parentNode || null;
        this.nodes = {};      // id -> node
        this.conns = {};      // "id:outlet" -> [{id, inlet}]
        this.inlets = [];     // index -> node id
        this.outlets = [];
        this.sinks = {};      // outlet index -> callback (set by the owner)
        patcher.boxes.forEach((b) => this.add(b.box));
        patcher.lines.forEach((l) => {
            const k = l.patchline.source[0] + ":" + l.patchline.source[1];
            (this.conns[k] = this.conns[k] || []).push({ id: l.patchline.destination[0], inlet: l.patchline.destination[1] });
        });
        Object.keys(this.conns).forEach((k) => {
            if (this.conns[k].length > 1) { throw new Error("fan-out from " + k + " (order undefined in Max)"); }
        });
    }

    add(box) {
        const node = { box: box, id: box.id, g: this, state: {} };
        const cls = box.maxclass;
        if (cls === "inlet") { this.inlets[box.index - 1] = box.id; node.kind = "inlet"; }
        else if (cls === "outlet") { this.outlets[box.index - 1] = box.id; node.kind = "outlet"; }
        else if (cls === "message") { node.kind = "message"; node.content = atom(box.text); }
        else if (cls === "newobj") {
            const tok = box.text.split(/\s+/);
            node.cls = tok[0]; node.args = tok.slice(1).map(atom);
            if (box.patcher) { node.kind = "p"; node.sub = new Graph(box.patcher, node); }
            else { node.kind = "obj"; this.init(node); }
        } else { throw new Error("unsupported maxclass " + cls); }
        this.nodes[box.id] = node;
    }

    init(n) {
        switch (n.cls) {
            case "coll": n.state.data = new Map(); break;
            case "pack": n.state.vals = n.args.slice(); break;
            case "int": n.state.v = 0; break;
            case "+": case "-": case ">": n.state.right = n.args.length ? n.args[0] : 0; break;
            case "gate": n.state.open = 0; break;
            case "t": case "sel": case "unpack": case "uzi": case "loadbang": break;
            default: throw new Error("maxsim: unsupported object '" + n.cls + "'");
        }
    }

    // ---- delivery
    send(node, outlet, msg) {
        const dests = this.conns[node.id + ":" + outlet];
        if (!dests) { return; }
        dests.forEach((d) => this.nodes[d.id].g.deliver(this.nodes[d.id], d.inlet, msg));
    }

    deliver(n, inlet, msg) {
        switch (n.kind) {
            case "inlet": this.send(n, 0, msg); return;
            case "outlet": {
                const idx = this.outlets.indexOf(n.id);
                if (this.sinks[idx]) { this.sinks[idx](msg); }
                else if (this.parentNode) { this.parentNode.g.send(this.parentNode, idx, msg); }
                return;
            }
            case "message": this.send(n, 0, n.content); return;
            case "p": {
                const target = n.sub.nodes[n.sub.inlets[inlet]];
                n.sub.deliver(target, 0, msg);
                return;
            }
            default: this.run(n, inlet, msg);
        }
    }

    run(n, inlet, msg) {
        const out = (i, m) => this.send(n, i, m);
        const num = (m) => (Array.isArray(m) ? m[0] : m);
        switch (n.cls) {
            case "coll": {
                if (typeof msg === "number") {
                    if (n.state.data.has(msg)) {
                        const d = n.state.data.get(msg);
                        out(0, d.length === 1 ? d[0] : d.slice());
                    }
                } else if (Array.isArray(msg) && msg.length >= 1) {
                    n.state.data.set(msg[0], msg.slice(1));
                }
                return;
            }
            case "t": {
                for (let i = n.args.length - 1; i >= 0; i--) {
                    const k = n.args[i];
                    if (k === "b") { out(i, "bang"); }
                    else if (k === "i") { out(i, num(msg)); }
                    else if (k === "l") { out(i, Array.isArray(msg) ? msg.slice() : [msg]); }
                    else { throw new Error("trigger type " + k); }
                }
                return;
            }
            case "sel": {
                if (n.args.length === 1 && inlet === 1) { n.args = [num(msg)]; return; }
                const v = num(msg);
                for (let j = 0; j < n.args.length; j++) { if (v === n.args[j]) { out(j, "bang"); return; } }
                out(n.args.length, msg);
                return;
            }
            case "unpack": {
                for (let i = n.args.length - 1; i >= 0; i--) { out(i, msg[i]); }
                return;
            }
            case "pack": {
                if (inlet === 0) {
                    if (Array.isArray(msg)) { msg.forEach((v, i) => { n.state.vals[i] = v; }); }
                    else { n.state.vals[0] = msg; }
                    out(0, n.state.vals.slice());
                } else { n.state.vals[inlet] = num(msg); }
                return;
            }
            case "int": {
                if (inlet === 1) { n.state.v = num(msg); return; }
                if (msg !== "bang") { n.state.v = num(msg); }
                out(0, n.state.v);
                return;
            }
            case "+": case "-": case ">": {
                if (inlet === 1) { n.state.right = num(msg); return; }
                const a = num(msg), b = n.state.right;
                out(0, n.cls === "+" ? a + b : n.cls === "-" ? a - b : (a > b ? 1 : 0));
                return;
            }
            case "gate": {
                if (inlet === 0) { n.state.open = num(msg); return; }
                if (n.state.open > 0) { out(n.state.open - 1, msg); }
                return;
            }
            case "uzi": {
                if (inlet === 1) { n.state.count = num(msg); return; }
                const count = n.state.count || n.args[0];
                for (let i = 1; i <= count; i++) { out(2, i); out(0, "bang"); }
                out(1, "bang");
                return;
            }
            default: throw new Error("maxsim: cannot run " + n.cls);
        }
    }

    fireLoadbangs() {
        Object.values(this.nodes).forEach((n) => {
            if (n.kind === "obj" && n.cls === "loadbang") { this.send(n, 0, "bang"); }
            if (n.kind === "p") { n.sub.fireLoadbangs(); }
        });
    }
}

/** Wraps a [p ...] box so tests can feed its inlets and read its outlets. */
class SubpatcherHarness {
    constructor(box) {
        this.graph = new Graph(box.patcher, null);
        this.out = {};
        this.graph.outlets.forEach((id, i) => { this.out[i] = []; this.graph.sinks[i] = (m) => this.out[i].push(m); });
        this.graph.fireLoadbangs();
    }
    in(index, msg) { this.graph.deliver(this.graph.nodes[this.graph.inlets[index]], 0, msg); }
    take(index) { const r = this.out[index]; this.out[index] = []; return r; }
    /** coll contents as {key: data}, for white-box checks */
    coll(idOrText) { return null; }
}

function findBox(patcher, text) {
    const b = patcher.boxes.map((x) => x.box).find((x) => x.text === text);
    if (!b) { throw new Error("no box '" + text + "'"); }
    return b;
}

module.exports = { Graph, SubpatcherHarness, findBox };
