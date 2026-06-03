#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/docker-oracle-lite-controlled-runtime-proof.json");
const composeFile = "docker/oracle-lite/docker-compose.local.yml";
const backendLocalDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");

const timeoutArg = process.argv.find((item) => item.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 300;
const timeoutMs = Number.isFinite(timeoutSeconds) && timeoutSeconds > 0 ? timeoutSeconds * 1000 : 300000;

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

function trimLog(lines, limit = 160) {
  return lines.join("").split(/\r?\n/).filter(Boolean).slice(-limit);
}

function safeEnv() {
  const env = {};
  const keys = [
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
    "NUMBER_OF_PROCESSORS",
    "DOCKER_HOST",
    "DOCKER_CONTEXT"
  ];

  for (const key of keys) {
    const value = process.env[key];
    if (!key || key.includes("=") || key.includes("\u0000")) continue;
    if (typeof value === "undefined" || String(value).includes("\u0000")) continue;
    env[key] = String(value);
  }

  env.CI = "1";
  env.NEXT_TELEMETRY_DISABLED = "1";

  return env;
}

function runDocker(args, options = {}) {
  const timeout = options.timeoutMs ?? 60000;
  const collectOutput = options.collectOutput !== false;

  return new Promise((resolve) => {
    const out = [];
    const err = [];
    let timedOut = false;

    const child = spawn("docker", args, {
      cwd: root,
      env: safeEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGTERM");
      } catch {}
      if (process.platform === "win32" && child.pid) {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
        killer.once("close", () => {});
        killer.once("error", () => {});
      }
    }, timeout);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      out.push(text);
      if (collectOutput) stdoutLines.push(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      err.push(text);
      if (collectOutput) stderrLines.push(text);
    });

    child.once("error", (error) => {
      clearTimeout(timer);
      resolve({
        code: null,
        timedOut,
        stdout: out.join(""),
        stderr: err.join(""),
        error: error instanceof Error ? error.message : String(error)
      });
    });

    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        timedOut,
        stdout: out.join(""),
        stderr: err.join(""),
        error: null
      });
    });
  });
}


function quoteShellArg(value) {
  const text = String(value);
  if (process.platform === "win32") {
    return `"${text.replace(/"/g, '\\"')}"`;
  }
  return `'${text.replace(/'/g, `'\\''`)}'`;
}

function runDockerCompose(args, options = {}) {
  const timeout = options.timeoutMs ?? 60000;
  const collectOutput = options.collectOutput !== false;
  const normalizedArgs = Array.isArray(args) && args[0] === "compose" ? args.slice(1) : args;

  return new Promise((resolve) => {
    const out = [];
    const err = [];
    let timedOut = false;

    const commandText = ["docker", "compose", ...normalizedArgs].map(quoteShellArg).join(" ");

    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", commandText], {
            cwd: root,
            env: safeEnv(),
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true
          })
        : spawn("sh", ["-lc", commandText], {
            cwd: root,
            env: safeEnv(),
            stdio: ["ignore", "pipe", "pipe"]
          });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGTERM");
      } catch {}
      if (process.platform === "win32" && child.pid) {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
        killer.once("close", () => {});
        killer.once("error", () => {});
      }
    }, timeout);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      out.push(text);
      if (collectOutput) stdoutLines.push(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      err.push(text);
      if (collectOutput) stderrLines.push(text);
    });

    child.once("error", (error) => {
      clearTimeout(timer);
      resolve({
        code: null,
        timedOut,
        stdout: out.join(""),
        stderr: err.join(""),
        error: error instanceof Error ? error.message : String(error)
      });
    });

    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        timedOut,
        stdout: out.join(""),
        stderr: err.join(""),
        error: null
      });
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStatus(url, expectedStatus, maxMs) {
  const started = Date.now();
  let lastError = "";
  let lastStatus = 0;
  let lastText = "";

  while (Date.now() - started < maxMs) {
    try {
      const response = await fetchWithTimeout(url, {}, 7000);
      lastStatus = response.status;
      lastText = await response.text();
      if (response.status === expectedStatus) {
        return { ok: true, status: response.status, text: lastText, lastError };
      }
      lastError = `status=${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(1000);
  }

  return { ok: false, status: lastStatus, text: lastText, lastError };
}

