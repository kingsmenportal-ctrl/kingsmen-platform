#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/docker-oracle-lite-container-preparation-proof.json");
const checks = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(rel) {
  return JSON.parse(read(rel));
}

function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}

const requiredFiles = [
  "reports/runtime/free-destiny-map-next-backend-bridge-proof.json",
  "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  "reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json",
  "apps/web/package.json",
  "apps/web/package-lock.json",
  "apps/web/next.config.mjs",
  "apps/web/Dockerfile.oracle-lite",
  "apps/api/Dockerfile.oracle-lite",
  "apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs",
  "apps/api/src/runtime/free-destiny-map-backend-local-server.mjs",
  "docker/oracle-lite/docker-compose.local.yml",
  ".dockerignore"
];

for (const file of requiredFiles) {
  check(`required-file-exists:${file}`, exists(file), file);
}

if (exists("reports/runtime/free-destiny-map-next-backend-bridge-proof.json")) {
  const bridge = parseJson("reports/runtime/free-destiny-map-next-backend-bridge-proof.json");
  check("batch-18-next-backend-bridge-proven", bridge.status === "NEXT_BACKEND_BRIDGE_PROVEN" && bridge.passed === true, `status=${bridge.status}; passed=${bridge.passed}`);
  check("batch-18-statuses-proven", bridge.webStatus === 200 && bridge.backendHealthStatus === 200 && bridge.bridgeApiStatus === 202, `webStatus=${bridge.webStatus}; backendHealthStatus=${bridge.backendHealthStatus}; bridgeApiStatus=${bridge.bridgeApiStatus}`);
  check("batch-18-production-oracle-false", bridge.productionReady === false && bridge.canClaimProduction === false && bridge.deployedToOracle === false, "production/oracle false");
}

if (exists("reports/runtime/free-destiny-map-controlled-production-build-proof.json")) {
  const build = parseJson("reports/runtime/free-destiny-map-controlled-production-build-proof.json");
  check("batch-16-production-build-proven", build.status === "CONTROLLED_PRODUCTION_BUILD_PROVEN" && build.buildExitCode === 0, `status=${build.status}; exit=${build.buildExitCode}`);
}

if (exists("apps/web/Dockerfile.oracle-lite")) {
  const webDockerfile = read("apps/web/Dockerfile.oracle-lite");
  check("web-dockerfile-uses-node-22-alpine", webDockerfile.includes("node:22-alpine"), "node:22-alpine");
  check("web-dockerfile-runs-npm-ci", webDockerfile.includes("npm ci --no-audit --no-fund"), "npm ci");
  check("web-dockerfile-runs-next-build", webDockerfile.includes("npm run build"), "next build");
  check("web-dockerfile-exposes-3000", webDockerfile.includes("EXPOSE 3000"), "EXPOSE 3000");
  check("web-dockerfile-sets-bridge-env", webDockerfile.includes("KINGSMEN_ENABLE_BACKEND_BRIDGE=true"), "bridge env");
  check("web-dockerfile-keeps-local-write-false", webDockerfile.includes("KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE=false"), "local write false");
}

if (exists("apps/api/Dockerfile.oracle-lite")) {
  const apiDockerfile = read("apps/api/Dockerfile.oracle-lite");
  check("api-dockerfile-uses-node-22-alpine", apiDockerfile.includes("node:22-alpine"), "node:22-alpine");
  check("api-dockerfile-exposes-3001", apiDockerfile.includes("EXPOSE 3001"), "EXPOSE 3001");
  check("api-dockerfile-runs-backend-server", apiDockerfile.includes("free-destiny-map-backend-local-server.mjs"), "backend server entry");
  check("api-dockerfile-local-backend-write-default-false", apiDockerfile.includes("KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE=false"), "local backend write false");
}

