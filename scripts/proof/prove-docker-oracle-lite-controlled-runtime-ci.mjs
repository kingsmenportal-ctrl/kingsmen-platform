#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const composeFile = path.join(root, "docker/oracle-lite/docker-compose.local.yml");
const reportPath = path.join(root, "reports/runtime/batch21c-docker-runtime-proof.json");
const projectName = "kingsmen-batch21c-ci";

const apiHealthUrl = "http://127.0.0.1:3001/health";
const webUrl = "http://127.0.0.1:3000/free-destiny-map";
const bridgeUrl = "http://127.0.0.1:3000/api/public/free-destiny-map/intake/local";

const stdoutLines = [];
const stderrLines = [];

function tail(text, max = 5000) {
  const value = String(text ?? "");
  return value.length > max ? value.slice(value.length - max) : value;
}

function run(command, args, options = {}) {
  const timeoutMs = options.timeoutMs ?? 600000;

  return new Promise((resolve) => {
    const out = [];
    const err = [];
    let timedOut = false;

    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, CI: process.env.CI ?? "true" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGTERM");
      } catch {}
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      out.push(text);
      stdoutLines.push(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      err.push(text);
      stderrLines.push(text);
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

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.headers ?? {},
      body: options.body,
      signal: controller.signal
    });

    const text = await response.text();
    let json = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    return {
      ok: response.ok,
      status: response.status,
      text,
      json,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      json: null,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitFor(url, expectedStatuses, timeoutMs = 180000) {
  const started = Date.now();
  let last = null;

  while (Date.now() - started < timeoutMs) {
    last = await requestJson(url, { timeoutMs: 10000 });
    if (expectedStatuses.includes(last.status)) return last;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return last ?? { ok: false, status: 0, text: "", json: null, error: "timeout_waiting_for_endpoint" };
}

function buildPayload() {
  return {
    fullName: "Kingsmen GitHub Actions Runtime Demo Candidate",
    province: "KwaZulu-Natal",
    currentSituation: "GitHub Actions Docker runtime proof user wants study, funding, accommodation and CV route guidance.",
    knownRoute: "BATCH 21C GitHub Actions Docker runtime proof",
    routeInterests: ["higher_education", "tvet", "nsfas_bursary", "accommodation", "cv_revamp", "source_check"],
    needsAccommodation: true,
    accommodationArea: "Durban / campus or training area",
    needsFundingHelp: true,
    needsCvHelp: true,
    hasDocumentsReady: false,
    randomSourceName: "GitHub Actions runtime demo bursary or learnership source to check later",
    consentToBeContacted: true,
    consentToProcessBasicInfo: true
  };
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const checks = [];
  const failures = [];

  const proofEnvironment = process.env.GITHUB_ACTIONS === "true" ? "github_actions" : "local_ci_script";

  let composeDownBefore = { code: null };
  let composeUp = { code: null };
  let composePs = { code: null };
  let composeLogs = { code: null, stdout: "", stderr: "" };
  let composeDownAfter = { code: null };

  let apiHealth = { status: 0, json: null, text: "", error: "not_run" };
  let webPage = { status: 0, json: null, text: "", error: "not_run" };
  let bridgePost = { status: 0, json: null, text: "", error: "not_run" };

  try {
    if (!fs.existsSync(composeFile)) {
      failures.push({ name: "compose_file_missing", detail: composeFile });
      throw new Error("Missing docker/oracle-lite/docker-compose.local.yml");
    }

    composeDownBefore = await run("docker", ["compose", "-p", projectName, "-f", composeFile, "down", "--remove-orphans"], { timeoutMs: 180000 });

    composeUp = await run("docker", ["compose", "-p", projectName, "-f", composeFile, "up", "-d", "--build", "--remove-orphans"], { timeoutMs: 900000 });

    checks.push({
      name: "compose_up_succeeded",
      passed: composeUp.code === 0,
      code: composeUp.code,
      timedOut: composeUp.timedOut,
      stderr_tail: tail(composeUp.stderr)
    });

    if (composeUp.code !== 0) {
      failures.push({ name: "compose_up_failed", detail: tail(composeUp.stderr || composeUp.stdout) });
      throw new Error("docker compose up failed");
    }

    composePs = await run("docker", ["compose", "-p", projectName, "-f", composeFile, "ps"], { timeoutMs: 60000 });

    apiHealth = await waitFor(apiHealthUrl, [200], 180000);
    webPage = await waitFor(webUrl, [200], 180000);

    const payload = JSON.stringify(buildPayload());

    bridgePost = await requestJson(bridgeUrl, {
      method: "POST",
      timeoutMs: 30000,
      headers: { "content-type": "application/json" },
      body: payload
    });

    const bridgeJson = bridgePost.json ?? {};

    checks.push({ name: "api_health_200", passed: apiHealth.status === 200, status: apiHealth.status, error: apiHealth.error });
    checks.push({ name: "web_page_200", passed: webPage.status === 200, status: webPage.status, error: webPage.error });
    checks.push({ name: "bridge_post_202", passed: bridgePost.status === 202, status: bridgePost.status, error: bridgePost.error });
    checks.push({ name: "backend_bridge_succeeded", passed: bridgeJson.backendBridgeSucceeded === true });
    checks.push({ name: "backend_boundary_reached", passed: bridgeJson.backendBoundaryReached === true });
    checks.push({ name: "backend_local_write_succeeded", passed: bridgeJson.backendLocalWriteSucceeded === true });
  } catch (error) {
    failures.push({
      name: "batch21c_runtime_exception",
      detail: error instanceof Error ? error.message : String(error)
    });
  } finally {
    composeLogs = await run("docker", ["compose", "-p", projectName, "-f", composeFile, "logs", "--tail=200"], { timeoutMs: 120000 });
    composeDownAfter = await run("docker", ["compose", "-p", projectName, "-f", composeFile, "down", "--remove-orphans"], { timeoutMs: 180000 });

    checks.push({
      name: "compose_down_succeeded",
      passed: composeDownAfter.code === 0,
      code: composeDownAfter.code,
      timedOut: composeDownAfter.timedOut,
      stderr_tail: tail(composeDownAfter.stderr)
    });
  }

  const bridgeJson = bridgePost.json ?? {};

  const passed =
    composeUp.code === 0 &&
    composeDownAfter.code === 0 &&
    apiHealth.status === 200 &&
    webPage.status === 200 &&
    bridgePost.status === 202 &&
    bridgeJson.backendBridgeSucceeded === true &&
    bridgeJson.backendBoundaryReached === true &&
    bridgeJson.backendLocalWriteSucceeded === true;

  const report = {
    schema: "kingsmen.batch21c-docker-runtime-proof.v1",
    module: "BATCH 21C - GitHub Actions Docker Runtime Proof",
    status: passed ? "BATCH21C_DOCKER_RUNTIME_PROVEN" : "BATCH21C_DOCKER_RUNTIME_FAILED",
    passed,
    productionReady: false,
    proofEnvironment,
    deployedToOracle: false,
    publicHttpsReady: false,
    paymentsLive: false,
    emailRuntimeLive: false,
    officialSubmissionsLive: false,
    composeUpSucceeded: composeUp.code === 0,
    composeDownSucceeded: composeDownAfter.code === 0,
    apiHealthStatus: apiHealth.status,
    webStatus: webPage.status,
    bridgeApiStatus: bridgePost.status,
    backend_bridge_succeeded: bridgeJson.backendBridgeSucceeded === true,
    backend_boundary_reached: bridgeJson.backendBoundaryReached === true,
    backend_local_write_succeeded: bridgeJson.backendLocalWriteSucceeded === true,
    checks,
    failed_checks: checks.filter((check) => !check.passed),
    failures,
    compose_ps_tail: tail(composePs.stdout),
    compose_logs_tail: tail(composeLogs.stdout || composeLogs.stderr),
    stdout_tail: tail(stdoutLines.join("")),
    stderr_tail: tail(stderrLines.join("")),
    generated_at: new Date().toISOString(),
    next_action: passed
      ? "Proceed to BATCH 22 - Docker Runtime Health Hardening / Oracle Lite VM Handoff Preparation."
      : "Repair Docker runtime or compose proof path before BATCH 22."
  };

  writeReport(report);
  console.log(JSON.stringify(report, null, 2));

  if (!passed) process.exit(1);
}

await main();
