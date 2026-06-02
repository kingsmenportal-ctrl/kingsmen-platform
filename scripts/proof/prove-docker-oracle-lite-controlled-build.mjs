#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/docker-oracle-lite-controlled-build-proof.json");

const timeoutArg = process.argv.find((item) => item.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 900;
const timeoutMs = Number.isFinite(timeoutSeconds) && timeoutSeconds > 0 ? timeoutSeconds * 1000 : 900000;

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

function trimLog(lines, limit = 180) {
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
  const timeout = options.timeoutMs ?? 30000;
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

const requiredFiles = [
  "reports/runtime/docker-oracle-lite-container-preparation-proof.json",
  "manifests/runtime/docker-oracle-lite-container-preparation.json",
  ".dockerignore",
  "apps/web/Dockerfile.oracle-lite",
  "apps/api/Dockerfile.oracle-lite",
  "apps/api/src/runtime/free-destiny-map-backend-local-server.mjs",
  "docker/oracle-lite/docker-compose.local.yml",
  "apps/web/package.json",
  "apps/web/package-lock.json"
];

for (const file of requiredFiles) {
  check(`required-file-exists:${file}`, exists(file), file);
}

if (exists("reports/runtime/docker-oracle-lite-container-preparation-proof.json")) {
  const prep = parseJson("reports/runtime/docker-oracle-lite-container-preparation-proof.json");
  check("batch-19-container-preparation-proven", prep.status === "DOCKER_ORACLE_LITE_CONTAINER_PREPARED" && prep.passed === true, `status=${prep.status}; passed=${prep.passed}`);
  check("batch-19-no-runtime-started", prep.dockerRunsInThisBatch === false && prep.composeUpInThisBatch === false, "no runtime started");
  check("batch-19-production-oracle-false", prep.productionReady === false && prep.canClaimProduction === false && prep.deployedToOracle === false, "production/oracle false");
}

if (exists("manifests/runtime/docker-oracle-lite-container-preparation.json")) {
  const manifest = parseJson("manifests/runtime/docker-oracle-lite-container-preparation.json");
  check("batch-19-manifest-preparation-only", manifest.dockerBuildsInThisBatch === false && manifest.composeUpInThisBatch === false, "preparation only");
}

if (exists("docker/oracle-lite/docker-compose.local.yml")) {
  const compose = read("docker/oracle-lite/docker-compose.local.yml");
  check("compose-file-present-but-not-started", compose.includes("kingsmen-api") && compose.includes("kingsmen-web"), "compose prepared only");
  check("compose-uses-localhost-bindings", compose.includes("127.0.0.1:3000:3000") && compose.includes("127.0.0.1:3001:3001"), "localhost ports");
}

let dockerAvailable = false;
let dockerVersion = null;
let dockerInfoOk = false;
let dockerBuildsAttempted = false;
let apiBuildExitCode = null;
let webBuildExitCode = null;
let apiImageInspectExitCode = null;
let webImageInspectExitCode = null;
let apiImageId = null;
let webImageId = null;
let unavailableReason = null;

const preFailures = checks.filter((item) => item.passed !== true);

if (preFailures.length === 0) {
  const versionResult = await runDocker(["--version"], { timeoutMs: 20000, collectOutput: true });
  dockerVersion = `${versionResult.stdout}${versionResult.stderr}`.trim();

  check("docker-cli-command-available", versionResult.code === 0, versionResult.error ?? dockerVersion);

  if (versionResult.code !== 0) {
    unavailableReason = versionResult.error ?? dockerVersion || "Docker CLI unavailable.";
  } else {
    const infoResult = await runDocker(["info"], { timeoutMs: 30000, collectOutput: true });
    dockerInfoOk = infoResult.code === 0;
    check("docker-daemon-available", dockerInfoOk, infoResult.error ?? `${infoResult.stdout}${infoResult.stderr}`.slice(-500));

    if (!dockerInfoOk) {
      unavailableReason = infoResult.error ?? `${infoResult.stdout}${infoResult.stderr}`.trim() || "Docker daemon unavailable.";
    } else {
      dockerAvailable = true;
    }
  }
}

if (preFailures.length === 0 && dockerAvailable) {
  dockerBuildsAttempted = true;

  const apiBuild = await runDocker(
    ["build", "-f", "apps/api/Dockerfile.oracle-lite", "-t", "kingsmen/api:oracle-lite-local", "."],
    { timeoutMs }
  );
  apiBuildExitCode = apiBuild.code;
  check("docker-build-api-image-exit-zero", apiBuildExitCode === 0, `exitCode=${apiBuildExitCode}; timedOut=${apiBuild.timedOut}; error=${apiBuild.error ?? "none"}`);

  const webBuild = await runDocker(
    ["build", "-f", "apps/web/Dockerfile.oracle-lite", "-t", "kingsmen/web:oracle-lite-local", "."],
    { timeoutMs }
  );
  webBuildExitCode = webBuild.code;
  check("docker-build-web-image-exit-zero", webBuildExitCode === 0, `exitCode=${webBuildExitCode}; timedOut=${webBuild.timedOut}; error=${webBuild.error ?? "none"}`);

  const apiInspect = await runDocker(["image", "inspect", "kingsmen/api:oracle-lite-local", "--format", "{{.Id}}"], { timeoutMs: 30000 });
  apiImageInspectExitCode = apiInspect.code;
  apiImageId = apiInspect.stdout.trim() || null;
  check("docker-inspect-api-image", apiImageInspectExitCode === 0 && Boolean(apiImageId), apiImageId ?? `exitCode=${apiImageInspectExitCode}`);

  const webInspect = await runDocker(["image", "inspect", "kingsmen/web:oracle-lite-local", "--format", "{{.Id}}"], { timeoutMs: 30000 });
  webImageInspectExitCode = webInspect.code;
  webImageId = webInspect.stdout.trim() || null;
  check("docker-inspect-web-image", webImageInspectExitCode === 0 && Boolean(webImageId), webImageId ?? `exitCode=${webImageInspectExitCode}`);
}

const commandText = `${stdoutLines.join("\n")}\n${stderrLines.join("\n")}`;
check("controlled-docker-build-no-container-start-output", !/container\s+started|server\s+started|listening\s+on/i.test(commandText), "no container/server startup output");
check("controlled-docker-build-no-compose-start-output", !/Creating\s+network|Creating\s+container|Started|Attaching\s+to/i.test(commandText), "no compose startup output");
check("controlled-docker-build-no-oracle-deploy-output", !/oci\s+deploy|oracle\s+deploy|deploy\s+to\s+oracle/i.test(commandText), "no Oracle deployment output");
check("controlled-docker-build-no-production-true", !/productionReady\s*[:=]\s*true/i.test(commandText), "productionReady true absent");
check("controlled-docker-build-no-official-submission-true", !/officialApplicationSubmitted\s*[:=]\s*true/i.test(commandText), "officialApplicationSubmitted true absent");
check("controlled-docker-build-no-payment-true", !/paymentInstructionSent\s*[:=]\s*true/i.test(commandText), "paymentInstructionSent true absent");
check("controlled-docker-build-no-email-true", !/emailSent\s*[:=]\s*true/i.test(commandText), "emailSent true absent");
check("controlled-docker-build-no-document-upload-true", !/documentUploadAccepted\s*[:=]\s*true/i.test(commandText), "documentUploadAccepted true absent");

const buildSucceeded =
  dockerAvailable &&
  dockerBuildsAttempted &&
  apiBuildExitCode === 0 &&
  webBuildExitCode === 0 &&
  apiImageInspectExitCode === 0 &&
  webImageInspectExitCode === 0;

const failed = checks.filter((item) => item.passed !== true);
let status = "DOCKER_LOCAL_BUILD_FAILED";
let passed = failed.length === 0;

if (!dockerAvailable && preFailures.length === 0) {
  status = "DOCKER_LOCAL_BUILD_UNAVAILABLE";
  passed = true;
} else if (buildSucceeded && failed.length === 0) {
  status = "DOCKER_LOCAL_BUILD_PROVEN";
  passed = true;
} else {
  status = "DOCKER_LOCAL_BUILD_FAILED";
  passed = false;
}

const report = {
  schema: "kingsmen.docker-oracle-lite-controlled-build-report.v1",
  module: "BATCH 20 - Controlled Docker Local Build Proof",
  status,
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  dockerAvailable,
  dockerVersion,
  dockerInfoOk,
  unavailableReason,
  dockerBuildsAttempted,
  dockerBuildsSucceeded: buildSucceeded,
  dockerRunsInThisBatch: false,
  composeUpInThisBatch: false,
  apiImage: "kingsmen/api:oracle-lite-local",
  webImage: "kingsmen/web:oracle-lite-local",
  apiBuildExitCode,
  webBuildExitCode,
  apiImageInspectExitCode,
  webImageInspectExitCode,
  apiImageId,
  webImageId,
  checks,
  failed: status === "DOCKER_LOCAL_BUILD_UNAVAILABLE" ? [] : failed,
  stdout_tail: trimLog(stdoutLines),
  stderr_tail: trimLog(stderrLines),
  oracle_lite_impact: "controlled_local_docker_build_only",
  runtime_scope: "controlled Docker local image build proof only; no container runtime; no Compose startup; no Oracle deployment",
  next_action:
    status === "DOCKER_LOCAL_BUILD_PROVEN"
      ? "Run validator and commit BATCH 20. BATCH 21 may run controlled Docker local runtime proof."
      : status === "DOCKER_LOCAL_BUILD_UNAVAILABLE"
        ? "Docker is unavailable. Start or install Docker, rerun BATCH 20, and do not move to Docker runtime proof yet."
        : "Repair Docker local build failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));

if (status === "DOCKER_LOCAL_BUILD_FAILED") {
  process.exit(1);
}
