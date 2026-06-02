#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const webDir = path.join(root, "apps/web");
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json");
const localDataFile = path.join(root, "data/local/free-destiny-map/next-api-integration/next-api-demo-intakes.jsonl");

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
  return lines.join("").split(/\r?\n/).filter(Boolean).slice(-100);
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

const requiredPreFiles = [
  "reports/runtime/free-destiny-map-controlled-next-boot-proof.json",
  "reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json",
  "apps/web/package.json",
  "apps/web/next.config.mjs",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "apps/web/node_modules/next/package.json",
  "apps/web/node_modules/react/package.json",
  "apps/web/node_modules/react-dom/package.json",
  "data/local/.gitignore"
];

for (const file of requiredPreFiles) {
  check(`pre-file-exists:${file}`, exists(file), file);
}

if (exists("reports/runtime/free-destiny-map-controlled-next-boot-proof.json")) {
  const boot = parseJson("reports/runtime/free-destiny-map-controlled-next-boot-proof.json");
  check("batch-14-controlled-next-boot-proven", boot.status === "CONTROLLED_NEXT_BOOT_PROVEN" && boot.passed === true, `status=${boot.status}; passed=${boot.passed}`);
  check("batch-14-production-false", boot.productionReady === false && boot.canClaimProduction === false, "production false");
}

if (exists("reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json")) {
  const repair = parseJson("reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json");
  check("batch-15a-workspace-root-repair-applied", repair.status === "WORKSPACE_ROOT_WARNING_REPAIR_APPLIED" && repair.passed === true, `status=${repair.status}; passed=${repair.passed}`);
  check("batch-15a-production-false", repair.productionReady === false && repair.canClaimProduction === false, "production false");
}

if (exists("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts")) {
  const route = read("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts");
  check("next-api-route-exports-post", route.includes("export async function POST"), "POST handler present");
  check("next-api-route-runtime-nodejs", route.includes('runtime = "nodejs"'), "nodejs runtime");
  check("next-api-route-writes-local-jsonl", route.includes("next-api-demo-intakes.jsonl"), "local JSONL write");
  check("next-api-route-keeps-production-false", route.includes("productionReady: false"), "production false");
  check("next-api-route-blocks-official-submission", route.includes("officialApplicationSubmitted: false"), "official false");
  check("next-api-route-blocks-payment", route.includes("paymentInstructionSent: false"), "payment false");
  check("next-api-route-blocks-documents", route.includes("documentUploadAccepted: false"), "documents false");
  check("next-api-route-blocks-email", route.includes("emailSent: false"), "email false");
}

let child = null;
let serverStarted = false;
let serverStopped = false;
let webStatus = 0;
let apiStatus = 0;
let webText = "";
let apiResponse = null;
let webUrl = "";
let apiUrl = "";
let port = 0;
let spawnError = null;

const demoPayload = {
  fullName: "Kingsmen Integrated Demo Candidate",
  province: "KwaZulu-Natal",
  currentSituation: "Integrated local web plus API demo user wants study, funding, accommodation and CV route guidance.",
  knownRoute: "Controlled local Next web plus API integration proof",
  routeInterests: ["higher_education", "tvet", "nsfas_bursary", "accommodation", "cv_revamp", "source_check"],
  needsAccommodation: true,
  accommodationArea: "Durban / campus or training area",
  needsFundingHelp: true,
  needsCvHelp: true,
  hasDocumentsReady: false,
  randomSourceName: "Integrated demo bursary or learnership source to check later",
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
};

check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");

