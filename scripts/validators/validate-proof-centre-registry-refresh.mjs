#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = "reports/validation/proof-centre-registry-refresh-latest.json";

const expectedFiles = [
  "docs/control-plane/proof-centre-registry-refresh.md",
  "manifests/control-plane/proof-centre-registry-refresh.json",
  "packages/contracts/src/proof-centre-registry.ts",
  "scripts/proof/prove-proof-centre-registry-refresh.mjs",
  "scripts/validators/validate-proof-centre-registry-refresh.mjs",
  "apps/web/src/app/founder/proof-centre/page.tsx",
  "reports/control-plane/proof-centre-registry.json",
  "reports/control-plane/proof-centre-registry-refresh-proof.json"
];

const requiredBatches = [
  "BATCH 21",
  "BATCH 22",
  "BATCH 23",
  "BATCH 24",
  "BATCH 25",
  "BATCH 26B",
  "BATCH 27",
  "BATCH 28"
];

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const registryPath = "reports/control-plane/proof-centre-registry.json";
const proofPath = "reports/control-plane/proof-centre-registry-refresh-proof.json";
const pagePath = "apps/web/src/app/founder/proof-centre/page.tsx";

const registry = exists(registryPath) ? readJson(registryPath) : null;
const proof = exists(proofPath) ? readJson(proofPath) : null;
const page = exists(pagePath) ? readText(pagePath) : "";

check("registry-schema", registry?.schema === "kingsmen.proof-centre-registry.v1", registry?.schema ?? "missing");
check("registry-local-only", registry?.runtimeScope === "local_proof_registry_refresh_only", registry?.runtimeScope ?? "missing");
check("registry-eight-entries", registry?.entryCount === 8 && Array.isArray(registry?.entries) && registry.entries.length === 8, `entries=${registry?.entries?.length ?? 0}`);
check("registry-all-proven", registry?.allEntriesProven === true, String(registry?.allEntriesProven));
check("registry-no-production", registry?.productionReady === false && registry?.canClaimProduction === false, "production false");
check("registry-no-oracle", registry?.deployedToOracle === false, "oracle false");

for (const batch of requiredBatches) {
  const entry = (registry?.entries ?? []).find((item) => item.batch === batch);
  check(`registry-has:${batch}`, Boolean(entry), batch);
  check(`registry-entry-proven:${batch}`, entry?.status === "PROVEN", entry?.status ?? "missing");
  check(`page-has:${batch}`, page.includes(batch), batch);
}

check("page-has-founder-title", page.includes("Kingsmen Founder Control Plane"), "founder title");
check("page-has-build-proof-centre", page.includes("Build Proof Centre"), "Build Proof Centre");
check("page-has-local-warning", page.includes("Local founder proof page only"), "local warning");

check("proof-schema", proof?.schema === "kingsmen.proof-centre-registry-refresh-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "PROOF_CENTRE_REGISTRY_REFRESH_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-entry-count", proof?.entryCount === 8, String(proof?.entryCount));
check("proof-all-entries-proven", proof?.allEntriesProven === true, String(proof?.allEntriesProven));
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`page-no-forbidden:${pattern}`, !page.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 29 - Proof Centre Registry Refresh",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_registry_refresh_only",
  control_plane_impact: "Founder Proof Centre now lists BATCH 21 through BATCH 28 proof gates.",
  registry: registryPath,
  proof: proofPath,
  page: pagePath,
  next_action: passed
    ? "Commit BATCH 29."
    : "Repair BATCH 29 registry refresh before moving forward."
};

writeJson(validationPath, validation);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
