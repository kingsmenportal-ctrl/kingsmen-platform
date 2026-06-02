#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const webDir = path.join(root, "apps/web");
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-controlled-production-build-proof.json");

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

function trimLog(lines) {
  return lines.join("").split(/\r?\n/).filter(Boolean).slice(-160);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  await sleep(1000);
  return true;
}

function safeEnvForBuild() {
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
  safeEnv.NODE_ENV = "production";

  return safeEnv;
}

const requiredPreFiles = [
  "reports/runtime/free-destiny-map-controlled-next-boot-proof.json",
  "reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json",
  "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "apps/web/package.json",
  "apps/web/package-lock.json",
  "apps/web/next.config.mjs",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "apps/web/node_modules/next/package.json",
  "apps/web/node_modules/react/package.json",
  "apps/web/node_modules/react-dom/package.json",
  "apps/web/.gitignore"
];

for (const file of requiredPreFiles) {
  check(`pre-file-exists:${file}`, exists(file), file);
}

if (exists("reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json")) {
  const integration = parseJson("reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json");
  check("batch-15b-integration-proven", integration.status === "CONTROLLED_WEB_API_INTEGRATION_PROVEN" && integration.passed === true, `status=${integration.status}; passed=${integration.passed}`);
  check("batch-15b-production-false", integration.productionReady === false && integration.canClaimProduction === false, "production false");
  check("batch-15b-web-and-api-statuses", integration.webStatus === 200 && integration.apiStatus === 202, `webStatus=${integration.webStatus}; apiStatus=${integration.apiStatus}`);
}

if (exists("apps/web/package.json")) {
  const pkg = parseJson("apps/web/package.json");
  check("web-build-script-present", String(pkg.scripts?.build ?? "").includes("next build"), String(pkg.scripts?.build ?? ""));
  check("web-next-dependency-present", Boolean(pkg.dependencies?.next), pkg.dependencies?.next ?? "missing");
  check("web-react-dependency-present", Boolean(pkg.dependencies?.react), pkg.dependencies?.react ?? "missing");
  check("web-react-dom-dependency-present", Boolean(pkg.dependencies?.["react-dom"]), pkg.dependencies?.["react-dom"] ?? "missing");
}

if (exists("apps/web/.gitignore")) {
  const ignore = read("apps/web/.gitignore");
  check("web-build-output-ignored", ignore.includes(".next"), ".next ignored");
  check("web-node-modules-ignored", ignore.includes("node_modules"), "node_modules ignored");
}

if (exists("apps/web/next.config.mjs")) {
  const config = read("apps/web/next.config.mjs");
  check("next-config-output-file-tracing-root-present", config.includes("outputFileTracingRoot"), "outputFileTracingRoot present");
  check("next-config-powered-header-disabled", config.includes("poweredByHeader: false"), "poweredByHeader false");
}

if (exists("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts")) {
  const route = read("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts");
  check("api-route-keeps-production-false", route.includes("productionReady: false"), "production false");
  check("api-route-keeps-payment-false", route.includes("paymentInstructionSent: false"), "payment false");
  check("api-route-keeps-email-false", route.includes("emailSent: false"), "email false");
  check("api-route-keeps-document-false", route.includes("documentUploadAccepted: false"), "document false");
  check("api-route-keeps-official-submission-false", route.includes("officialApplicationSubmitted: false"), "official false");
}

let child = null;
let buildStarted = false;
let buildExited = false;
let buildExitCode = null;
let buildTimedOut = false;
let spawnError = null;

try {
  const preFailures = checks.filter((item) => item.passed !== true);
  if (preFailures.length > 0) {
    throw new Error("Pre-build checks failed. Controlled production build not attempted.");
  }

  const nextCliPath = path.join(webDir, "node_modules/next/dist/bin/next");
  check("controlled-build-next-cli-exists", fs.existsSync(nextCliPath), nextCliPath);

  const safeEnv = safeEnvForBuild();
  check("controlled-build-minimal-env", true, `keys=${Object.keys(safeEnv).join(",")}`);

  child = spawn(process.execPath, [nextCliPath, "build"], {
    cwd: webDir,
    env: safeEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  buildStarted = true;

  child.stdout.on("data", (chunk) => stdoutLines.push(chunk.toString()));
  child.stderr.on("data", (chunk) => stderrLines.push(chunk.toString()));
  child.once("error", (error) => {
    spawnError = error;
  });

  const result = await new Promise((resolve) => {
    const timer = setTimeout(async () => {
      buildTimedOut = true;
      await stopProcessTree(child);
      resolve({ code: null, timedOut: true });
    }, timeoutMs);

    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({ code, timedOut: false });
    });
  });

  buildExited = !result.timedOut;
  buildExitCode = result.code;

  check("controlled-production-build-started", buildStarted, "next build process started");
  check("controlled-production-build-exited", buildExited, buildExited ? `exitCode=${buildExitCode}` : "build timeout");
  check("controlled-production-build-exit-code-zero", buildExitCode === 0, `exitCode=${buildExitCode}`);
  check("controlled-production-build-not-timed-out", buildTimedOut === false, `timedOut=${buildTimedOut}`);
  check("controlled-production-build-output-directory-exists", exists("apps/web/.next"), "apps/web/.next");
  check("controlled-production-build-build-id-or-manifest-exists", exists("apps/web/.next/BUILD_ID") || exists("apps/web/.next/routes-manifest.json") || exists("apps/web/.next/server"), "build output markers");
} catch (error) {
  check("controlled-production-build-exception-absent", false, error instanceof Error ? error.message : String(error));
} finally {
  if (child && buildTimedOut) {
    await stopProcessTree(child);
  }
}

if (spawnError) {
  check("controlled-production-build-spawn-error-absent", false, spawnError.message);
}

const outputText = `${stdoutLines.join("")}\n${stderrLines.join("")}`;

check("controlled-production-build-no-oracle-deploy", !/oracle|oci|docker\s+compose\s+up|kubectl|deploy/i.test(outputText), "no deployment command output");
check("controlled-production-build-no-production-true", !/productionReady\s*[:=]\s*true/i.test(outputText), "productionReady true absent");
check("controlled-production-build-no-official-submission-true", !/officialApplicationSubmitted\s*[:=]\s*true/i.test(outputText), "officialApplicationSubmitted true absent");
check("controlled-production-build-no-payment-true", !/paymentInstructionSent\s*[:=]\s*true/i.test(outputText), "paymentInstructionSent true absent");
check("controlled-production-build-no-email-true", !/emailSent\s*[:=]\s*true/i.test(outputText), "emailSent true absent");
check("controlled-production-build-no-document-upload-true", !/documentUploadAccepted\s*[:=]\s*true/i.test(outputText), "documentUploadAccepted true absent");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.controlled-production-build-report.v1",
  module: "BATCH 16 - Controlled Production Build Proof",
  status: passed ? "CONTROLLED_PRODUCTION_BUILD_PROVEN" : "CONTROLLED_PRODUCTION_BUILD_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  buildStarted,
  buildExited,
  buildExitCode,
  buildTimedOut,
  buildOutputDirectory: "apps/web/.next",
  checks,
  failed,
  stdout_tail: trimLog(stdoutLines),
  stderr_tail: trimLog(stderrLines),
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "controlled local Next production build proof only; no Oracle runtime; no deployment",
  next_action: passed
    ? "Run validator and commit BATCH 16. Next batch may add backend runtime integration or Oracle Lite container preparation."
    : "Repair controlled production build failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
