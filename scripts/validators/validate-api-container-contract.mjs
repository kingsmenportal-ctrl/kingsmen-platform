import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const apiDir = resolve(root, "apps/api");
const errors = [];
const checks = [];

function check(name, condition, detail) {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) errors.push(`${name}: ${detail}`);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`Cannot parse ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const manifestPath = resolve(apiDir, "package.json");
const lockPath = resolve(apiDir, "package-lock.json");
const dockerPath = resolve(apiDir, "Dockerfile");
const envExamplePath = resolve(apiDir, ".env.example");
const readmePath = resolve(apiDir, "README.md");

const manifest = readJson(manifestPath);
const lockExists = existsSync(lockPath);
check(
  "API lockfile is committed",
  lockExists,
  "apps/api/package-lock.json is required; generate it with npm for the API manifest and commit it. Do not replace npm ci with npm install."
);

let lock = null;
if (lockExists) {
  lock = readJson(lockPath);
  check("API lockfile uses lockfileVersion 3", lock?.lockfileVersion === 3, "Expected a modern npm lockfileVersion 3.");
  check("API lockfile root manifest matches", Boolean(lock && manifest &&
    lock.packages?.[""]?.name === manifest.name &&
    lock.packages?.[""]?.version === manifest.version &&
    JSON.stringify(lock.packages?.[""]?.dependencies ?? {}) === JSON.stringify(manifest.dependencies ?? {}) &&
    JSON.stringify(lock.packages?.[""]?.devDependencies ?? {}) === JSON.stringify(manifest.devDependencies ?? {}),
  ), "The lockfile root package metadata and dependency ranges must exactly match apps/api/package.json.");
  for (const name of [...Object.keys(manifest?.dependencies ?? {}), ...Object.keys(manifest?.devDependencies ?? {})]) {
    check(`Locked top-level package ${name}`, Boolean(lock?.packages?.[`node_modules/${name}`]), `Missing node_modules/${name} entry in API lockfile.`);
  }
}

let docker = "";
try { docker = readFileSync(dockerPath, "utf8"); } catch {}
check("Container uses reproducible npm ci", /npm ci/.test(docker) && !/npm install/.test(docker), "Both build and runtime stages must use npm ci, not unpinned npm install.");
check("Container requires durable persistence", /KINGSMEN_TRUTH_VAULT_MODE=postgres/.test(docker), "Production container must fail closed rather than silently use in-memory storage.");
check("Container runs as non-root", /^USER node$/m.test(docker), "Runtime image must run as the unprivileged node user.");
check("Container exposes a health check", /^HEALTHCHECK /m.test(docker) && /\/health/.test(docker), "Container must probe the API health endpoint.");
check("Credential-free env template exists", existsSync(envExamplePath), "apps/api/.env.example must be committed.");
check("API deployment docs declare lockfile gate", existsSync(readmePath) && /package-lock\.json/.test(readFileSync(readmePath, "utf8")), "API README must document the lockfile prerequisite.");

const report = {
  validator: "api-container-contract",
  generatedAtIso: new Date().toISOString(),
  passed: errors.length === 0,
  checks,
  errors
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
