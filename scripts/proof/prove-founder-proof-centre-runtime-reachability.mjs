#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

const root = process.cwd();
const composeFile = "docker/oracle-lite/docker-compose.local.yml";

const urls = {
  apiHealth: "http://127.0.0.1:3001/health",
  page: "http://127.0.0.1:3000/founder/proof-centre/",
  adapter: "http://127.0.0.1:3000/founder/proof-centre/adapter.json"
};

const output = {
  proof: "reports/control-plane/founder-proof-centre-runtime-reachability-proof.json",
  pageCapture: "reports/control-plane/founder-proof-centre-runtime-page-capture.html",
  adapterCapture: "reports/control-plane/founder-proof-centre-runtime-adapter-capture.json"
};

const timeoutArg = process.argv.find((x) => x.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 420;
const timeoutMs = Number.isFinite(timeoutSeconds) ? timeoutSeconds * 1000 : 420000;

const checks = [];
const stdoutLines = [];
const stderrLines = [];

let composeUpSucceeded = false;
let composeDownSucceeded = false;
let portsReleasedAfterDown = false;
let apiHealthStatus = 0;
let pageStatus = 0;
let adapterStatus = 0;
let webBuildSucceeded = false;

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function tail(lines, limit = 120) {
  return lines.join("").split(/\r?\n/).filter(Boolean).slice(-limit);
}

function run(cmd, args, timeout = 120000) {
  return new Promise((resolve) => {
    const out = [];
    const err = [];
    let timedOut = false;

    const child = spawn(cmd, args, {
      cwd: root,
      env: {
        ...process.env,
        COMPOSE_PROJECT_NAME: process.env.COMPOSE_PROJECT_NAME || "kingsmen-oracle-lite-local"
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: process.platform === "win32"
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill("SIGTERM"); } catch {}
      if (process.platform === "win32" && child.pid) {
        spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      }
    }, timeout);

    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      out.push(text);
      stdoutLines.push(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      err.push(text);
      stderrLines.push(text);
    });

    child.once("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        timedOut,
        stdout: out.join(""),
        stderr: err.join(""),
        error: err.join("").trim() || null,
        command: [cmd, ...args].join(" ")
      });
    });

    child.once("error", (error) => {
      clearTimeout(timer);
      const message = error?.message || String(error);
      stderrLines.push(message);
      resolve({
        code: 127,
        timedOut,
        stdout: out.join(""),
        stderr: err.join(""),
        error: message,
        command: [cmd, ...args].join(" ")
      });
    });
  });
}

function docker(args, timeout) {
  return run("docker", args, timeout);
}

function compose(args, timeout) {
  return docker(["compose", ...args], timeout);
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });

    const done = (value) => {
      try { socket.destroy(); } catch {}
      resolve(value);
    };

    socket.setTimeout(1500);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function fetchText(url, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "cache-control": "no-store"
      }
    });

    return {
      status: response.status,
      ok: response.ok,
      text: await response.text(),
      error: null
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      text: "",
      error: error?.message || String(error)
    };
  } finally {
    clearTimeout(timer);
  }
}

