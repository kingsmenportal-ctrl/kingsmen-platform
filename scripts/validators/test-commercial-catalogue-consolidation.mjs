#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const validator = fileURLToPath(new URL("./validate-commercial-catalogue-consolidation.mjs", import.meta.url));
const run = spawnSync(process.execPath, [validator], { encoding: "utf8" });
assert.equal(run.status, 0, `commercial catalogue consolidation failed\n${run.stdout}\n${run.stderr}`);
const result = JSON.parse(run.stdout);
assert.equal(result.passed, true);
assert.equal(result.paidProducts, 7);
assert.equal(result.runtimeAndDoctrineParity, true);
assert.equal(result.universalPathways, 6);
assert.equal(result.standaloneAccommodationProduct, "removed from public runtime projection; historical code retained");
console.log("PASS: shared commercial catalogue, public/finance projections, package capacities, universal pathway access, and checkout fail-closed boundary.");
