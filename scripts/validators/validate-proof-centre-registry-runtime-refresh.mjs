#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = "reports/validation/proof-centre-registry-runtime-refresh-latest.json";

const expectedFiles = [
  "docs/control-plane/proof-centre-registry-runtime-refresh-proof.md",
  "manifests/control-plane/proof-centre-registry-runtime-refresh-proof.json",
  "packages/contracts/src/proof-centre-registry-runtime-refresh-proof.ts",
  "scripts/proof/prove-proof-centre-registry-runtime-refresh.mjs",
  "scripts/validators/validate-proof-centre-registry-runtime-refresh.mjs",
  "reports/control-plane/proof-centre-registry-runtime-refresh-proof.json",
  "reports/control-plane/proof-centre-registry-runtime-page-capture.html",
  "reports/control-plane/proof-centre-registry-refresh-proof.json",
  "reports/validation/proof-centre-registry-refresh-latest.json"
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

const proofPath = "reports/control-plane/proof-centre-registry-runtime-refresh-proof.json";
const pageCapturePath = "reports/control-plane/proof-centre-registry-runtime-page-capture.html";

const proof = exists(proofPath) ? readJson(proofPath) : null;
const page = exists(pageCapturePath) ? readText(pageCapturePath) : "";

check("proof-schema", proof?.schema === "kingsmen.proof-centre-registry-runtime-refresh-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "PROOF_CENTRE_REGISTRY_RUNTIME_REFRESH_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("web-build-succeeded", proof?.webBuildSucceeded === true, String(proof?.webBuildSucceeded));
check("compose-up-succeeded", proof?.composeUpSucceeded === true, String(proof?.composeUpSucceeded));
check("compose-down-succeeded", proof?.composeDownSucceeded === true, String(proof?.composeDownSucceeded));
check("api-health-200", proof?.apiHealthStatus === 200, String(proof?.apiHealthStatus));
check("proof-centre-200", proof?.proofCentreStatus === 200, String(proof?.proofCentreStatus));
check("rendered-eight-batches", proof?.renderedBatchCount === 8 && proof?.allEightBatchesRendered === true, `count=${proof?.renderedBatchCount}`);
check("ports-released-after-down", proof?.portsReleasedAfterDown === true, String(proof?.portsReleasedAfterDown));
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

for (const batch of requiredBatches) {
  check(`page-capture-has:${batch}`, page.includes(batch), batch);
}

check("page-capture-has-founder-title", page.includes("Kingsmen Founder Control Plane"), "founder title");
check("page-capture-has-build-proof-centre", page.includes("Build Proof Centre"), "Build Proof Centre");
check("page-capture-has-local-warning", page.includes("Local founder proof page only"), "local warning");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 30 - Proof Centre Registry Runtime Refresh Proof",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "controlled_local_docker_runtime_only_no_oracle_claim",
  control_plane_impact: "Founder Proof Centre refreshed 8-card registry is proven in the controlled local Docker web runtime.",
  proof: proofPath,
  page_capture: pageCapturePath,
  next_action: passed
    ? "Commit BATCH 30."
    : "Repair BATCH 30 runtime proof before moving forward."
};

writeJson(validationPath, validation);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
