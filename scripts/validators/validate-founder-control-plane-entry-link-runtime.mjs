#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = "reports/validation/founder-control-plane-entry-link-runtime-latest.json";

const expectedFiles = [
  "docs/control-plane/founder-control-plane-entry-link-runtime-proof.md",
  "manifests/control-plane/founder-control-plane-entry-link-runtime-proof.json",
  "packages/contracts/src/founder-control-plane-entry-link-runtime-proof.ts",
  "scripts/proof/prove-founder-control-plane-entry-link-runtime.mjs",
  "scripts/validators/validate-founder-control-plane-entry-link-runtime.mjs",
  "reports/control-plane/founder-control-plane-entry-link-runtime-proof.json",
  "reports/control-plane/founder-proof-centre-entry-link-proof.json",
  "reports/validation/founder-proof-centre-entry-link-latest.json"
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

const proofPath = "reports/control-plane/founder-control-plane-entry-link-runtime-proof.json";
const proof = exists(proofPath) ? readJson(proofPath) : null;

check("proof-schema", proof?.schema === "kingsmen.founder-control-plane-entry-link-runtime-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "FOUNDER_CONTROL_PLANE_ENTRY_LINK_RUNTIME_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("web-build-succeeded", proof?.webBuildSucceeded === true, String(proof?.webBuildSucceeded));
check("compose-up-succeeded", proof?.composeUpSucceeded === true, String(proof?.composeUpSucceeded));
check("compose-down-succeeded", proof?.composeDownSucceeded === true, String(proof?.composeDownSucceeded));
check("api-health-200", proof?.apiHealthStatus === 200, String(proof?.apiHealthStatus));
check("control-plane-200", proof?.controlPlaneStatus === 200, String(proof?.controlPlaneStatus));
check("proof-centre-200", proof?.proofCentreStatus === 200, String(proof?.proofCentreStatus));
check("entry-link-rendered", proof?.entryLinkRendered === true, String(proof?.entryLinkRendered));
check("target-route-reached", proof?.targetRouteReached === true, String(proof?.targetRouteReached));
check("ports-released-after-down", proof?.portsReleasedAfterDown === true, String(proof?.portsReleasedAfterDown));
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 28 - Founder Control Plane Entry Link Runtime Proof",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [],
  oracle_lite_impact: "controlled_local_docker_runtime_only_no_oracle_claim",
  control_plane_impact: "Founder Control Plane entry link to the Proof Centre is proven in the controlled local Docker web runtime.",
  proof: proofPath,
  next_action: passed
    ? "Commit BATCH 28."
    : "Repair BATCH 28 runtime proof before moving forward."
};

writeJson(validationPath, validation);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
