#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceOnly = process.argv.includes("--source-only");

const requiredFiles = [
  ".github/workflows/batch21c-docker-runtime-proof.yml",
  "docs/runtime/batch21c-github-actions-docker-runtime-proof.md",
  "manifests/runtime/batch21c-github-actions-docker-runtime-proof.json",
  "scripts/proof/prove-docker-oracle-lite-controlled-runtime-ci.mjs",
  "scripts/validators/validate-docker-oracle-lite-controlled-runtime-ci.mjs"
];

const reportFile = "reports/runtime/batch21c-docker-runtime-proof.json";
const validationReportPath = path.join(root, "reports/validation/batch21c-docker-runtime-proof-latest.json");

const failures = [];

function full(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(full(file))) {
    failures.push(`Missing required file: ${file}`);
  } else if (fs.statSync(full(file)).size === 0) {
    failures.push(`Empty required file: ${file}`);
  }
}

if (fs.existsSync(full(".github/workflows/batch21c-docker-runtime-proof.yml"))) {
  const workflow = read(".github/workflows/batch21c-docker-runtime-proof.yml");
  for (const token of [
    "BATCH 21C Docker Runtime Proof",
    "prove-docker-oracle-lite-controlled-runtime-ci.mjs",
    "validate-docker-oracle-lite-controlled-runtime-ci.mjs",
    "actions/upload-artifact@v4"
  ]) {
    if (!workflow.includes(token)) failures.push(`Workflow missing token: ${token}`);
  }
}

if (fs.existsSync(full("manifests/runtime/batch21c-github-actions-docker-runtime-proof.json"))) {
  const manifest = JSON.parse(read("manifests/runtime/batch21c-github-actions-docker-runtime-proof.json"));

  if (manifest.productionReady !== false) failures.push("Manifest productionReady must be false.");
  if (manifest.deployedToOracle !== false) failures.push("Manifest deployedToOracle must be false.");
  if (manifest.requiredProof?.apiHealthStatus !== 200) failures.push("Manifest must require apiHealthStatus 200.");
  if (manifest.requiredProof?.webStatus !== 200) failures.push("Manifest must require webStatus 200.");
  if (manifest.requiredProof?.bridgeApiStatus !== 202) failures.push("Manifest must require bridgeApiStatus 202.");
}

if (!sourceOnly) {
  if (!fs.existsSync(full(reportFile))) {
    failures.push(`Missing proof report: ${reportFile}`);
  } else {
    const report = JSON.parse(read(reportFile));

    if (report.status !== "BATCH21C_DOCKER_RUNTIME_PROVEN") failures.push(`Report status is ${report.status}`);
    if (report.passed !== true) failures.push("Report passed must be true.");
    if (report.productionReady !== false) failures.push("Report productionReady must be false.");
    if (report.proofEnvironment !== "github_actions") failures.push(`Report proofEnvironment must be github_actions, got ${report.proofEnvironment}`);
    if (report.composeUpSucceeded !== true) failures.push("composeUpSucceeded must be true.");
    if (report.composeDownSucceeded !== true) failures.push("composeDownSucceeded must be true.");
    if (report.apiHealthStatus !== 200) failures.push(`apiHealthStatus must be 200, got ${report.apiHealthStatus}`);
    if (report.webStatus !== 200) failures.push(`webStatus must be 200, got ${report.webStatus}`);
    if (report.bridgeApiStatus !== 202) failures.push(`bridgeApiStatus must be 202, got ${report.bridgeApiStatus}`);
    if (report.backend_bridge_succeeded !== true) failures.push("backend_bridge_succeeded must be true.");
    if (report.backend_boundary_reached !== true) failures.push("backend_boundary_reached must be true.");
    if (report.backend_local_write_succeeded !== true) failures.push("backend_local_write_succeeded must be true.");
  }
}

const passed = failures.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 21C - GitHub Actions Docker Runtime Proof",
  status: passed ? "VALIDATED" : "BUILT_PENDING_GITHUB_ACTIONS_RUN",
  passed,
  sourceOnly,
  productionReady: false,
  failed_checks: failures,
  generated_at: new Date().toISOString(),
  next_action: passed
    ? "BATCH 21C proof is valid. Proceed to BATCH 22."
    : "Push workflow and wait for GitHub Actions runtime proof to pass."
};

fs.mkdirSync(path.dirname(validationReportPath), { recursive: true });
fs.writeFileSync(validationReportPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

console.log(JSON.stringify(validation, null, 2));
if (!passed) process.exit(1);
