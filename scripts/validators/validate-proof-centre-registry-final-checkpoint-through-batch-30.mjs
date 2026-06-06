#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const expectedFiles = [
  "docs/control-plane/proof-centre-registry-final-checkpoint-through-batch-30.md",
  "manifests/control-plane/proof-centre-registry-final-checkpoint-through-batch-30.json",
  "packages/contracts/src/proof-centre-registry-final-checkpoint-through-batch-30.ts",
  "scripts/proof/prove-proof-centre-registry-final-checkpoint-through-batch-30.mjs",
  "scripts/validators/validate-proof-centre-registry-final-checkpoint-through-batch-30.mjs",
  "reports/control-plane/proof-centre-registry.json",
  "apps/web/src/app/founder/proof-centre/page.tsx",
  "reports/control-plane/proof-centre-registry-final-checkpoint-through-batch-30-proof.json"
];

const validationPath = "reports/validation/proof-centre-registry-final-checkpoint-through-batch-30-latest.json";
const proofPath = "reports/control-plane/proof-centre-registry-final-checkpoint-through-batch-30-proof.json";

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

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const proof = exists(proofPath) ? readJson(proofPath) : null;

check("proof-schema", proof?.schema === "kingsmen.proof-centre-registry-final-checkpoint-through-batch-30-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "PROOF_CENTRE_REGISTRY_FINAL_CHECKPOINT_THROUGH_BATCH_30_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-starts-docker-false", proof?.startsDocker === false, "startsDocker false");
check("proof-entry-count-10", proof?.entryCount === 10, `entryCount=${proof?.entryCount}`);
check("proof-expected-entry-count-10", proof?.expectedEntryCount === 10, `expected=${proof?.expectedEntryCount}`);
check("proof-all-registry-entries-present", proof?.allEntriesPresentInRegistry === true, "registry");
check("proof-all-page-entries-present", proof?.allEntriesPresentInPage === true, "page");
check("proof-all-entries-proven", proof?.allEntriesProven === true, "proof reports");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const expectedEntries = [
  "BATCH 21",
  "BATCH 22",
  "BATCH 23",
  "BATCH 24",
  "BATCH 25",
  "BATCH 26B",
  "BATCH 27",
  "BATCH 28",
  "BATCH 29",
  "BATCH 30"
];

const registry = exists("reports/control-plane/proof-centre-registry.json")
  ? readText("reports/control-plane/proof-centre-registry.json")
  : "";

const page = exists("apps/web/src/app/founder/proof-centre/page.tsx")
  ? readText("apps/web/src/app/founder/proof-centre/page.tsx")
  : "";

for (const title of expectedEntries) {
  check(`registry-still-includes:${title}`, registry.includes(title), title);
  check(`page-still-includes:${title}`, page.includes(title), title);
}

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`registry-no-forbidden:${pattern}`, !registry.includes(pattern), pattern);
  check(`page-no-forbidden:${pattern}`, !page.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 31 - Proof Centre Registry Final Checkpoint Through BATCH 30",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_checkpoint_only",
  control_plane_impact: "Founder Proof Centre registry and page have a checkpoint through BATCH 30.",
  proof: proofPath,
  next_action: passed
    ? "Commit BATCH 31."
    : "Repair BATCH 31 checkpoint before moving forward."
};

writeText(validationPath, `${JSON.stringify(validation, null, 2)}\n`);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
