#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { createFreeDestinyMapBackendLocalServer } from "../../apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs";

const root = process.cwd();
const webDir = path.join(root, "apps/web");
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-next-backend-bridge-proof.json");
const backendLocalDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");

const timeoutArg = process.argv.find((item) => item.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 120;
const timeoutMs = Number.isFinite(timeoutSeconds) && timeoutSeconds > 0 ? timeoutSeconds * 1000 : 120000;

const checks = [];
const stdoutLines = [];
const stderrLines = [];

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

function trimLog(lines) {
  return lines.join("").split(/\r?\n/).filter(Boolean).slice(-120);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function waitForHttpOk(url, maxMs) {
  const started = Date.now();
  let lastError = "";
  while (Date.now() - started < maxMs) {
    try {
      const response = await fetchWithTimeout(url, {}, 7000);
      const text = await response.text();
      if (response.status === 200) {
        return { ok: true, status: response.status, text, lastError };
      }
      lastError = `status=${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(1000);
  }
  return { ok: false, status: 0, text: "", lastError };
}

async function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve(true));
  });
}

async function stopProcessTree(child) {
  if (!child || !child.pid) return false;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });
      killer.once("close", () => resolve());
      killer.once("error", () => resolve());
    });
  } else {
    try {
      child.kill("SIGTERM");
    } catch {}
    await sleep(1500);
    if (child.exitCode === null) {
      try {
        child.kill("SIGKILL");
      } catch {}
    }
  }

  await sleep(1500);
  return true;
}

function safeEnvForNext(backendBaseUrl) {
  const safeEnv = {};
  const envKeysToKeep = [
    "PATH",
    "Path",
    "PATHEXT",
    "SystemRoot",
    "WINDIR",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "COMSPEC",
    "HOMEDRIVE",
    "HOMEPATH",
    "PROCESSOR_ARCHITECTURE",
    "PROCESSOR_IDENTIFIER",
    "NUMBER_OF_PROCESSORS"
  ];

  for (const key of envKeysToKeep) {
    const value = process.env[key];
    if (!key || key.includes("=") || key.includes("\u0000")) continue;
    if (typeof value === "undefined" || String(value).includes("\u0000")) continue;
    safeEnv[key] = String(value);
  }

  safeEnv.NEXT_TELEMETRY_DISABLED = "1";
  safeEnv.CI = "1";
  safeEnv.NODE_ENV = "development";
  safeEnv.KINGSMEN_ENABLE_BACKEND_BRIDGE = "true";
  safeEnv.KINGSMEN_BACKEND_BASE_URL = backendBaseUrl;
  safeEnv.KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "false";

  return safeEnv;
}

const requiredPreFiles = [
  "reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json",
  "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/node_modules/next/package.json",
  "data/local/.gitignore"
];

for (const file of requiredPreFiles) {
  check(`pre-file-exists:${file}`, exists(file), file);
}

if (exists("reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json")) {
  const backendProof = parseJson("reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json");
  check("batch-17-backend-boundary-proven", backendProof.status === "BACKEND_RUNTIME_BOUNDARY_PROVEN" && backendProof.passed === true, `status=${backendProof.status}; passed=${backendProof.passed}`);
  check("batch-17-backend-statuses", backendProof.healthStatus === 200 && backendProof.intakeStatus === 202, `healthStatus=${backendProof.healthStatus}; intakeStatus=${backendProof.intakeStatus}`);
  check("batch-17-production-oracle-false", backendProof.productionReady === false && backendProof.canClaimProduction === false && backendProof.deployedToOracle === false, "production/oracle false");
}

if (exists("reports/runtime/free-destiny-map-controlled-production-build-proof.json")) {
  const buildProof = parseJson("reports/runtime/free-destiny-map-controlled-production-build-proof.json");
  check("batch-16-production-build-proven", buildProof.status === "CONTROLLED_PRODUCTION_BUILD_PROVEN" && buildProof.passed === true, `status=${buildProof.status}; passed=${buildProof.passed}`);
}

if (exists("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts")) {
  const route = read("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts");
  check("next-route-has-backend-bridge-flag", route.includes("KINGSMEN_ENABLE_BACKEND_BRIDGE"), "bridge flag present");
  check("next-route-has-backend-base-url-env", route.includes("KINGSMEN_BACKEND_BASE_URL"), "backend base URL env present");
  check("next-route-posts-to-backend-boundary", route.includes("postToBackendBoundary"), "postToBackendBoundary present");
  check("next-route-response-has-bridge-succeeded", route.includes("backendBridgeSucceeded"), "backendBridgeSucceeded present");
  check("next-route-response-has-backend-boundary-reached", route.includes("backendBoundaryReached"), "backendBoundaryReached present");
  check("next-route-keeps-production-false", route.includes("productionReady: false"), "production false");
  check("next-route-keeps-oracle-false", route.includes("deployedToOracle: false"), "oracle false");
  check("next-route-keeps-official-submission-false", route.includes("officialApplicationSubmitted: false"), "official false");
  check("next-route-keeps-payment-false", route.includes("paymentInstructionSent: false"), "payment false");
  check("next-route-keeps-documents-false", route.includes("documentUploadAccepted: false"), "documents false");
  check("next-route-keeps-email-false", route.includes("emailSent: false"), "email false");
}

const demoPayload = {
  fullName: "Kingsmen Next Backend Bridge Demo Candidate",
  province: "KwaZulu-Natal",
  currentSituation: "Next-to-backend bridge demo user wants study, funding, accommodation and CV route guidance.",
  knownRoute: "Controlled local Next-to-backend bridge proof",
  routeInterests: ["higher_education", "tvet", "nsfas_bursary", "accommodation", "cv_revamp", "source_check"],
  needsAccommodation: true,
  accommodationArea: "Durban / campus or training area",
  needsFundingHelp: true,
  needsCvHelp: true,
  hasDocumentsReady: false,
  randomSourceName: "Next bridge demo bursary or learnership source to check later",
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
};

check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");

let backendServer = null;
let nextChild = null;
let backendServerStarted = false;
let backendServerStopped = false;
let nextServerStarted = false;
let nextServerStopped = false;
let backendHealthStatus = 0;
let webStatus = 0;
let bridgeApiStatus = 0;
let backendPort = 0;
let nextPort = 0;
let backendBaseUrl = "";
let webUrl = "";
let nextApiUrl = "";
let backendHealthResponse = null;
let bridgeResponse = null;
let spawnError = null;

try {
  const preFailures = checks.filter((item) => item.passed !== true);
  if (preFailures.length > 0) {
    throw new Error("Pre-bridge checks failed. Next-to-backend bridge proof not attempted.");
  }

  backendPort = await getFreePort();
  nextPort = await getFreePort();

  backendBaseUrl = `http://127.0.0.1:${backendPort}`;
  webUrl = `http://127.0.0.1:${nextPort}/free-destiny-map`;
  nextApiUrl = `http://127.0.0.1:${nextPort}/api/public/free-destiny-map/intake/local`;

  backendServer = createFreeDestinyMapBackendLocalServer({
    repoRoot: root,
    enableLocalWrite: true
  });

  await new Promise((resolve, reject) => {
    backendServer.once("error", reject);
    backendServer.listen(backendPort, "127.0.0.1", () => resolve());
  });

  backendServerStarted = true;

  const backendHealthFetch = await fetchWithTimeout(`${backendBaseUrl}/health`);
  backendHealthStatus = backendHealthFetch.status;
  backendHealthResponse = await backendHealthFetch.json();

  check("bridge-backend-server-started", backendServerStarted, `url=${backendBaseUrl}`);
  check("bridge-backend-health-status-200", backendHealthStatus === 200, `status=${backendHealthStatus}`);
  check("bridge-backend-health-production-false", backendHealthResponse.productionReady === false && backendHealthResponse.canClaimProduction === false, "production false");
  check("bridge-backend-health-oracle-false", backendHealthResponse.deployedToOracle === false, "deployedToOracle false");

  const nextCliPath = path.join(webDir, "node_modules/next/dist/bin/next");
  check("bridge-next-cli-exists", fs.existsSync(nextCliPath), nextCliPath);

  const safeEnv = safeEnvForNext(backendBaseUrl);
  check("bridge-next-env-has-backend-url", safeEnv.KINGSMEN_BACKEND_BASE_URL === backendBaseUrl, backendBaseUrl);
  check("bridge-next-env-enables-bridge", safeEnv.KINGSMEN_ENABLE_BACKEND_BRIDGE === "true", "bridge enabled");

  nextChild = spawn(process.execPath, [nextCliPath, "dev", "--hostname", "127.0.0.1", "--port", String(nextPort)], {
    cwd: webDir,
    env: safeEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  nextChild.stdout.on("data", (chunk) => stdoutLines.push(chunk.toString()));
  nextChild.stderr.on("data", (chunk) => stderrLines.push(chunk.toString()));
  nextChild.once("error", (error) => {
    spawnError = error;
  });

  const webResult = await waitForHttpOk(webUrl, timeoutMs);
  webStatus = webResult.status;
  nextServerStarted = webResult.ok;

  check("bridge-next-server-started", nextServerStarted, nextServerStarted ? `url=${webUrl}` : `lastError=${webResult.lastError}`);
  check("bridge-next-web-status-200", webStatus === 200, `status=${webStatus}`);
  check("bridge-next-page-has-free-destiny-map", webResult.text.includes("Free Destiny Map") || webResult.text.includes("Start your Free Destiny Map"), "Free Destiny Map text");

  const bridgeFetch = await fetchWithTimeout(
    nextApiUrl,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(demoPayload)
    },
    20000
  );

  bridgeApiStatus = bridgeFetch.status;
  bridgeResponse = await bridgeFetch.json();

  check("bridge-next-api-status-202", bridgeApiStatus === 202, `status=${bridgeApiStatus}`);
  check("bridge-response-accepted", bridgeResponse.accepted === true, "accepted true");
  check("bridge-response-reference-next18", bridgeResponse.reference === "KM-FDM-NEXT18-BRIDGE", `reference=${bridgeResponse.reference}`);
  check("bridge-response-backend-reference", bridgeResponse.backendReference === "KM-FDM-BACKEND17", `backendReference=${bridgeResponse.backendReference}`);
  check("bridge-response-backend-attempted", bridgeResponse.backendBridgeAttempted === true, "backendBridgeAttempted true");
  check("bridge-response-backend-succeeded", bridgeResponse.backendBridgeSucceeded === true, "backendBridgeSucceeded true");
  check("bridge-response-backend-boundary-reached", bridgeResponse.backendBoundaryReached === true, "backendBoundaryReached true");
  check("bridge-response-backend-local-write-succeeded", bridgeResponse.backendLocalWriteSucceeded === true && fs.existsSync(backendLocalDataFile), path.relative(root, backendLocalDataFile).replaceAll("\\", "/"));
  check("bridge-response-production-false", bridgeResponse.productionReady === false && bridgeResponse.canClaimProduction === false, "production false");
  check("bridge-response-oracle-false", bridgeResponse.deployedToOracle === false, "deployedToOracle false");
  check("bridge-response-official-submission-false", bridgeResponse.officialApplicationSubmitted === false, "official false");
  check("bridge-response-payment-false", bridgeResponse.paymentInstructionSent === false, "payment false");
  check("bridge-response-document-false", bridgeResponse.documentUploadAccepted === false, "document false");
  check("bridge-response-email-false", bridgeResponse.emailSent === false, "email false");
} catch (error) {
  check("bridge-exception-absent", false, error instanceof Error ? error.message : String(error));
} finally {
  if (nextChild) {
    nextServerStopped = await stopProcessTree(nextChild);
  }

  if (backendServer) {
    backendServerStopped = await closeServer(backendServer);
  }
}

check("bridge-next-server-stopped", nextServerStopped, nextServerStopped ? "Next process tree stop attempted" : "Next server was not started or could not be stopped");
check("bridge-backend-server-stopped", backendServerStopped, backendServerStopped ? "backend server close completed" : "backend server was not started or could not be stopped");

if (spawnError) {
  check("bridge-next-spawn-error-absent", false, spawnError.message);
}

const outputSafetyText = JSON.stringify({
  backendHealthResponse,
  bridgeResponse
});

check("bridge-no-deployment-command-output", !/docker\s+compose\s+up|kubectl|oci\s+deploy|oracle\s+deploy|deploy\s+to\s+oracle/i.test(outputSafetyText), "no deployment command output; deployedToOracle false is allowed as a safety flag");
check("bridge-no-production-true", !/productionReady\s*[:=]\s*true/i.test(outputSafetyText), "productionReady true absent");
check("bridge-no-official-submission-true", !/officialApplicationSubmitted\s*[:=]\s*true/i.test(outputSafetyText), "officialApplicationSubmitted true absent");
check("bridge-no-payment-true", !/paymentInstructionSent\s*[:=]\s*true/i.test(outputSafetyText), "paymentInstructionSent true absent");
check("bridge-no-email-true", !/emailSent\s*[:=]\s*true/i.test(outputSafetyText), "emailSent true absent");
check("bridge-no-document-upload-true", !/documentUploadAccepted\s*[:=]\s*true/i.test(outputSafetyText), "documentUploadAccepted true absent");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.next-backend-bridge-report.v1",
  module: "BATCH 18 - Controlled Next-to-Backend Bridge Proof",
  status: passed ? "NEXT_BACKEND_BRIDGE_PROVEN" : "NEXT_BACKEND_BRIDGE_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  nextServerStarted,
  nextServerStopped,
  backendServerStarted,
  backendServerStopped,
  webStatus,
  backendHealthStatus,
  bridgeApiStatus,
  backendBaseUrl,
  webUrl,
  nextApiUrl,
  api_response_reference: bridgeResponse?.reference ?? null,
  backend_reference: bridgeResponse?.backendReference ?? null,
  backend_bridge_succeeded: bridgeResponse?.backendBridgeSucceeded ?? false,
  backend_boundary_reached: bridgeResponse?.backendBoundaryReached ?? false,
  backend_local_write_succeeded: bridgeResponse?.backendLocalWriteSucceeded ?? false,
  local_data_file: fs.existsSync(backendLocalDataFile) ? path.relative(root, backendLocalDataFile).replaceAll("\\", "/") : null,
  checks,
  failed,
  stdout_tail: trimLog(stdoutLines),
  stderr_tail: trimLog(stderrLines),
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "controlled local Next-to-backend bridge proof only; no Oracle runtime; no deployment",
  next_action: passed
    ? "Run validator and commit BATCH 18. Next batch may prepare Docker/Oracle Lite local container boundaries."
    : "Repair Next-to-backend bridge failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