const requiredFiles = [
  "reports/runtime/docker-oracle-lite-controlled-build-proof.json",
  "reports/runtime/docker-oracle-lite-container-preparation-proof.json",
  "docker/oracle-lite/docker-compose.local.yml",
  "apps/web/Dockerfile.oracle-lite",
  "apps/api/Dockerfile.oracle-lite",
  "data/local/.gitignore"
];

for (const file of requiredFiles) {
  check(`required-file-exists:${file}`, exists(file), file);
}

if (exists("reports/runtime/docker-oracle-lite-controlled-build-proof.json")) {
  const build = parseJson("reports/runtime/docker-oracle-lite-controlled-build-proof.json");
  check("batch-20-docker-build-proven", build.status === "DOCKER_LOCAL_BUILD_PROVEN" && build.passed === true, `status=${build.status}; passed=${build.passed}`);
  check("batch-20-docker-builds-succeeded", build.dockerBuildsSucceeded === true && build.apiBuildExitCode === 0 && build.webBuildExitCode === 0, `api=${build.apiBuildExitCode}; web=${build.webBuildExitCode}`);
  check("batch-20-no-runtime-started", build.dockerRunsInThisBatch === false && build.composeUpInThisBatch === false, "BATCH 20 build only");
  check("batch-20-production-oracle-false", build.productionReady === false && build.canClaimProduction === false && build.deployedToOracle === false, "production/oracle false");
}

if (exists("docker/oracle-lite/docker-compose.local.yml")) {
  const compose = read("docker/oracle-lite/docker-compose.local.yml");
  check("compose-defines-api-and-web", compose.includes("kingsmen-api:") && compose.includes("kingsmen-web:"), "api/web services");
  check("compose-uses-localhost-ports", compose.includes("127.0.0.1:3000:3000") && compose.includes("127.0.0.1:3001:3001"), "localhost ports");
  check("compose-bridge-env-present", compose.includes("KINGSMEN_ENABLE_BACKEND_BRIDGE") && compose.includes("KINGSMEN_BACKEND_BASE_URL"), "bridge env");
  check("compose-backend-write-enabled", compose.includes("KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE") && compose.includes('"true"'), "backend local write enabled");
  check("compose-no-postgres-yet", !/postgres/i.test(compose), "no postgres service in BATCH 21");
  check("compose-no-redis-yet", !/redis/i.test(compose), "no redis service in BATCH 21");
}

let dockerAvailable = false;
let composeUpSucceeded = false;
let composeDownSucceeded = false;
let apiHealthStatus = 0;
let webStatus = 0;
let bridgeApiStatus = 0;
let apiHealthResponse = null;
let bridgeResponse = null;
let apiImageId = null;
let webImageId = null;

const demoPayload = {
  fullName: "Kingsmen Docker Runtime Demo Candidate",
  province: "KwaZulu-Natal",
  currentSituation: "Docker runtime demo user wants study, funding, accommodation and CV route guidance.",
  knownRoute: "Controlled Docker local runtime proof",
  routeInterests: ["higher_education", "tvet", "nsfas_bursary", "accommodation", "cv_revamp", "source_check"],
  needsAccommodation: true,
  accommodationArea: "Durban / campus or training area",
  needsFundingHelp: true,
  needsCvHelp: true,
  hasDocumentsReady: false,
  randomSourceName: "Docker runtime demo bursary or learnership source to check later",
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
};

check("demo-payload-has-consent", demoPayload.consentToBeContacted === true && demoPayload.consentToProcessBasicInfo === true, "consent true");
check("demo-payload-has-route-intent", demoPayload.routeInterests.length > 0 && Boolean(demoPayload.currentSituation), "route intent present");
check("demo-payload-no-sensitive-fields", !Object.keys(demoPayload).some((key) => /identity|idNumber|passport|password|card|cvv|documentBase64/i.test(key)), "no sensitive field keys");