async function waitFor(url, expectedStatus, maxMs) {
  const deadline = Date.now() + maxMs;
  let last = { status: 0, ok: false, text: "", error: "not attempted" };

  while (Date.now() < deadline) {
    last = await fetchText(url);
    if (last.status === expectedStatus) return last;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return last;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

try {
  const required = [
    "apps/web/public/founder/proof-centre/index.html",
    "apps/web/src/app/founder/proof-centre/page.tsx",
    "apps/web/public/founder/proof-centre/adapter.json",
    "reports/control-plane/founder-proof-centre-page-wiring-proof.json",
    "reports/validation/founder-proof-centre-page-wiring-latest.json",
    composeFile
  ];

  for (const file of required) {
    check(`required-file:${file}`, exists(file), file);
  }

  const batch25Proof = exists("reports/control-plane/founder-proof-centre-page-wiring-proof.json")
    ? readJson("reports/control-plane/founder-proof-centre-page-wiring-proof.json")
    : null;

  const batch25Validation = exists("reports/validation/founder-proof-centre-page-wiring-latest.json")
    ? readJson("reports/validation/founder-proof-centre-page-wiring-latest.json")
    : null;

  check(
    "batch25-proof-proven",
    batch25Proof?.status === "FOUNDER_PROOF_CENTRE_PAGE_WIRING_PROVEN" && batch25Proof?.passed === true,
    batch25Proof?.status ?? "missing"
  );

  check(
    "batch25-validation-passed",
    batch25Validation?.status === "VALIDATED" && batch25Validation?.passed === true,
    batch25Validation?.status ?? "missing"
  );

  check(
    "batch25-no-production-claim",
    batch25Proof?.productionReady === false && batch25Proof?.canClaimProduction === false,
    "BATCH 25 production false"
  );

  check(
    "batch25-no-oracle-claim",
    batch25Proof?.deployedToOracle === false,
    "BATCH 25 oracle false"
  );

  const dockerInfo = await docker(["info"], 30000);
  check("docker-info", dockerInfo.code === 0, dockerInfo.error || dockerInfo.stderr.slice(-500));

  const cleanDown = await compose(["-f", composeFile, "down", "--remove-orphans"], 120000);
  check("clean-down-before", cleanDown.code === 0, `exit=${cleanDown.code}; ${cleanDown.error ?? ""}`);

  const port3000FreeBefore = !(await canConnect(3000));
  const port3001FreeBefore = !(await canConnect(3001));
  check("port-3000-free-before", port3000FreeBefore, "3000 free before up");
  check("port-3001-free-before", port3001FreeBefore, "3001 free before up");

  const webBuild = await compose(["-f", composeFile, "build", "kingsmen-web"], timeoutMs);
  webBuildSucceeded = webBuild.code === 0;
  check("web-image-build", webBuildSucceeded, `exit=${webBuild.code}; ${webBuild.error ?? ""}`);

  const up = await compose(["-f", composeFile, "up", "-d", "--no-build"], timeoutMs);
  composeUpSucceeded = up.code === 0;
  check("compose-up", composeUpSucceeded, `exit=${up.code}; ${up.error ?? ""}`);

  const ps = await compose(["-f", composeFile, "ps"], 30000);
  check("compose-ps-services", ps.code === 0 && ps.stdout.includes("kingsmen-api") && ps.stdout.includes("kingsmen-web"), ps.stdout);

  const api = await waitFor(urls.apiHealth, 200, Math.min(timeoutMs, 180000));
  apiHealthStatus = api.status;
  const apiJson = safeJson(api.text);

  check("api-health-200", api.status === 200, api.error || `status=${api.status}`);
  check("api-health-not-production", apiJson?.productionReady === false && apiJson?.canClaimProduction === false, api.text.slice(0, 300));
  check("api-health-not-oracle", apiJson?.deployedToOracle === false, api.text.slice(0, 300));

  const page = await waitFor(urls.page, 200, Math.min(timeoutMs, 180000));
  pageStatus = page.status;
  writeText(output.pageCapture, page.text);

  check("founder-page-http-200", page.status === 200, page.error || `status=${page.status}`);
  check("founder-page-has-founder-title", page.text.includes("Kingsmen Founder Control Plane"), "founder title");
  check("founder-page-has-build-proof-centre", page.text.includes("Build Proof Centre"), "Build Proof Centre text");
  check("founder-page-has-local-warning", page.text.includes("Local founder proof page only"), "local warning");
  check("founder-page-has-proven-badge", page.text.includes("PROVEN"), "PROVEN badge");
  check("founder-page-has-no-production-language", page.text.includes("does not claim production readiness"), "no production claim language");

  const adapter = await waitFor(urls.adapter, 200, Math.min(timeoutMs, 180000));
  adapterStatus = adapter.status;
  const adapterJson = safeJson(adapter.text);

  writeJson(output.adapterCapture, adapterJson ?? {
    parseError: true,
    status: adapter.status,
    textStart: adapter.text.slice(0, 500)
  });

  check("public-adapter-http-200", adapter.status === 200, adapter.error || `status=${adapter.status}`);
  check("public-adapter-schema", adapterJson?.schema === "kingsmen.founder-proof-centre-page.v1", adapterJson?.schema ?? "missing");
  check("public-adapter-route-hint", adapterJson?.routeHint === "/founder/proof-centre/", adapterJson?.routeHint ?? "missing");
  check("public-adapter-all-cards-passed", adapterJson?.allCardsPassed === true, String(adapterJson?.allCardsPassed));
  check("public-adapter-no-production", adapterJson?.productionReady === false && adapterJson?.canClaimProduction === false && adapterJson?.noProductionClaim === true, "production false");
  check("public-adapter-no-oracle", adapterJson?.deployedToOracle === false && adapterJson?.noOracleClaim === true, "oracle false");
} catch (error) {
  check("exception-absent", false, error?.message || String(error));
} finally {
  const down = await compose(["-f", composeFile, "down", "--remove-orphans"], 120000);
  composeDownSucceeded = down.code === 0;
  check("compose-down-after", composeDownSucceeded, `exit=${down.code}; ${down.error ?? ""}`);

  const port3000Closed = !(await canConnect(3000));
  const port3001Closed = !(await canConnect(3001));
  portsReleasedAfterDown = port3000Closed && port3001Closed;
  check("ports-released-after-down", portsReleasedAfterDown, `3000=${port3000Closed}; 3001=${port3001Closed}`);
}

check("no-production-claim", true, "Report hard-codes productionReady=false and canClaimProduction=false.");
check("no-oracle-claim", true, "Report hard-codes deployedToOracle=false.");

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.founder-proof-centre-runtime-reachability-proof.v1",
  module: "BATCH 26 - Founder Proof Centre Local Web Runtime Reachability Proof",
  status: passed
    ? "FOUNDER_PROOF_CENTRE_RUNTIME_REACHABLE_LOCAL"
    : "FOUNDER_PROOF_CENTRE_RUNTIME_REACHABILITY_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  runtimeScope: "local_web_runtime_reachability_only",
  composeFile,
  webBuildSucceeded,
  apiHealthUrl: urls.apiHealth,
  pageUrl: urls.page,
  adapterUrl: urls.adapter,
  apiHealthStatus,
  pageStatus,
  adapterStatus,
  composeUpSucceeded,
  composeDownSucceeded,
  portsReleasedAfterDown,
  pageCapture: output.pageCapture,
  adapterCapture: output.adapterCapture,
  checks,
  failed,
  stdout_tail: tail(stdoutLines),
  stderr_tail: tail(stderrLines),
  next_action: passed
    ? "Run validator and commit BATCH 26."
    : "Repair BATCH 26 reachability proof before moving forward."
};

writeJson(output.proof, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
