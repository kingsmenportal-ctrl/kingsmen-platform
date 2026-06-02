#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { createFreeDestinyMapBackendLocalServer } from "../../apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json");
const localDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");

const timeoutArg = process.argv.find((item) => item.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 120;
const timeoutMs = Number.isFinite(timeoutSeconds) && timeoutSeconds > 0 ? timeoutSeconds * 1000 : 120000;

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

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function fetchWithTimeout(url, options = {}, ms = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve(true));
  });
}

const requiredPreFiles = [
  "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  "apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "data/local/.gitignore"
];

for (const file of requiredPreFiles) {
  check(`pre-file-exists:${file}`, exists(file), file);
}

if (exists("reports/runtime/free-destiny-map-controlled-production-build-proof.json")) {
  const build = parseJson("reports/runtime/free-destiny-map-controlled-production-build-proof.json");
  check("batch-16-production-build-proven", build.status === "CONTROLLED_PRODUCTION_BUILD_PROVEN" && build.passed === true, `status=${build.status}; passed=${build.passed}`);
  check("batch-16-production-false", build.productionReady === false && build.canClaimProduction === false && build.deployedToOracle === false, "production/oracle false");
  check("batch-16-build-exit-zero", build.buildExitCode === 0, `buildExitCode=${build.buildExitCode}`);
}

if (exists("reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json")) {
  const integration = parseJson("reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json");
  check("batch-15b-integration-proven", integration.status === "CONTROLLED_WEB_API_INTEGRATION_PROVEN" && integration.passed === true, `status=${integration.status}; passed=${integration.passed}`);
  check("batch-15b-web-and-api-statuses", integration.webStatus === 200 && integration.apiStatus === 202, `webStatus=${integration.webStatus}; apiStatus=${integration.apiStatus}`);
}

if (exists("apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs")) {
  const runtime = read("apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs");
  check("backend-runtime-exports-server-factory", runtime.includes("createFreeDestinyMapBackendLocalServer"), "server factory present");
  check("backend-runtime-has-health-endpoint", runtime.includes("/health"), "health endpoint present");
  check("backend-runtime-has-intake-endpoint", runtime.includes("/api/public/free-destiny-map/intake/local"), "intake endpoint present");
  check("backend-runtime-keeps-production-false", runtime.includes("productionReady: false"), "production false");
  check("backend-runtime-keeps-oracle-false", runtime.includes("deployedToOracle: false"), "oracle false");
  check("backend-runtime-blocks-official-submission", runtime.includes("officialApplicationSubmitted: false"), "official false");
  check("backend-runtime-blocks-payment", runtime.includes("paymentInstructionSent: false"), "payment false");
  check("backend-runtime-blocks-documents", runtime.includes("documentUploadAccepted: false"), "documents false");
  check("backend-runtime-blocks-email", runtime.includes("emailSent: false"), "email false");
}

const demoPayload = {
  fullName: "Kingsmen Backend Runtime Demo Candidate",
  province: "KwaZulu-Natal",
  currentSituation: "Backend boundary demo user wants study, funding, accommodation and CV route guidance.",
  knownRoute: "Controlled local backend runtime boundary proof",
  routeInterests: ["higher_education", "tvet", "nsfas_bursary", "accommodation", "cv_revamp", "source_check"],
  needsAccommodation: true,
  accommodationArea: "Durban / campus or training area",
  needsFundingHelp: true,
  needsCvHelp: true,
  hasDocumentsReady: false,
  randomSourceName: "Backend demo bursary or learnership source to check later",
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
};

check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");

let server = null;
let serverStarted = false;
let serverStopped = false;
let healthStatus = 0;
let intakeStatus = 0;
let healthResponse = null;
let intakeResponse = null;
let serverUrl = "";
let intakeUrl = "";
let port = 0;

