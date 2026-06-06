#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

const root = process.cwd();
const composeFile = "docker/oracle-lite/docker-compose.local.yml";
const reportPath = path.join(root, "reports/runtime/docker-oracle-lite-runtime-health-hardening-proof.json");

const timeoutArg = process.argv.find((x) => x.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 420;
const timeoutMs = Number.isFinite(timeoutSeconds) ? timeoutSeconds * 1000 : 420000;

const checks = [];
const cycles = [];
const stdoutLines = [];
const stderrLines = [];

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
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
    const res = await fetch(url, { signal: controller.signal });
    return { status: res.status, text: await res.text(), error: null };
  } catch (error) {
    return { status: 0, text: "", error: error?.message || String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function waitFor(url, expected, maxMs) {
  const end = Date.now() + maxMs;
  let last = { status: 0, text: "", error: "not attempted" };

  while (Date.now() < end) {
    last = await fetchText(url);
    if (last.status === expected) return last;
    await new Promise((r) => setTimeout(r, 3000));
  }

  return last;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

try {
  const required = [
    "reports/runtime/docker-oracle-lite-controlled-runtime-proof.json",
    "reports/validation/docker-oracle-lite-controlled-runtime-latest.json",
    composeFile,
    "docs/runtime/docker-oracle-lite-runtime-health-hardening.md",
    "manifests/runtime/docker-oracle-lite-runtime-health-hardening.json",
    "packages/contracts/src/docker-oracle-lite-runtime-health.ts",
    "scripts/runtime/Invoke-DockerOracleLiteRuntimeHealthHardening.ps1",
    "scripts/proof/prove-docker-oracle-lite-runtime-health-hardening.mjs",
    "scripts/validators/validate-docker-oracle-lite-runtime-health-hardening.mjs"
  ];

  for (const file of required) check(`required-file:${file}`, exists(file), file);

  const batch21 = exists("reports/runtime/docker-oracle-lite-controlled-runtime-proof.json")
    ? readJson("reports/runtime/docker-oracle-lite-controlled-runtime-proof.json")
    : null;

  check("batch21-proven", batch21?.passed === true && batch21?.status === "DOCKER_LOCAL_RUNTIME_PROVEN", batch21?.status ?? "missing");
  check("batch21-not-production", batch21?.productionReady === false && batch21?.canClaimProduction === false && batch21?.deployedToOracle === false, "BATCH 21 boundary");

  const info = await docker(["info"], 30000);
  check("docker-info", info.code === 0, info.error || info.stderr.slice(-500));

  const services = await compose(["-f", composeFile, "config", "--services"], 30000);
  check("compose-services-command", services.code === 0, services.error || services.stderr.slice(-500));
  check("compose-has-kingsmen-api", services.stdout.includes("kingsmen-api"), services.stdout.trim());
  check("compose-has-kingsmen-web", services.stdout.includes("kingsmen-web"), services.stdout.trim());

  const down0 = await compose(["-f", composeFile, "down", "--remove-orphans"], 120000);
  check("clean-down-before", down0.code === 0, `exit=${down0.code}; ${down0.error ?? ""}`);

  check("port-3000-free-before", !(await canConnect(3000)), "3000 free before up");
  check("port-3001-free-before", !(await canConnect(3001)), "3001 free before up");

  for (let i = 1; i <= 2; i++) {
    const cycle = {
      cycle: i,
      composeUpSucceeded: false,
      composeDownSucceeded: false,
      apiHealthStatus: 0,
      webStatus: 0,
      apiProductionReady: null,
      apiCanClaimProduction: null,
      apiDeployedToOracle: null,
      apiLogCaptured: false,
      webLogCaptured: false,
      portsReleasedAfterDown: false
    };

    const up = await compose(["-f", composeFile, "up", "-d", "--no-build"], timeoutMs);
    cycle.composeUpSucceeded = up.code === 0;
    check(`cycle-${i}-up`, cycle.composeUpSucceeded, `exit=${up.code}; ${up.error ?? ""}`);

    const ps = await compose(["-f", composeFile, "ps"], 30000);
    check(`cycle-${i}-ps`, ps.code === 0 && ps.stdout.includes("kingsmen-api") && ps.stdout.includes("kingsmen-web"), ps.stdout);

    const api = await waitFor("http://127.0.0.1:3001/health", 200, Math.min(timeoutMs, 180000));
    cycle.apiHealthStatus = api.status;
    const apiJson = safeJson(api.text);
    cycle.apiProductionReady = apiJson?.productionReady ?? null;
    cycle.apiCanClaimProduction = apiJson?.canClaimProduction ?? null;
    cycle.apiDeployedToOracle = apiJson?.deployedToOracle ?? null;

    check(`cycle-${i}-api-200`, api.status === 200, api.error || `status=${api.status}`);
    check(`cycle-${i}-api-not-production`, apiJson?.productionReady === false && apiJson?.canClaimProduction === false, api.text.slice(0, 300));
    check(`cycle-${i}-api-not-oracle`, apiJson?.deployedToOracle === false, api.text.slice(0, 300));

    const web = await waitFor("http://127.0.0.1:3000/free-destiny-map", 200, Math.min(timeoutMs, 180000));
    cycle.webStatus = web.status;

    check(`cycle-${i}-web-200`, web.status === 200, web.error || `status=${web.status}`);
    check(`cycle-${i}-web-free-destiny-map`, /Free Destiny Map|Start your Free Destiny Map/i.test(web.text), "Free Destiny Map text");

    const apiLogs = await compose(["-f", composeFile, "logs", "--tail=80", "kingsmen-api"], 30000);
    const webLogs = await compose(["-f", composeFile, "logs", "--tail=80", "kingsmen-web"], 30000);

    cycle.apiLogCaptured = apiLogs.code === 0 && `${apiLogs.stdout}${apiLogs.stderr}`.trim().length > 0;
    cycle.webLogCaptured = webLogs.code === 0 && `${webLogs.stdout}${webLogs.stderr}`.trim().length > 0;

    check(`cycle-${i}-api-log`, cycle.apiLogCaptured, `exit=${apiLogs.code}`);
    check(`cycle-${i}-web-log`, cycle.webLogCaptured, `exit=${webLogs.code}`);

    const down = await compose(["-f", composeFile, "down", "--remove-orphans"], 120000);
    cycle.composeDownSucceeded = down.code === 0;
    check(`cycle-${i}-down`, cycle.composeDownSucceeded, `exit=${down.code}; ${down.error ?? ""}`);

    const port3000Closed = !(await canConnect(3000));
    const port3001Closed = !(await canConnect(3001));
    cycle.portsReleasedAfterDown = port3000Closed && port3001Closed;

    check(`cycle-${i}-ports-released`, cycle.portsReleasedAfterDown, `3000=${port3000Closed};3001=${port3001Closed}`);
    cycles.push(cycle);
  }

  const finalPs = await compose(["-f", composeFile, "ps", "-q"], 30000);
  check("no-compose-containers-after", finalPs.code === 0 && finalPs.stdout.trim() === "", finalPs.stdout);
} catch (error) {
  check("exception-absent", false, error?.message || String(error));
} finally {
  const finalDown = await compose(["-f", composeFile, "down", "--remove-orphans"], 120000);
  check("final-clean-down", finalDown.code === 0, `exit=${finalDown.code}; ${finalDown.error ?? ""}`);
}

check("no-production-claim", cycles.every((c) => c.apiProductionReady === false && c.apiCanClaimProduction === false), "production false every cycle");
check("no-oracle-claim", cycles.every((c) => c.apiDeployedToOracle === false), "oracle false every cycle");

const failed = checks.filter((c) => c.passed !== true);
const passed = cycles.length === 2 && failed.length === 0;

const report = {
  schema: "kingsmen.docker-oracle-lite-runtime-health-hardening-report.v1",
  module: "BATCH 22 - Docker Oracle Lite Runtime Health Hardening",
  status: passed ? "DOCKER_RUNTIME_HEALTH_HARDENED_LOCAL" : "DOCKER_RUNTIME_HEALTH_HARDENING_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  runtimeScope: "controlled_local_docker_runtime_health_only",
  composeCyclesExpected: 2,
  composeCyclesCompleted: cycles.length,
  cycles,
  checks,
  failed,
  stdout_tail: tail(stdoutLines),
  stderr_tail: tail(stderrLines),
  next_action: passed
    ? "Run validator and commit BATCH 22."
    : "Repair failed runtime health checks before moving forward."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
