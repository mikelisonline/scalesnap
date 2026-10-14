#!/usr/bin/env node
/* Runs every *.test.js in this directory (node:test, no npm dependencies).
 *   node m4l/tests/run.js            all tests
 *   node m4l/tests/run.js snap       only files whose name contains "snap"
 */
"use strict";
const fs = require("fs");
const path = require("path");

const filter = process.argv[2] || "";
const files = fs.readdirSync(__dirname)
    .filter((f) => f.endsWith(".test.js") && f.indexOf(filter) !== -1)
    .sort();

if (files.length === 0) {
    console.error("no test files match '" + filter + "'");
    process.exit(2);
}
for (const f of files) {
    require(path.join(__dirname, f));
}
