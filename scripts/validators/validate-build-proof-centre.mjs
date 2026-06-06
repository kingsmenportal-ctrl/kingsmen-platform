#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = path.join(root, "reports/validation/build-proof-centre-latest.json");

const expectedFiles = [
  "docs/runtime/build-proof-centre.md",
  "manifests/runtime/build-proof-centre.json",
  "packages/contracts/src/build-proof-centre.ts",
  "scripts/proof/prove-build-proof-centre.mjs",
  "scripts/validators/validate-build-proof-centre.mjs",
  "reports/runtime/build-proof-centre-read-model.json",
  "reports/runtime/build-proof-centre-proof.json"
];

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, ""));
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const readModel = exists("reports/runtime/build-proof-centre-read-model.json")
  ? readJson("reports/runtime/build-proof-centre-read-model.json")
  : null;

const proof = exists("reports/runtime/build-proof-centre-proof.json")
  ? readJson("reports/runtime/build-proof-centre-proof.json")
  : null;

check("read-model-schema", readModel?.schema === "kingsmen.build-proof-centre-read-model.v1", readModel?.schema ?? "missing");
check("read-model-local-only", readModel?.runtimeScope === "local_file_read_model_only", readModel?.runtimeScope ?? "missing");
check("read-model-proof-items", Array.isArray(readModel?.proofItems) && readModel.proofItems.length === 2, `items=${readModel?.proofItems?.length ?? 0}`);
check("read-model-all-passed", readModel?.allProofItemsPassed === true, String(readModel?.allProofItemsPassed));
check("read-model-no-production", readModel?.productionReady === false && readModel?.canClaimProduction === false && readModel?.noProductionClaim === true, "production false");
check("read-model-no-oracle", readModel?.deployedToOracle === false && readModel?.noOracleClaim === true, "oracle false");

const ids = new Set((readModel?.proofItems ?? []).map((item) => item.id));
check("read-model-has-batch21", ids.has("docker-oracle-lite-controlled-runtime"), [...ids].join(","));
check("read-model-has-batch22", ids.has("docker-oracle-lite-runtime-health-hardening"), [...ids].join(","));

for (const item of readModel?.proofItems ?? []) {
  check(`item-${item.id}-passed`, item.passed === true, item.status);
  check(`item-${item.id}-not-production`, item.productionReady === false && item.canClaimProduction === false, "production false");
  check(`item-${item.id}-not-oracle`, item.deployedToOracle === false, "oracle false");
  check(`item-${item.id}-report-exists`, exists(item.reportPath), item.reportPath);
  check(`item-${item.id}-validation-exists`, exists(item.validationPath), item.validationPath);
}

check("proof-schema", proof?.schema === "kingsmen.build-proof-centre-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "BUILD_PROOF_CENTRE_READ_MODEL_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 23 - Build Proof Centre Read Model",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "none_local_file_read_model_only",
  control_plane_impact: "Future Build Proof Centre can display BATCH 21 and BATCH 22 proof status without starting runtime services.",
  read_model: "reports/runtime/build-proof-centre-read-model.json",
  runtime_proof: "reports/runtime/build-proof-centre-proof.json",
  next_action: passed
    ? "Commit BATCH 23."
    : "Repair BATCH 23 proof read model before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
