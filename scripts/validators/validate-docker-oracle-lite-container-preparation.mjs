#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/docker-oracle-lite-container-preparation-latest.json");

const requiredFiles = [
  "docs/runtime/docker-oracle-lite-container-preparation.md",
  "manifests/runtime/docker-oracle-lite-container-preparation.json",
  ".dockerignore",
  "apps/web/Dockerfile.oracle-lite",
  "apps/api/Dockerfile.oracle-lite",
  "apps/api/src/runtime/free-destiny-map-backend-local-server.mjs",
  "docker/oracle-lite/docker-compose.local.yml",
  "packages/contracts/src/docker-oracle-lite-container-preparation.ts",
  "scripts/proof/prove-docker-oracle-lite-container-preparation.mjs",
  "reports/runtime/docker-oracle-lite-container-preparation-proof.json",
  "scripts/validators/validate-docker-oracle-lite-container-preparation.mjs",
  "reports/validation/docker-oracle-lite-container-preparation-latest.json"
];

const upstreamFiles = [
  "reports/runtime/free-destiny-map-next-backend-bridge-proof.json",
  "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  "reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json"
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

if (exists("manifests/runtime/docker-oracle-lite-container-preparation.json")) {
  const manifest = parseJson("manifests/runtime/docker-oracle-lite-container-preparation.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.dockerRunsInThisBatch !== false) failures.push("Manifest must keep dockerRunsInThisBatch false.");
  if (manifest.dockerBuildsInThisBatch !== false) failures.push("Manifest must keep dockerBuildsInThisBatch false.");
  if (manifest.composeUpInThisBatch !== false) failures.push("Manifest must keep composeUpInThisBatch false.");
  if (manifest.deploysToOracle !== false) failures.push("Manifest must keep deploysToOracle false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.oracleLiteImpact !== "container_preparation_only") failures.push("Manifest must declare container_preparation_only.");
}

const tokenChecks = [
  [".dockerignore", ["node_modules", ".next", ".env", ".git"]],
  ["apps/web/Dockerfile.oracle-lite", ["node:22-alpine", "npm ci --no-audit --no-fund", "npm run build", "EXPOSE 3000", "KINGSMEN_ENABLE_BACKEND_BRIDGE=true"]],
  ["apps/api/Dockerfile.oracle-lite", ["node:22-alpine", "EXPOSE 3001", "free-destiny-map-backend-local-server.mjs", "KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE=false"]],
  ["apps/api/src/runtime/free-destiny-map-backend-local-server.mjs", ["createFreeDestinyMapBackendLocalServer", "SIGTERM", "productionReady: false", "deployedToOracle: false"]],
  ["docker/oracle-lite/docker-compose.local.yml", ["kingsmen-api", "kingsmen-web", "127.0.0.1:3000:3000", "127.0.0.1:3001:3001", "http://kingsmen-api:3001", "mem_limit", "cpus"]],
  ["packages/contracts/src/docker-oracle-lite-container-preparation.ts", ["DOCKER_ORACLE_LITE_CONTAINER_PREPARED", "dockerRunsInThisBatch: false", "composeUpInThisBatch: false"]],
  ["scripts/proof/prove-docker-oracle-lite-container-preparation.mjs", ["DOCKER_ORACLE_LITE_CONTAINER_PREPARED", "dockerBuildsInThisBatch: false", "composeUpInThisBatch: false", "container_preparation_only"]],
  ["reports/runtime/docker-oracle-lite-container-preparation-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/docker-oracle-lite-container-preparation-proof.json")) {
  const proof = parseJson("reports/runtime/docker-oracle-lite-container-preparation-proof.json");
  if (proof.passed !== true) failures.push("Docker/Oracle Lite container preparation proof must pass.");
  if (proof.status !== "DOCKER_ORACLE_LITE_CONTAINER_PREPARED") failures.push("Docker/Oracle Lite container preparation proof status must be DOCKER_ORACLE_LITE_CONTAINER_PREPARED.");
  if (proof.productionReady !== false) failures.push("Proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Proof must keep canClaimProduction false.");
  if (proof.deployedToOracle !== false) failures.push("Proof must keep deployedToOracle false.");
  if (proof.dockerRunsInThisBatch !== false) failures.push("Proof must keep dockerRunsInThisBatch false.");
  if (proof.dockerBuildsInThisBatch !== false) failures.push("Proof must keep dockerBuildsInThisBatch false.");
  if (proof.composeUpInThisBatch !== false) failures.push("Proof must keep composeUpInThisBatch false.");
  if (proof.oracle_lite_impact !== "container_preparation_only") failures.push("Proof must declare container_preparation_only.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 30) failures.push("Proof must include detailed checks.");
}

const forbiddenFiles = [
  "docs/runtime/docker-oracle-lite-container-preparation.md",
  "manifests/runtime/docker-oracle-lite-container-preparation.json",
  "apps/web/Dockerfile.oracle-lite",
  "apps/api/Dockerfile.oracle-lite",
  "apps/api/src/runtime/free-destiny-map-backend-local-server.mjs",
  "docker/oracle-lite/docker-compose.local.yml",
  "packages/contracts/src/docker-oracle-lite-container-preparation.ts"
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
  module: "BATCH 19 - Docker / Oracle Lite Local Runtime Container Preparation",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  upstream_files_checked: upstreamFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "container_preparation_only",
  control_plane_impact: "Prepares Docker/Oracle Lite local runtime boundaries for controlled Docker proof.",
  runtime_proof: "reports/runtime/docker-oracle-lite-container-preparation-proof.json",
  next_action: passed ? "Proceed to BATCH 20 - Controlled Docker local build proof." : "Repair Docker/Oracle Lite container preparation failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