if (exists("apps/api/src/runtime/free-destiny-map-backend-local-server.mjs")) {
  const server = read("apps/api/src/runtime/free-destiny-map-backend-local-server.mjs");
  check("backend-server-imports-runtime-factory", server.includes("createFreeDestinyMapBackendLocalServer"), "runtime factory");
  check("backend-server-uses-host-env", server.includes("process.env.HOST"), "HOST env");
  check("backend-server-uses-port-env", server.includes("process.env.PORT"), "PORT env");
  check("backend-server-handles-sigterm", server.includes("SIGTERM"), "SIGTERM");
  check("backend-server-keeps-production-false", server.includes("productionReady: false"), "production false");
  check("backend-server-keeps-oracle-false", server.includes("deployedToOracle: false"), "oracle false");
}

if (exists("docker/oracle-lite/docker-compose.local.yml")) {
  const compose = read("docker/oracle-lite/docker-compose.local.yml");
  check("compose-defines-api-service", compose.includes("kingsmen-api:"), "kingsmen-api");
  check("compose-defines-web-service", compose.includes("kingsmen-web:"), "kingsmen-web");
  check("compose-api-localhost-port", compose.includes('"127.0.0.1:3001:3001"'), "api localhost port");
  check("compose-web-localhost-port", compose.includes('"127.0.0.1:3000:3000"'), "web localhost port");
  check("compose-web-depends-on-api", compose.includes("depends_on:") && compose.includes("kingsmen-api"), "depends_on api");
  check("compose-web-uses-backend-service-url", compose.includes("http://kingsmen-api:3001"), "backend service url");
  check("compose-no-postgres-yet", !/postgres/i.test(compose), "no postgres service in BATCH 19");
  check("compose-no-redis-yet", !/redis/i.test(compose), "no redis service in BATCH 19");
  check("compose-no-n8n-yet", !/n8n/i.test(compose), "no n8n service in BATCH 19");
  check("compose-no-playwright-yet", !/playwright/i.test(compose), "no playwright service in BATCH 19");
  check("compose-uses-low-memory-limits", compose.includes("mem_limit: 512m") && compose.includes("mem_limit: 768m"), "low memory limits");
  check("compose-uses-low-cpu-limits", compose.includes('cpus: "0.50"') && compose.includes('cpus: "0.75"'), "low cpu limits");
}

if (exists(".dockerignore")) {
  const dockerignore = read(".dockerignore");
  check("dockerignore-ignores-node-modules", dockerignore.includes("node_modules"), "node_modules ignored");
  check("dockerignore-ignores-next", dockerignore.includes(".next"), ".next ignored");
  check("dockerignore-ignores-env", dockerignore.includes(".env"), ".env ignored");
  check("dockerignore-ignores-git", dockerignore.includes(".git"), ".git ignored");
}

const safetyFiles = [
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

for (const file of safetyFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    check(`forbidden-pattern-absent:${file}:${label}`, !pattern.test(content), label);
  }
}

const commandFiles = [
  "docs/runtime/docker-oracle-lite-container-preparation.md",
  "scripts/proof/prove-docker-oracle-lite-container-preparation.mjs",
  "scripts/validators/validate-docker-oracle-lite-container-preparation.mjs"
];

for (const file of commandFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  check(`no-docker-run-command-in:${file}`, !/docker\s+run/i.test(content), "docker run absent");
  check(`no-compose-up-command-in:${file}`, !/docker\s+compose\s+up|docker-compose\s+up/i.test(content), "compose up absent");
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.docker-oracle-lite-container-preparation-report.v1",
  module: "BATCH 19 - Docker / Oracle Lite Local Runtime Container Preparation",
  status: passed ? "DOCKER_ORACLE_LITE_CONTAINER_PREPARED" : "DOCKER_ORACLE_LITE_CONTAINER_PREPARATION_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  dockerRunsInThisBatch: false,
  dockerBuildsInThisBatch: false,
  composeUpInThisBatch: false,
  generated_at: new Date().toISOString(),
  checks,
  failed,
  oracle_lite_impact: "container_preparation_only",
  runtime_scope: "Docker/Oracle Lite file preparation only; no docker build; no compose up; no Oracle deployment",
  next_action: passed
    ? "Run validator and commit BATCH 19. BATCH 20 may attempt controlled Docker local build proof."
    : "Repair Docker/Oracle Lite container preparation failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
