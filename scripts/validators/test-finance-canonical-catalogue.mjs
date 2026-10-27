#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const validator = fileURLToPath(new URL("./validate-finance-canonical-catalogue.mjs", import.meta.url));
const run = spawnSync(process.execPath, [validator], { encoding: "utf8" });
assert.equal(run.status, 0, `canonical catalogue contract failed\n${run.stdout}\n${run.stderr}`);
const result = JSON.parse(run.stdout);
assert.equal(result.passed, true);
assert.equal(result.canonicalSellablePackageCount, 8);
assert.equal(result.financePlanCount, 9);
assert.deepEqual(result.failures, []);
console.log("PASS: canonical finance catalogue validates eight sellable products and nine finance plans.");
