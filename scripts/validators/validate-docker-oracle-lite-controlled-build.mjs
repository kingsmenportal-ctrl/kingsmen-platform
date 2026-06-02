#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/docker-oracle-lite-controlled-build-latest.json");

const requiredFiles = [
  "docs/runtime/docker-oracle-lite-controlled-build-proof.md",
  "manifests/runtime/docker-oracle-lite-controlled-build-proof.json",
  "packages/contracts/src/docker-oracle-lite-controlled-build.ts",
  "scripts/runtime/Invoke-DockerOracleLiteControlledBuild.ps1",
  "scripts/proof/prove-docker-oracle-lite-controlled-build.mjs",
  "reports/runtime/docker-oracle-lite-controlled-build-proof.json",
  "scripts/validators/validate-docker-oracle-lite-controlled-build.mjs",
  "reports/validation/docker-oracle-lite-controlled-build-latest.json"
];

const upstreamFiles = [
  "reports/runtime/docker-oracle-lite-container-preparation-proof.json",
  "apps/web/Dockerfile.oracle-lite",
  "apps/api/Dockerfile.oracle-lite",
  "docker/oracle-lite/docker-compose.local.yml"
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

if (exists("manifests/runtime/docker-oracle-lite-controlled-build-proof.json")) {
  const manifest = parseJson("manifests/runtime/docker-oracle-lite-controlled-build-proof.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.dockerBuildsInThisBatch !== true) failures.push("Manifest must declare dockerBuildsInThisBatch true.");
  if (manifest.dockerRunsInThisBatch !== false) failures.push("Manifest must keep dockerRunsInThisBatch false.");
  if (manifest.composeUpInThisBatch !== false) failures.push("Manifest must keep composeUpInThisBatch false.");
  if (manifest.deploysToOracle !== false) failures.push("Manifest must keep deploysToOracle false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.oracleLiteImpact !== "controlled_local_docker_build_only") failures.push("Manifest must declare controlled_local_docker_build_only.");
}

const tokenChecks = [
  ["packages/contracts/src/docker-oracle-lite-controlled-build.ts", ["DOCKER_LOCAL_BUILD_PROVEN", "DOCKER_LOCAL_BUILD_UNAVAILABLE", "dockerRunsInThisBatch: false", "composeUpInThisBatch: false"]],
  ["scripts/runtime/Invoke-DockerOracleLiteControlledBuild.ps1", ["ControlledDockerBuild", "does not start containers", "does not deploy to Oracle"]],
  ["scripts/proof/prove-docker-oracle-lite-controlled-build.mjs", ["DOCKER_LOCAL_BUILD_PROVEN", "DOCKER_LOCAL_BUILD_UNAVAILABLE", "dockerBuildsAttempted", "dockerBuildsSucceeded", "composeUpInThisBatch: false"]],
  ["reports/runtime/docker-oracle-lite-controlled-build-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/docker-oracle-lite-container-preparation-proof.json")) {
  const prep = parseJson("reports/runtime/docker-oracle-lite-container-preparation-proof.json");
  if (prep.status !== "DOCKER_ORACLE_LITE_CONTAINER_PREPARED" || prep.passed !== true) {
    failures.push("BATCH 19 preparation proof must be prepared and passed.");
  }
}

if (exists("reports/runtime/docker-oracle-lite-controlled-build-proof.json")) {
  const proof = parseJson("reports/runtime/docker-oracle-lite-controlled-build-proof.json");
  const allowedStatuses = ["DOCKER_LOCAL_BUILD_PROVEN", "DOCKER_LOCAL_BUILD_UNAVAILABLE"];

  if (!allowedStatuses.includes(proof.status)) failures.push("Proof status must be DOCKER_LOCAL_BUILD_PROVEN or DOCKER_LOCAL_BUILD_UNAVAILABLE.");
  if (proof.passed !== true) failures.push("Proof must pass as either build-proven or honest-unavailable.");
  if (proof.productionReady !== false) failures.push("Proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Proof must keep canClaimProduction false.");
  if (proof.deployedToOracle !== false) failures.push("Proof must keep deployedToOracle false.");
  if (proof.dockerRunsInThisBatch !== false) failures.push("Proof must keep dockerRunsInThisBatch false.");
  if (proof.composeUpInThisBatch !== false) failures.push("Proof must keep composeUpInThisBatch false.");
  if (proof.oracle_lite_impact !== "controlled_local_docker_build_only") failures.push("Proof must declare controlled_local_docker_build_only.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 10) failures.push("Proof must include detailed checks.");

  if (proof.status === "DOCKER_LOCAL_BUILD_PROVEN") {
    if (proof.dockerAvailable !== true) failures.push("Build-proven status requires dockerAvailable true.");
    if (proof.dockerBuildsAttempted !== true) failures.push("Build-proven status requires dockerBuildsAttempted true.");
    if (proof.dockerBuildsSucceeded !== true) failures.push("Build-proven status requires dockerBuildsSucceeded true.");
    if (proof.apiBuildExitCode !== 0) failures.push("Build-proven status requires apiBuildExitCode 0.");
    if (proof.webBuildExitCode !== 0) failures.push("Build-proven status requires webBuildExitCode 0.");
    if (!proof.apiImageId) failures.push("Build-proven status requires apiImageId.");
    if (!proof.webImageId) failures.push("Build-proven status requires webImageId.");
  }

  if (proof.status === "DOCKER_LOCAL_BUILD_UNAVAILABLE") {
    warnings.push("Docker is unavailable. BATCH 20 is honestly validated as environment-blocked, not image-build-proven.");
    if (proof.dockerAvailable !== false) failures.push("Unavailable status requires dockerAvailable false.");
    if (proof.dockerBuildsAttempted !== false) failures.push("Unavailable status requires dockerBuildsAttempted false.");
    if (proof.dockerBuildsSucceeded !== false) failures.push("Unavailable status requires dockerBuildsSucceeded false.");
    if (!proof.unavailableReason) failures.push("Unavailable status requires unavailableReason.");
  }
}

const forbiddenFiles = [
  "docs/runtime/docker-oracle-lite-controlled-build-proof.md",
  "manifests/runtime/docker-oracle-lite-controlled-build-proof.json",
  "packages/contracts/src/docker-oracle-lite-controlled-build.ts",
  "scripts/runtime/Invoke-DockerOracleLiteControlledBuild.ps1"
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

let proofStatus = "UNKNOWN";
if (exists("reports/runtime/docker-oracle-lite-controlled-build-proof.json")) {
  proofStatus = parseJson("reports/runtime/docker-oracle-lite-controlled-build-proof.json").status;
}

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 20 - Controlled Docker Local Build Proof",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  proof_status: proofStatus,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  upstream_files_checked: upstreamFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "controlled_local_docker_build_only",
  control_plane_impact: "Build Proof Centre can show Docker build-proven or Docker unavailable state honestly.",
  runtime_proof: "reports/runtime/docker-oracle-lite-controlled-build-proof.json",
  next_action:
    passed && proofStatus === "DOCKER_LOCAL_BUILD_PROVEN"
      ? "Proceed to BATCH 21 - Controlled Docker local runtime proof."
      : passed && proofStatus === "DOCKER_LOCAL_BUILD_UNAVAILABLE"
        ? "Start or install Docker, rerun BATCH 20, and do not proceed to Docker runtime proof yet."
        : "Repair Docker local build proof failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