try {
  const preFailures = checks.filter((item) => item.passed !== true);
  if (preFailures.length > 0) {
    throw new Error("Pre-integration checks failed. Controlled integration proof not attempted.");
  }

  port = await getFreePort();
  webUrl = `http://127.0.0.1:${port}/free-destiny-map`;
  apiUrl = `http://127.0.0.1:${port}/api/public/free-destiny-map/intake/local`;

  const nextCliPath = path.join(webDir, "node_modules/next/dist/bin/next");

  check("controlled-web-api-next-cli-exists", fs.existsSync(nextCliPath), nextCliPath);

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
  safeEnv.KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE = "true";

  check("controlled-web-api-minimal-env", true, `keys=${Object.keys(safeEnv).join(",")}`);

  child = spawn(process.execPath, [nextCliPath, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: webDir,
    env: safeEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  child.stdout.on("data", (chunk) => stdoutLines.push(chunk.toString()));
  child.stderr.on("data", (chunk) => stderrLines.push(chunk.toString()));
  child.once("error", (error) => {
    spawnError = error;
  });

  const webResult = await waitForHttpOk(webUrl, timeoutMs);
  webStatus = webResult.status;
  webText = webResult.text;
  serverStarted = webResult.ok;

  check("controlled-web-api-server-started", serverStarted, serverStarted ? `url=${webUrl}` : `lastError=${webResult.lastError}`);
  check("controlled-web-api-web-status-200", webStatus === 200, `status=${webStatus}`);
  check("controlled-web-api-page-has-free-destiny-map", webText.includes("Free Destiny Map") || webText.includes("Start your Free Destiny Map"), "Free Destiny Map text");
  check("controlled-web-api-page-has-local-intake-copy", webText.includes("local intake") || webText.includes("local shell"), "local intake wording");

  const apiFetch = await fetchWithTimeout(
    apiUrl,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(demoPayload)
    },
    15000
  );

  apiStatus = apiFetch.status;
  apiResponse = await apiFetch.json();

  check("controlled-web-api-post-status-202", apiStatus === 202, `status=${apiStatus}`);
  check("controlled-web-api-response-accepted", apiResponse.accepted === true, "accepted true");
  check("controlled-web-api-response-production-false", apiResponse.productionReady === false, "productionReady false");
  check("controlled-web-api-response-official-submission-false", apiResponse.officialApplicationSubmitted === false, "officialApplicationSubmitted false");
  check("controlled-web-api-response-payment-false", apiResponse.paymentInstructionSent === false, "paymentInstructionSent false");
  check("controlled-web-api-response-document-false", apiResponse.documentUploadAccepted === false, "documentUploadAccepted false");
  check("controlled-web-api-response-email-false", apiResponse.emailSent === false, "emailSent false");
  check("controlled-web-api-local-write-succeeded", apiResponse.localWriteSucceeded === true && fs.existsSync(localDataFile), path.relative(root, localDataFile).replaceAll("\\", "/"));
} catch (error) {
  check("controlled-web-api-exception-absent", false, error instanceof Error ? error.message : String(error));
} finally {
  if (child) {
    serverStopped = await stopProcessTree(child);
  }
}

check("controlled-web-api-server-stopped", serverStopped, serverStopped ? "process tree stop attempted" : "server process was not started or could not be stopped");

if (spawnError) {
  check("controlled-web-api-spawn-error-absent", false, spawnError.message);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.controlled-web-api-integration-report.v1",
  module: "BATCH 15B - Controlled Local Web + Local API Integration Proof",
  status: passed ? "CONTROLLED_WEB_API_INTEGRATION_PROVEN" : "CONTROLLED_WEB_API_INTEGRATION_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  generated_at: new Date().toISOString(),
  serverStarted,
  serverStopped,
  webStatus,
  apiStatus,
  webRoute: "/free-destiny-map",
  apiEndpoint: "/api/public/free-destiny-map/intake/local",
  webUrl,
  apiUrl,
  checks,
  failed,
  api_response_reference: apiResponse?.reference ?? null,
  api_local_write_succeeded: apiResponse?.localWriteSucceeded ?? false,
  local_data_file: fs.existsSync(localDataFile) ? path.relative(root, localDataFile).replaceAll("\\", "/") : null,
  stdout_tail: trimLog(stdoutLines),
  stderr_tail: trimLog(stderrLines),
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "controlled local Next web plus local API integration proof only; no Oracle runtime; no production deployment",
  next_action: passed
    ? "Run validator and commit BATCH 15B. Next batch may add production build proof or backend runtime integration."
    : "Repair controlled local web plus API integration failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