try {
  const preFailures = checks.filter((item) => item.passed !== true);
  if (preFailures.length > 0) {
    throw new Error("Pre-backend-boundary checks failed. Backend boundary proof not attempted.");
  }

  port = await getFreePort();
  serverUrl = `http://127.0.0.1:${port}/health`;
  intakeUrl = `http://127.0.0.1:${port}/api/public/free-destiny-map/intake/local`;

  server = createFreeDestinyMapBackendLocalServer({
    repoRoot: root,
    enableLocalWrite: true
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  serverStarted = true;

  const healthFetch = await fetchWithTimeout(serverUrl);
  healthStatus = healthFetch.status;
  healthResponse = await healthFetch.json();

  check("backend-boundary-server-started", serverStarted, `url=http://127.0.0.1:${port}`);
  check("backend-boundary-health-status-200", healthStatus === 200, `status=${healthStatus}`);
  check("backend-boundary-health-production-false", healthResponse.productionReady === false && healthResponse.canClaimProduction === false, "production false");
  check("backend-boundary-health-oracle-false", healthResponse.deployedToOracle === false, "deployedToOracle false");

  const intakeFetch = await fetchWithTimeout(
    intakeUrl,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(demoPayload)
    },
    15000
  );

  intakeStatus = intakeFetch.status;
  intakeResponse = await intakeFetch.json();

  check("backend-boundary-intake-status-202", intakeStatus === 202, `status=${intakeStatus}`);
  check("backend-boundary-response-accepted", intakeResponse.accepted === true, "accepted true");
  check("backend-boundary-response-production-false", intakeResponse.productionReady === false && intakeResponse.canClaimProduction === false, "production false");
  check("backend-boundary-response-oracle-false", intakeResponse.deployedToOracle === false, "deployedToOracle false");
  check("backend-boundary-response-official-submission-false", intakeResponse.officialApplicationSubmitted === false, "official false");
  check("backend-boundary-response-payment-false", intakeResponse.paymentInstructionSent === false, "payment false");
  check("backend-boundary-response-document-false", intakeResponse.documentUploadAccepted === false, "document false");
  check("backend-boundary-response-email-false", intakeResponse.emailSent === false, "email false");
  check("backend-boundary-response-reached", intakeResponse.backendBoundaryReached === true, "backendBoundaryReached true");
  check("backend-boundary-local-write-succeeded", intakeResponse.localWriteSucceeded === true && fs.existsSync(localDataFile), path.relative(root, localDataFile).replaceAll("\\", "/"));
} catch (error) {
  check("backend-boundary-exception-absent", false, error instanceof Error ? error.message : String(error));
} finally {
  if (server) {
    serverStopped = await closeServer(server);
  }
}

check("backend-boundary-server-stopped", serverStopped, serverStopped ? "server close completed" : "server was not started or could not be stopped");

const outputSafetyText = JSON.stringify({
  healthResponse,
  intakeResponse
});

check("backend-boundary-no-deployment-command-output", !/docker\s+compose\s+up|kubectl|oci\s+deploy|oracle\s+deploy|deploy\s+to\s+oracle/i.test(outputSafetyText), "no deployment command output; deployedToOracle false is allowed as a safety flag");
check("backend-boundary-no-production-true", !/productionReady\s*[:=]\s*true/i.test(outputSafetyText), "productionReady true absent");
check("backend-boundary-no-official-submission-true", !/officialApplicationSubmitted\s*[:=]\s*true/i.test(outputSafetyText), "officialApplicationSubmitted true absent");
check("backend-boundary-no-payment-true", !/paymentInstructionSent\s*[:=]\s*true/i.test(outputSafetyText), "paymentInstructionSent true absent");
check("backend-boundary-no-email-true", !/emailSent\s*[:=]\s*true/i.test(outputSafetyText), "emailSent true absent");
check("backend-boundary-no-document-upload-true", !/documentUploadAccepted\s*[:=]\s*true/i.test(outputSafetyText), "documentUploadAccepted true absent");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.backend-runtime-boundary-report.v1",
  module: "BATCH 17 - Backend Runtime Integration Shell / Local API Service Boundary",
  status: passed ? "BACKEND_RUNTIME_BOUNDARY_PROVEN" : "BACKEND_RUNTIME_BOUNDARY_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  serverStarted,
  serverStopped,
  healthStatus,
  intakeStatus,
  healthUrl: serverUrl,
  intakeUrl,
  api_response_reference: intakeResponse?.reference ?? null,
  backend_boundary_reached: intakeResponse?.backendBoundaryReached ?? false,
  backend_local_write_succeeded: intakeResponse?.localWriteSucceeded ?? false,
  local_data_file: fs.existsSync(localDataFile) ? path.relative(root, localDataFile).replaceAll("\\", "/") : null,
  checks,
  failed,
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "controlled local backend service boundary proof only; no Oracle runtime; no deployment",
  next_action: passed
    ? "Run validator and commit BATCH 17. Next batch should connect Next local API route to backend runtime boundary."
    : "Repair backend runtime boundary failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
