import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "apps/web/package.json");
const lockPath = path.join(root, "apps/web/package-lock.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const declared = { ...manifest.dependencies, ...manifest.devDependencies };
const lockedRoot = {
  ...(lock.packages?.[""]?.dependencies ?? {}),
  ...(lock.packages?.[""]?.devDependencies ?? {}),
};
const errors = [];

for (const [name, spec] of Object.entries(declared)) {
  if (lockedRoot[name] !== spec) {
    errors.push(`root lock mismatch for ${name}: package.json=${spec}, lockfile=${lockedRoot[name] ?? "<missing>"}`);
  }
  if (!/^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$/.test(spec)) {
    errors.push(`dependency is not pinned to an exact version: ${name}=${spec}`);
  }
  const resolved = lock.packages?.[`node_modules/${name}`]?.version;
  if (!resolved) {
    errors.push(`lockfile has no resolved package entry for ${name}`);
  } else if (resolved !== spec) {
    errors.push(`resolved version mismatch for ${name}: declared=${spec}, resolved=${resolved}`);
  }
}

for (const name of Object.keys(lockedRoot)) {
  if (!(name in declared)) {
    errors.push(`lockfile root declares an unlisted dependency: ${name}`);
  }
}

if (lock.lockfileVersion !== 3) {
  errors.push(`expected npm lockfileVersion 3, got ${lock.lockfileVersion}`);
}

if (errors.length) {
  console.error("Web dependency lockfile validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Web dependency lockfile is consistent: ${Object.keys(declared).length} exact dependencies.`);
