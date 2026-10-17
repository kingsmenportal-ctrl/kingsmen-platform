import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "apps/web/package.json");
const lockPath = path.join(root, "apps/web/package-lock.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const lockedRoot = lock.packages?.[""];
assert.ok(lockedRoot, "Web lockfile must contain a root package entry.");
assert.equal(lock.lockfileVersion, 3, "Web lockfile must use npm lockfile v3.");

for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
  const declared = manifest[section] ?? {};
  const locked = lockedRoot[section] ?? {};
  assert.deepEqual(locked, declared, `Web lockfile root ${section} must exactly match package.json.`);
  for (const [name, spec] of Object.entries(declared)) {
    assert.notEqual(spec, "latest", `${name} must not use a floating latest dependency.`);
    assert.ok(!String(spec).startsWith("git+") && !String(spec).startsWith("http:"), `${name} must use a registry version specifier.`);
    const installed = lock.packages[`node_modules/${name}`];
    assert.ok(installed?.version, `${name} must have a resolved package entry in the lockfile.`);
  }
}

console.log("Web dependency manifest and lockfile contract is consistent.");
