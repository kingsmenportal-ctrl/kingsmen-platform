#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const composeFile = "docker/oracle-lite/docker-compose.local.yml";
const pagePath = "apps/web/src/app/free-destiny-map/page.tsx";
const batch33ProofPath = "reports/candidate/free-destiny-map-intake-capture-proof.json";
const batch33ValidationPath = "reports/validation/free-destiny-map-intake-capture-latest.json";
const proofPath = "reports/candidate/free-destiny-map-intake-runtime-reachability-proof.json";

const checks = [];
const commandLog = [];

let composeUpSucceeded = false;
let composeDownSucceeded = false;
let pageStatus = 0;
let pageHtml = "";

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function run(cmd, args, timeoutMs = 120000) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: timeoutMs,
    shell: false
  });

  const entry = {
    cmd,
    args,
    status: result.status,
    signal: result.signal,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    stdout_tail: String(result.stdout ?? "").slice(-2000),
    stderr_tail: String(result.stderr ?? "").slice(-2000),
    error: result.error ? String(result.error.message ?? result.error) : null
  };

  commandLog.push(entry);
  return entry;
}

async function fetchWithRetry(url, attempts = 24, delayMs = 2500) {
  let lastError = "";

  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { method: "GET" });
      const text = await response.text();
      return { ok: true, status: response.status, text };
    } catch (error) {
      lastError = String(error?.message ?? error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { ok: false, status: 0, text: "", error: lastError };
}

check(`required-file:${composeFile}`, exists(composeFile), composeFile);
check(`required-file:${pagePath}`, exists(pagePath), pagePath);
check(`required-file:${batch33ProofPath}`, exists(batch33ProofPath), batch33ProofPath);
check(`required-file:${batch33ValidationPath}`, exists(batch33ValidationPath), batch33ValidationPath);

const batch33Proof = exists(batch33ProofPath) ? readJson(batch33ProofPath) : null;
const batch33Validation = exists(batch33ValidationPath) ? readJson(batch33ValidationPath) : null;
const sourcePage = exists(pagePath) ? readText(pagePath) : "";

check(
  "batch33-proof-passed",
  batch33Proof?.status === "FREE_DESTINY_MAP_INTAKE_CAPTURE_PROVEN" && batch33Proof?.passed === true,
  batch33Proof?.status ?? "missing"
);

check(
  "batch33-validation-passed",
  batch33Validation?.status === "VALIDATED" && batch33Validation?.passed === true,
  batch33Validation?.status ?? "missing"
);

check("source-page-has-intake-marker", sourcePage.includes('data-kingsmen-free-destiny-map-intake="true"'), "source intake marker");
check("source-page-no-submit-handler", !sourcePage.includes("onSubmit") && !sourcePage.includes("fetch("), "no submit/fetch in source");

try {
  const downBefore = run("docker", ["compose", "-f", composeFile, "down", "--remove-orphans"], 120000);
  check("compose-down-before-exit-ok", downBefore.status === 0, `exit=${downBefore.status}; error=${downBefore.error ?? "none"}`);

  const up = run("docker", ["compose", "-f", composeFile, "up", "-d", "--no-build"], 180000);
  composeUpSucceeded = up.status === 0;
  check("compose-up-no-build", composeUpSucceeded, `exit=${up.status}; error=${up.error ?? "none"}`);

  if (composeUpSucceeded) {
    const page = await fetchWithRetry("http://127.0.0.1:3000/free-destiny-map/");
    pageStatus = page.status;
    pageHtml = page.text ?? "";

    check("runtime-page-status-200", page.status === 200, `status=${page.status}; error=${page.error ?? "none"}`);
    check("runtime-page-identifies-free-destiny-map", pageHtml.includes("Free Destiny Map"), "Free Destiny Map text");
    check("runtime-page-has-intake-form-marker", pageHtml.includes('data-kingsmen-free-destiny-map-intake="true"'), "rendered intake marker");
    check("runtime-page-has-current-stage-field", pageHtml.includes('data-kingsmen-intake-field="current-stage"'), "current-stage marker");
    check("runtime-page-has-province-field", pageHtml.includes('data-kingsmen-intake-field="province"'), "province marker");
    check("runtime-page-has-route-interest-field", pageHtml.includes('data-kingsmen-intake-field="route-interest"'), "route-interest marker");
    check("runtime-page-has-biggest-blocker-field", pageHtml.includes('data-kingsmen-intake-field="biggest-blocker"'), "biggest-blocker marker");
    check("runtime-page-has-readiness-goal-field", pageHtml.includes('data-kingsmen-intake-field="readiness-goal"'), "readiness-goal marker");
    check("runtime-page-has-boundary-confirmation", pageHtml.includes('data-kingsmen-intake-field="boundary-confirmation"'), "boundary marker");
    check("runtime-page-has-preview-button", pageHtml.includes('data-kingsmen-intake-button="preview-path"'), "preview button");
    check("runtime-page-does-not-submit", !pageHtml.includes('type="submit"') && !pageHtml.includes("onSubmit"), "no submit");
    check("runtime-page-no-production-claim", !pageHtml.includes("productionReady: true") && !pageHtml.toLowerCase().includes("production ready"), "no production claim");
    check("runtime-page-no-oracle-deployed-claim", !pageHtml.includes("deployedToOracle: true") && !pageHtml.includes("Oracle deployed"), "no Oracle deployment claim");
  }
} finally {
  const downAfter = run("docker", ["compose", "-f", composeFile, "down", "--remove-orphans"], 120000);
  composeDownSucceeded = downAfter.status === 0;
  check("compose-down-after-exit-ok", composeDownSucceeded, `exit=${downAfter.status}; error=${downAfter.error ?? "none"}`);
}

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh",
  "SUPABASE_SERVICE_ROLE",
  "PAYFAST_MERCHANT_KEY"
];

for (const pattern of forbiddenPatterns) {
  check(`runtime-html-no-forbidden:${pattern}`, !pageHtml.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.free-destiny-map-intake-runtime-reachability-proof.v1",
  module: "BATCH 34 - Free Destiny Map Intake Local Runtime Reachability Proof",
  status: passed
    ? "FREE_DESTINY_MAP_INTAKE_RUNTIME_REACHABLE_LOCAL"
    : "FREE_DESTINY_MAP_INTAKE_RUNTIME_REACHABILITY_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: true,
  touchesSecrets: false,
  touchesCandidateData: false,
  storesCandidateData: false,
  sendsCandidateData: false,
  touchesContactData: false,
  touchesPayments: false,
  touchesMessaging: false,
  generated_at: new Date().toISOString(),
  composeFile,
  composeUpSucceeded,
  composeDownSucceeded,
  pageStatus,
  sourceRoute: "/free-destiny-map/",
  sourcePage: pagePath,
  checks,
  failed,
  commandLog,
  next_action: passed
    ? "Run validator and commit BATCH 34."
    : "Repair Free Destiny Map runtime reachability before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
