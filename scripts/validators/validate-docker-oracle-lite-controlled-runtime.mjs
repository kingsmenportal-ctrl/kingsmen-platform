#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/docker-oracle-lite-controlled-runtime-latest.json");

const requiredFiles = [
  "docs/runtime/docker-oracle-lite-controlled-runtime-proof.md",
  "manifests/runtime/docker-oracle-lite-controlled-runtime-proof.json",
  "packages/contracts/src/docker-oracle-lite-controlled-runtime.ts",
  "scripts/runtime/Invoke-DockerOracleLiteControlledRuntime.ps1",
  "scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs",
  "reports/runtime/docker-oracle-lite-controlled-runtime-proof.json",
  "scripts/validators/validate-docker-oracle-lite-controlled-runtime.mjs",
  "reports/validation/docker-oracle-lite-controlled-runtime-latest.json"
];

const upstreamFiles = [
  "reports/runtime/docker-oracle-lite-controlled-build-proof.json",
  "docker/oracle-lite/docker-compose.local.yml",
  "apps/web/Dockerfile.oracle-lite",
  "apps/api/Dockerfile.oracle-lite"
];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(rel) {
  return JSON.parse(read(rel));
}

const failures = [];
const warnings = [];
const checked = [];

for (const file of requiredFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty required file: ${file}`);
}

for (const file of upstreamFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing upstream file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty upstream file: ${file}`);
}

if (exists("manifests/runtime/docker-oracle-lite-controlled-runtime-proof.json")) {
  const manifest = parseJson("manifests/runtime/docker-oracle-lite-controlled-runtime-proof.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.dockerRunsInThisBatch !== true) failures.push("Manifest must declare dockerRunsInThisBatch true.");
  if (manifest.dockerBuildsInThisBatch !== false) failures.push("Manifest must keep dockerBuildsInThisBatch false.");
  if (manifest.composeUpInThisBatch !== true) failures.push("Manifest must declare composeUpInThisBatch true.");
  if (manifest.composeDownInThisBatch !== true) failures.push("Manifest must declare composeDownInThisBatch true.");
  if (manifest.deploysToOracle !== false) failures.push("Manifest must keep deploysToOracle false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.oracleLiteImpact !== "controlled_local_docker_runtime_only") failures.push("Manifest must declare controlled_local_docker_runtime_only.");
}

const tokenChecks = [
  ["packages/contracts/src/docker-oracle-lite-controlled-runtime.ts", ["DOCKER_LOCAL_RUNTIME_PROVEN", "composeUpInThisBatch: true", "composeDownInThisBatch: true", "deployedToOracle: false"]],
  ["scripts/runtime/Invoke-DockerOracleLiteControlledRuntime.ps1", ["ControlledDockerRuntime", "does not deploy to Oracle", "does not submit official applications"]],
  ["scripts/proof/prove-docker-oracle-lite-controlled-runtime.mjs", ["DOCKER_LOCAL_RUNTIME_PROVEN", "docker-runtime-api-health-200", "docker-runtime-web-page-200", "docker-runtime-bridge-api-202", "docker-runtime-compose-down-after"]],
  ["reports/runtime/docker-oracle-lite-controlled-runtime-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/docker-oracle-lite-controlled-build-proof.json")) {
  const build = parseJson("reports/runtime/docker-oracle-lite-controlled-build-proof.json");
  if (build.status !== "DOCKER_LOCAL_BUILD_PROVEN" || build.passed !== true) {
    failures.push("BATCH 20 Docker local build proof must be proven and passed.");
  }
}

if (exists("reports/runtime/docker-oracle-lite-controlled-runtime-proof.json")) {
  const proof = parseJson("reports/runtime/docker-oracle-lite-controlled-runtime-proof.json");

  if (proof.status !== "DOCKER_LOCAL_RUNTIME_PROVEN") failures.push("Runtime proof status must be DOCKER_LOCAL_RUNTIME_PROVEN.");
  if (proof.passed !== true) failures.push("Runtime proof must pass.");
  if (proof.productionReady !== false) failures.push("Runtime proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Runtime proof must keep canClaimProduction false.");
  if (proof.deployedToOracle !== false) failures.push("Runtime proof must keep deployedToOracle false.");
  if (proof.dockerRunsInThisBatch !== true) failures.push("Runtime proof must declare dockerRunsInThisBatch true.");
  if (proof.dockerBuildsInThisBatch !== false) failures.push("Runtime proof must keep dockerBuildsInThisBatch false.");
  if (proof.composeUpInThisBatch !== true) failures.push("Runtime proof must declare composeUpInThisBatch true.");
  if (proof.composeDownInThisBatch !== true) failures.push("Runtime proof must declare composeDownInThisBatch true.");
  if (proof.composeUpSucceeded !== true) failures.push("Runtime proof must record composeUpSucceeded true.");
  if (proof.composeDownSucceeded !== true) failures.push("Runtime proof must record composeDownSucceeded true.");
  if (proof.apiHealthStatus !== 200) failures.push("Runtime proof must record apiHealthStatus 200.");
  if (proof.webStatus !== 200) failures.push("Runtime proof must record webStatus 200.");
  if (proof.bridgeApiStatus !== 202) failures.push("Runtime proof must record bridgeApiStatus 202.");
  if (proof.backend_bridge_succeeded !== true) failures.push("Runtime proof must record backend_bridge_succeeded true.");
  if (proof.backend_boundary_reached !== true) failures.push("Runtime proof must record backend_boundary_reached true.");
  if (proof.backend_local_write_succeeded !== true) failures.push("Runtime proof must record backend_local_write_succeeded true.");
  if (proof.oracle_lite_impact !== "controlled_local_docker_runtime_only") failures.push("Runtime proof must declare controlled_local_docker_runtime_only.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 30) failures.push("Runtime proof must include detailed checks.");
}

const forbiddenFiles = [
  "docs/runtime/docker-oracle-lite-controlled-runtime-proof.md",
  "manifests/runtime/docker-oracle-lite-controlled-runtime-proof.json",
  "packages/contracts/src/docker-oracle-lite-controlled-runtime.ts",
  "scripts/runtime/Invoke-DockerOracleLiteControlledRuntime.ps1"
];

const forbiddenPatterns = [
  [/productionReady\s*[:=]\s*true/i, "productionReady true"],
  [/canClaimProduction\s*[:=]\s*true/i, "canClaimProduction true"],
  [/deployedToOracle\s*[:=]\s*true/i, "deployedToOracle true"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/emailSent:\s*true/i, "email sent true"],
  [/documentUploadAccepted:\s*true/i, "document upload accepted true"]
];

for (const file of forbiddenFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 21 - Controlled Docker Local Runtime Proof",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  upstream_files_checked: upstreamFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "controlled_local_docker_runtime_only",
  control_plane_impact: "Build Proof Centre can show the first controlled local Docker runtime proof.",
  runtime_proof: "reports/runtime/docker-oracle-lite-controlled-runtime-proof.json",
  next_action: passed ? "Proceed to BATCH 22 - Docker runtime health hardening or Oracle VM handoff preparation." : "Repair Docker local runtime proof failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
