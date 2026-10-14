"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "m4l", "ScaleSnap");

function loadGolden() {
    const gz = fs.readFileSync(path.join(__dirname, "golden_snap.json.gz"));
    const g = JSON.parse(zlib.gunzipSync(gz).toString("utf8"));
    g.snapBytes = Buffer.from(g.snap, "base64");
    return g;
}

/** Golden snap table entry: output note or -1. */
function goldenMap(g, scale, mode, root) {
    const off = (((scale * 5) + mode) * 12 + root) * 128;
    const out = [];
    for (let n = 0; n < 128; n++) {
        const b = g.snapBytes[off + n];
        out.push(b === 255 ? -1 : b - 128 + n);
    }
    return out;
}

module.exports = { ROOT, SRC, loadGolden, goldenMap };

/** ES5-only check for [js] sources (regex based, no parser dependency). Returns a list of problems. */
function es5Problems(src, name) {
    const strip = (s) => s
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
        [/\bnew\s+(Map|Set|WeakMap|Promise|Float32Array|Float64Array|Uint8Array|Int32Array)\b/, "ES6 global / typed array"],
        [/\.(includes|startsWith|endsWith|padStart|find|findIndex|fill)\s*\(/, "ES6+ method"],
        [/\bObject\.(assign|entries|values)\b/, "ES2015+ Object method"],
        [/\bMath\.(log2|log10|sign|trunc|hypot|cbrt|fround|clz32|imul|expm1|log1p|sinh|cosh|tanh)\b/, "ES6 Math function"],
        [/\bNumber\.(isInteger|isFinite|isNaN|EPSILON|parseFloat)\b/, "ES6 Number member"],
        [/\bArray\.(from|of)\b/, "ES6 Array function"],
        [/\b(Int|Float|Uint)(8|16|32|64)Array\b/, "typed array"]
    ];
    const out = [], code = strip(src);
    bad.forEach(([re, what]) => {
        const m = re.exec(code);
        if (m) { out.push(name + ": " + what + " near '" + code.substr(m.index, 40).replace(/\n/g, " ") + "'"); }
    });
    return out;
}

module.exports.es5Problems = es5Problems;