try {
  const preFailures = checks.filter((item) => item.passed !== true);
  if (preFailures.length > 0) {
    throw new Error("Pre-runtime checks failed. Docker runtime proof not attempted.");
  }

  const infoResult = await runDocker(["info"], { timeoutMs: 30000 });
  dockerAvailable = infoResult.code === 0;
  check("docker-daemon-available", dockerAvailable, infoResult.error ?? `${infoResult.stdout}${infoResult.stderr}`.slice(-500));

  const apiInspect = await runDocker(["image", "inspect", "kingsmen/api:oracle-lite-local", "--format", "{{.Id}}"], { timeoutMs: 30000 });
  apiImageId = apiInspect.stdout.trim() || null;
  check("docker-runtime-api-image-exists", apiInspect.code === 0 && Boolean(apiImageId), apiImageId ?? `exit=${apiInspect.code}`);

  const webInspect = await runDocker(["image", "inspect", "kingsmen/web:oracle-lite-local", "--format", "{{.Id}}"], { timeoutMs: 30000 });
  webImageId = webInspect.stdout.trim() || null;
  check("docker-runtime-web-image-exists", webInspect.code === 0 && Boolean(webImageId), webImageId ?? `exit=${webInspect.code}`);

  const downBefore = await runDockerCompose(["-f", composeFile, "down", "--remove-orphans"], { timeoutMs: 120000 });
  check("docker-runtime-compose-down-before", [0].includes(downBefore.code), `exit=${downBefore.code}; timedOut=${downBefore.timedOut}`);

  const up = await runDockerCompose(["-f", composeFile, "up", "-d", "--no-build"], { timeoutMs });
  composeUpSucceeded = up.code === 0;
  check("docker-runtime-compose-up-no-build", composeUpSucceeded, `exit=${up.code}; timedOut=${up.timedOut}; error=${up.error ?? "none"}`);

  const ps = await runDockerCompose(["-f", composeFile, "ps"], { timeoutMs: 30000 });
  check("docker-runtime-compose-ps-runs", ps.code === 0 && ps.stdout.includes("kingsmen-api") && ps.stdout.includes("kingsmen-web"), "compose ps includes web/api");

  const apiHealth = await waitForStatus("http://127.0.0.1:3001/health", 200, timeoutMs);
  apiHealthStatus = apiHealth.status;
  apiHealthResponse = apiHealth.text ? JSON.parse(apiHealth.text) : null;

  check("docker-runtime-api-health-200", apiHealth.ok, apiHealth.ok ? "HTTP 200" : apiHealth.lastError);
  check("docker-runtime-api-health-production-false", apiHealthResponse?.productionReady === false && apiHealthResponse?.canClaimProduction === false, "production false");
  check("docker-runtime-api-health-oracle-false", apiHealthResponse?.deployedToOracle === false, "deployedToOracle false");

  const web = await waitForStatus("http://127.0.0.1:3000/free-destiny-map", 200, timeoutMs);
  webStatus = web.status;

  check("docker-runtime-web-page-200", web.ok, web.ok ? "HTTP 200" : web.lastError);
  check("docker-runtime-web-page-has-free-destiny-map", web.text.includes("Free Destiny Map") || web.text.includes("Start your Free Destiny Map"), "Free Destiny Map text");

  const bridgeFetch = await fetchWithTimeout(
    "http://127.0.0.1:3000/api/public/free-destiny-map/intake/local",
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

  check("docker-runtime-bridge-api-202", bridgeApiStatus === 202, `status=${bridgeApiStatus}`);
  check("docker-runtime-bridge-response-accepted", bridgeResponse.accepted === true, "accepted true");
  check("docker-runtime-bridge-backend-succeeded", bridgeResponse.backendBridgeSucceeded === true, "backendBridgeSucceeded true");
  check("docker-runtime-bridge-backend-boundary-reached", bridgeResponse.backendBoundaryReached === true, "backendBoundaryReached true");
  check("docker-runtime-bridge-backend-reference", bridgeResponse.backendReference === "KM-FDM-BACKEND17", `backendReference=${bridgeResponse.backendReference}`);
  check("docker-runtime-backend-local-write-succeeded", bridgeResponse.backendLocalWriteSucceeded === true && fs.existsSync(backendLocalDataFile), fs.existsSync(backendLocalDataFile) ? path.relative(root, backendLocalDataFile).replaceAll("\\", "/") : "missing local proof file");
  check("docker-runtime-bridge-production-false", bridgeResponse.productionReady === false && bridgeResponse.canClaimProduction === false, "production false");
  check("docker-runtime-bridge-oracle-false", bridgeResponse.deployedToOracle === false, "deployedToOracle false");
  check("docker-runtime-bridge-official-submission-false", bridgeResponse.officialApplicationSubmitted === false, "official false");
  check("docker-runtime-bridge-payment-false", bridgeResponse.paymentInstructionSent === false, "payment false");
  check("docker-runtime-bridge-document-false", bridgeResponse.documentUploadAccepted === false, "document false");
  check("docker-runtime-bridge-email-false", bridgeResponse.emailSent === false, "email false");
} catch (error) {
  check("docker-runtime-exception-absent", false, error instanceof Error ? error.message : String(error));
} finally {
  const down = await runDockerCompose(["-f", composeFile, "down", "--remove-orphans"], { timeoutMs: 120000 });
  composeDownSucceeded = down.code === 0;
  check("docker-runtime-compose-down-after", composeDownSucceeded, `exit=${down.code}; timedOut=${down.timedOut}`);
}

const outputSafetyText = JSON.stringify({
  apiHealthResponse,
  bridgeResponse
});

check("docker-runtime-no-oracle-deploy-output", !/oci\s+deploy|oracle\s+deploy|deploy\s+to\s+oracle/i.test(outputSafetyText), "no Oracle deployment output");
check("docker-runtime-no-production-true", !/productionReady\s*[:=]\s*true/i.test(outputSafetyText), "productionReady true absent");
check("docker-runtime-no-official-submission-true", !/officialApplicationSubmitted\s*[:=]\s*true/i.test(outputSafetyText), "officialApplicationSubmitted true absent");
check("docker-runtime-no-payment-true", !/paymentInstructionSent\s*[:=]\s*true/i.test(outputSafetyText), "paymentInstructionSent true absent");
check("docker-runtime-no-email-true", !/emailSent\s*[:=]\s*true/i.test(outputSafetyText), "emailSent true absent");
check("docker-runtime-no-document-upload-true", !/documentUploadAccepted\s*[:=]\s*true/i.test(outputSafetyText), "documentUploadAccepted true absent");

const runtimeSucceeded =
  dockerAvailable &&
  composeUpSucceeded &&
  composeDownSucceeded &&
  apiHealthStatus === 200 &&
  webStatus === 200 &&
  bridgeApiStatus === 202 &&
  bridgeResponse?.backendBridgeSucceeded === true &&
  bridgeResponse?.backendBoundaryReached === true &&
  bridgeResponse?.backendLocalWriteSucceeded === true;

const failed = checks.filter((item) => item.passed !== true);
const passed = runtimeSucceeded && failed.length === 0;

const report = {
  schema: "kingsmen.docker-oracle-lite-controlled-runtime-report.v1",
  module: "BATCH 21 - Controlled Docker Local Runtime Proof",
  status: passed ? "DOCKER_LOCAL_RUNTIME_PROVEN" : "DOCKER_LOCAL_RUNTIME_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  dockerRunsInThisBatch: true,
  dockerBuildsInThisBatch: false,
  composeUpInThisBatch: true,
  composeDownInThisBatch: true,
  composeUpSucceeded,
  composeDownSucceeded,
  apiHealthStatus,
  webStatus,
  bridgeApiStatus,
  apiImage: "kingsmen/api:oracle-lite-local",
  webImage: "kingsmen/web:oracle-lite-local",
  apiImageId,
  webImageId,
  apiHealthUrl: "http://127.0.0.1:3001/health",
  webUrl: "http://127.0.0.1:3000/free-destiny-map",
  bridgeApiUrl: "http://127.0.0.1:3000/api/public/free-destiny-map/intake/local",
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
  oracle_lite_impact: "controlled_local_docker_runtime_only",
  runtime_scope: "controlled Docker local runtime proof only; no Oracle deployment; no public production URL",
  next_action: passed
    ? "Run validator and commit BATCH 21. Next batch may harden Docker runtime health or prepare Oracle VM handoff."
    : "Repair Docker local runtime failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
