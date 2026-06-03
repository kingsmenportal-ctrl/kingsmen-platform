#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "reports/validation/batch21c-docker-runtime-proof-latest.json");
const required = [
  ".github/workflows/batch21c-docker-runtime-proof.yml",
  "docs/runtime/batch21c-github-actions-docker-runtime-proof.md",
  "manifests/runtime/batch21c-github-actions-docker-runtime-proof.json",
  "scripts/proof/prove-docker-oracle-lite-controlled-runtime-ci.mjs",
  "scripts/validators/validate-docker-oracle-lite-controlled-runtime-ci.mjs",
  "reports/runtime/batch21c-docker-runtime-proof.json",
  "reports/validation/batch21c-docker-runtime-proof-latest.json"
];

const failures = [];
for (const file of required) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let proof = null;
try {
  proof = JSON.parse(fs.readFileSync(path.join(root, "reports/runtime/batch21c-docker-runtime-proof.json"), "utf8"));
} catch {
  failures.push("Runtime proof JSON could not be parsed.");
}

if (proof) {
  if (proof.status !== "GITHUB_ACTIONS_DOCKER_RUNTIME_PROVEN") failures.push("CI proof status must be GITHUB_ACTIONS_DOCKER_RUNTIME_PROVEN.");
  if (proof.passed !== true) failures.push("CI proof must pass.");
  if (proof.productionReady !== false || proof.canClaimProduction !== false || proof.deployedToOracle !== false) failures.push("CI proof must keep production/oracle false.");
  if (proof.composeUpSucceeded !== true) failures.push("CI proof must record composeUpSucceeded true.");
  if (proof.composeDownSucceeded !== true) failures.push("CI proof must record composeDownSucceeded true.");
  if (proof.apiHealthStatus !== 200) failures.push("CI proof must record apiHealthStatus 200.");
  if (proof.webStatus !== 200) failures.push("CI proof must record webStatus 200.");
  if (proof.bridgeApiStatus !== 202) failures.push("CI proof must record bridgeApiStatus 202.");
  if (proof.backend_bridge_succeeded !== true) failures.push("CI proof must record backend_bridge_succeeded true.");
  if (proof.backend_boundary_reached !== true) failures.push("CI proof must record backend_boundary_reached true.");
  if (proof.backend_local_write_succeeded !== true) failures.push("CI proof must record backend_local_write_succeeded true.");
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 21C - GitHub Actions Docker Runtime Proof",
  status: passed ? "VALIDATED" : "BUILT_PENDING_CI_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: required,
  files_checked: required.length,
  missing_files: required.filter(f => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "ci_docker_runtime_proof_only",
  runtime_proof: "reports/runtime/batch21c-docker-runtime-proof.json",
  next_action: passed ? "Proceed to N_PROVIDER.5 provider map repo sync." : "Wait for GitHub Actions runtime proof to pass."
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
