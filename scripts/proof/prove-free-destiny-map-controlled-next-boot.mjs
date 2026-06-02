#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const webDir = path.join(root, "apps/web");
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-controlled-next-boot-proof.json");

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
  return lines.join("").split(/\r?\n/).filter(Boolean).slice(-80);
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

async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForHttpOk(url, maxMs) {
  const started = Date.now();
  let lastError = "";
  while (Date.now() - started < maxMs) {
    try {
      const response = await fetchWithTimeout(url, 7000);
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

check("batch-12-readiness-proof-exists", exists("reports/runtime/free-destiny-map-real-web-readiness-proof.json"), "reports/runtime/free-destiny-map-real-web-readiness-proof.json");
check("batch-13-runtime-repair-proof-exists", exists("reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json"), "reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json");
check("apps-web-package-json-exists", exists("apps/web/package.json"), "apps/web/package.json");
check("apps-web-node-modules-next-exists", exists("apps/web/node_modules/next/package.json"), "apps/web/node_modules/next/package.json");
check("apps-web-node-modules-react-exists", exists("apps/web/node_modules/react/package.json"), "apps/web/node_modules/react/package.json");
check("apps-web-node-modules-react-dom-exists", exists("apps/web/node_modules/react-dom/package.json"), "apps/web/node_modules/react-dom/package.json");
check("free-destiny-map-page-exists", exists("apps/web/src/app/free-destiny-map/page.tsx"), "apps/web/src/app/free-destiny-map/page.tsx");
check("free-destiny-map-form-exists", exists("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx"), "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");

if (exists("reports/runtime/free-destiny-map-real-web-readiness-proof.json")) {
  const readiness = parseJson("reports/runtime/free-destiny-map-real-web-readiness-proof.json");
  check("batch-12-ready-for-controlled-boot", readiness.status === "READY_FOR_CONTROLLED_LOCAL_BOOT" && readiness.canAttemptLocalWebBoot === true, `status=${readiness.status}; canAttemptLocalWebBoot=${readiness.canAttemptLocalWebBoot}`);
  check("batch-12-keeps-production-false", readiness.productionReady === false && readiness.canClaimProduction === false, "production false");
}

if (exists("reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json")) {
  const repair = parseJson("reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json");
  check("batch-13-runtime-repair-applied", repair.status === "WEB_RUNTIME_REPAIR_APPLIED" && repair.passed === true, `status=${repair.status}; passed=${repair.passed}`);
  check("batch-13-keeps-production-false", repair.productionReady === false && repair.canClaimProduction === false, "production false");
}

if (exists("apps/web/package.json")) {
  const webPackage = parseJson("apps/web/package.json");
  check("web-dev-script-present", String(webPackage.scripts?.dev ?? "").includes("next dev"), String(webPackage.scripts?.dev ?? ""));
  check("web-build-script-present", String(webPackage.scripts?.build ?? "").includes("next build"), String(webPackage.scripts?.build ?? ""));
  check("web-next-dependency-present", Boolean(webPackage.dependencies?.next), webPackage.dependencies?.next ?? "missing");
  check("web-react-dependency-present", Boolean(webPackage.dependencies?.react), webPackage.dependencies?.react ?? "missing");
  check("web-react-dom-dependency-present", Boolean(webPackage.dependencies?.["react-dom"]), webPackage.dependencies?.["react-dom"] ?? "missing");
}

let child = null;
let serverStarted = false;
let serverStopped = false;
let webStatus = 0;
let webText = "";
let webUrl = "";
let port = 0;
let spawnError = null;

try {
  const preFailures = checks.filter((item) => item.passed !== true);
  if (preFailures.length > 0) {
    throw new Error("Pre-boot checks failed. Controlled boot not attempted.");
  }

  port = await getFreePort();
  webUrl = `http://127.0.0.1:${port}/free-destiny-map`;

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  child = spawn(npmCommand, ["run", "dev", "--", "--port", String(port)], {
    cwd: webDir,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      CI: "1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => stdoutLines.push(chunk.toString()));
  child.stderr.on("data", (chunk) => stderrLines.push(chunk.toString()));
  child.once("error", (error) => {
    spawnError = error;
  });

  const result = await waitForHttpOk(webUrl, timeoutMs);
  webStatus = result.status;
  webText = result.text;

  serverStarted = result.ok;

  check("controlled-next-server-started", serverStarted, serverStarted ? `url=${webUrl}` : `lastError=${result.lastError}`);
  check("controlled-next-route-status-200", webStatus === 200, `status=${webStatus}`);
  check("controlled-next-page-has-free-destiny-map", webText.includes("Free Destiny Map") || webText.includes("Start your Free Destiny Map"), "Free Destiny Map text");
  check("controlled-next-page-has-local-intake-copy", webText.includes("local intake") || webText.includes("local shell"), "local intake wording");
  check("controlled-next-page-no-production-true", !/productionReady\s*[:=]\s*true/i.test(webText), "productionReady true absent");
  check("controlled-next-page-no-official-submission-true", !/officialApplicationSubmitted\s*[:=]\s*true/i.test(webText), "officialApplicationSubmitted true absent");
  check("controlled-next-page-no-payment-true", !/paymentInstructionSent\s*[:=]\s*true/i.test(webText), "paymentInstructionSent true absent");
  check("controlled-next-page-no-email-true", !/emailSent\s*[:=]\s*true/i.test(webText), "emailSent true absent");
} catch (error) {
  check("controlled-next-boot-exception-absent", false, error instanceof Error ? error.message : String(error));
} finally {
  if (child) {
    serverStopped = await stopProcessTree(child);
  }
}

check("controlled-next-server-stopped", serverStopped, serverStopped ? "process tree stop attempted" : "server process was not started or could not be stopped");

if (spawnError) {
  check("controlled-next-spawn-error-absent", false, spawnError.message);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.controlled-next-boot-report.v1",
  module: "BATCH 14 - Controlled Local Next Web Boot Proof",
  status: passed ? "CONTROLLED_NEXT_BOOT_PROVEN" : "CONTROLLED_NEXT_BOOT_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  generated_at: new Date().toISOString(),
  serverStarted,
  serverStopped,
  webStatus,
  webRoute: "/free-destiny-map",
  webUrl,
  httpHost: "127.0.0.1",
  httpPort: port,
  checks,
  failed,
  stdout_tail: trimLog(stdoutLines),
  stderr_tail: trimLog(stderrLines),
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "controlled local Next dev boot proof only; no Oracle runtime; no production deployment",
  next_action: passed
    ? "Run validator and commit BATCH 14. Next batch may add controlled local API integration or production build proof."
    : "Repair controlled Next boot failures before moving forward."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
