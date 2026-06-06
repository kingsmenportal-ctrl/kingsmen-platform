#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const timeoutArg = process.argv.find((arg) => arg.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 720;

const composeFile = "docker/oracle-lite/docker-compose.local.yml";
const proofPath = "reports/control-plane/proof-centre-registry-runtime-refresh-proof.json";
const pageCapturePath = "reports/control-plane/proof-centre-registry-runtime-page-capture.html";

const targetUrl = "http://127.0.0.1:3000/founder/proof-centre";
const apiHealthUrl = "http://127.0.0.1:3001/health";

const requiredBatches = [
  "BATCH 21",
  "BATCH 22",
  "BATCH 23",
  "BATCH 24",
  "BATCH 25",
  "BATCH 26B",
  "BATCH 27",
  "BATCH 28"
];

const requiredLabels = [
  "Controlled Docker Oracle Lite Runtime",
  "Runtime Health Hardening",
  "Build Proof Centre Read Model",
  "Control Plane Proof Display Adapter",
  "Founder Proof Centre Page Wiring",
  "Founder Proof Centre Runtime Reachability",
  "Founder Control Plane Proof Centre Entry Link",
  "Founder Control Plane Entry Link Runtime Proof"
];

const checks = [];

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

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function writeJson(rel, value) {
  writeText(rel, `${JSON.stringify(value, null, 2)}\n`);
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function tail(value, max = 5000) {
  const text = String(value ?? "");
  return text.length > max ? text.slice(text.length - max) : text;
}

function runCommand(name, command, args, seconds) {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(command, args, {
      cwd: root,
      shell: false,
      env: {
        ...process.env,
        COMPOSE_PROJECT_NAME: "kingsmen-oracle-lite-local"
      }
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill("SIGKILL"); } catch {}
    }, seconds * 1000);

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        name,
        exitCode: -1,
        timedOut,
        seconds: Math.round((Date.now() - started) / 10) / 100,
        stdout: tail(stdout),
        stderr: tail(stderr),
        error: error.message
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        name,
        exitCode: typeof code === "number" ? code : -1,
        timedOut,
        seconds: Math.round((Date.now() - started) / 10) / 100,
        stdout: tail(stdout),
        stderr: tail(stderr),
        error: ""
      });
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, seconds = 20) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), seconds * 1000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    clearTimeout(timer);
    return { status: response.status, text, error: "" };
  } catch (error) {
    clearTimeout(timer);
    return { status: 0, text: "", error: error.message };
  }
}

async function pollUrl(name, url, seconds, predicate) {
  const deadline = Date.now() + seconds * 1000;
  let last = { status: 0, text: "", error: "not attempted" };

  while (Date.now() < deadline) {
    last = await fetchText(url, 15);
    if (predicate(last)) return { ...last, name, timeout: false };
    await sleep(3000);
  }

  return { ...last, name, timeout: true };
}

const requiredFiles = [
  composeFile,
  "apps/web/src/app/founder/proof-centre/page.tsx",
  "reports/control-plane/proof-centre-registry.json",
  "reports/control-plane/proof-centre-registry-refresh-proof.json",
  "reports/validation/proof-centre-registry-refresh-latest.json"
];

for (const file of requiredFiles) {
  check(`required-file:${file}`, exists(file), file);
}

const batch29Proof = exists("reports/control-plane/proof-centre-registry-refresh-proof.json")
  ? readJson("reports/control-plane/proof-centre-registry-refresh-proof.json")
  : null;

const batch29Validation = exists("reports/validation/proof-centre-registry-refresh-latest.json")
  ? readJson("reports/validation/proof-centre-registry-refresh-latest.json")
  : null;

const registry = exists("reports/control-plane/proof-centre-registry.json")
  ? readJson("reports/control-plane/proof-centre-registry.json")
  : null;

check(
  "batch29-proof-proven",
  batch29Proof?.status === "PROOF_CENTRE_REGISTRY_REFRESH_PROVEN" && batch29Proof?.passed === true,
  batch29Proof?.status ?? "missing"
);

check(
  "batch29-validation-passed",
  batch29Validation?.status === "VALIDATED" && batch29Validation?.passed === true,
  batch29Validation?.status ?? "missing"
);

check("batch29-entry-count-eight", batch29Proof?.entryCount === 8, String(batch29Proof?.entryCount));
check("batch29-all-entries-proven", batch29Proof?.allEntriesProven === true, String(batch29Proof?.allEntriesProven));
check("batch29-no-production", batch29Proof?.productionReady === false && batch29Proof?.canClaimProduction === false, "production false");
check("batch29-no-oracle", batch29Proof?.deployedToOracle === false, "oracle false");

check("registry-eight-entries", registry?.entryCount === 8 && Array.isArray(registry?.entries) && registry.entries.length === 8, `entries=${registry?.entries?.length ?? 0}`);
check("registry-all-proven", registry?.allEntriesProven === true, String(registry?.allEntriesProven));

let composeDownBefore = null;
let webBuild = null;
let composeUp = null;
let apiHealth = { status: 0, text: "", error: "not run" };
let proofCentre = { status: 0, text: "", error: "not run" };
let composeDownAfter = null;
let dockerPsAfter = null;

try {
  composeDownBefore = await runCommand(
    "compose-down-before",
    "docker",
    ["compose", "-f", composeFile, "down", "--remove-orphans"],
    180
  );
  check("compose-down-before", composeDownBefore.exitCode === 0, `exit=${composeDownBefore.exitCode}; timedOut=${composeDownBefore.timedOut}`);

  webBuild = await runCommand(
    "compose-build-web",
    "docker",
    ["compose", "-f", composeFile, "build", "kingsmen-web"],
    timeoutSeconds
  );
  check("web-build-succeeded", webBuild.exitCode === 0, `exit=${webBuild.exitCode}; timedOut=${webBuild.timedOut}`);

  composeUp = await runCommand(
    "compose-up",
    "docker",
    ["compose", "-f", composeFile, "up", "-d", "--no-build", "kingsmen-api", "kingsmen-web"],
    240
  );
  check("compose-up-succeeded", composeUp.exitCode === 0, `exit=${composeUp.exitCode}; timedOut=${composeUp.timedOut}`);

  if (composeUp.exitCode === 0) {
    apiHealth = await pollUrl(
      "api-health",
      apiHealthUrl,
      90,
      (result) => result.status === 200
    );

    proofCentre = await pollUrl(
      "proof-centre",
      targetUrl,
      150,
      (result) =>
        result.status === 200 &&
        requiredBatches.every((batch) => result.text.includes(batch))
    );
  }

  writeText(pageCapturePath, proofCentre.text ?? "");
} finally {
  composeDownAfter = await runCommand(
    "compose-down-after",
    "docker",
    ["compose", "-f", composeFile, "down", "--remove-orphans"],
    180
  );

  dockerPsAfter = await runCommand(
    "docker-ps-after",
    "docker",
    ["ps", "--filter", "name=kingsmen-", "--format", "{{.Names}}"],
    60
  );
}

const pageText = proofCentre.text ?? "";
const renderedBatches = requiredBatches.filter((batch) => pageText.includes(batch));
const renderedLabels = requiredLabels.filter((label) => pageText.includes(label));

check("api-health-200", apiHealth.status === 200, `status=${apiHealth.status}; error=${apiHealth.error ?? ""}`);
check("proof-centre-page-200", proofCentre.status === 200, `status=${proofCentre.status}; error=${proofCentre.error ?? ""}`);
check("proof-centre-has-founder-title", pageText.includes("Kingsmen Founder Control Plane"), "founder title");
check("proof-centre-has-build-proof-centre", pageText.includes("Build Proof Centre"), "Build Proof Centre");
check("proof-centre-has-local-warning", pageText.includes("Local founder proof page only"), "local warning");

for (const batch of requiredBatches) {
  check(`runtime-page-has:${batch}`, pageText.includes(batch), batch);
}

for (const label of requiredLabels) {
  check(`runtime-page-has-label:${label}`, pageText.includes(label), label);
}

check("runtime-page-renders-eight-batches", renderedBatches.length === 8, `rendered=${renderedBatches.length}`);
check("runtime-page-renders-eight-labels", renderedLabels.length === 8, `rendered=${renderedLabels.length}`);
check("runtime-page-no-production-claim", pageText.includes("does not claim production") || pageText.includes("does not claim production readiness"), "no production boundary language");
check("compose-down-after", composeDownAfter?.exitCode === 0, `exit=${composeDownAfter?.exitCode}; timedOut=${composeDownAfter?.timedOut}`);
check("docker-containers-released-after-down", (dockerPsAfter?.stdout ?? "").trim().length === 0, (dockerPsAfter?.stdout ?? "").trim());

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`runtime-page-no-forbidden:${pattern}`, !pageText.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.proof-centre-registry-runtime-refresh-proof.v1",
  module: "BATCH 30 - Proof Centre Registry Runtime Refresh Proof",
  status: passed
    ? "PROOF_CENTRE_REGISTRY_RUNTIME_REFRESH_PROVEN"
    : "PROOF_CENTRE_REGISTRY_RUNTIME_REFRESH_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  runtimeScope: "controlled_local_docker_runtime_proof_centre_registry_render_proof",
  composeFile,
  targetUrl,
  pageCapturePath,
  webBuildSucceeded: webBuild?.exitCode === 0,
  composeUpSucceeded: composeUp?.exitCode === 0,
  composeDownSucceeded: composeDownAfter?.exitCode === 0,
  apiHealthStatus: apiHealth.status ?? 0,
  proofCentreStatus: proofCentre.status ?? 0,
  renderedBatchCount: renderedBatches.length,
  renderedLabelCount: renderedLabels.length,
  allEightBatchesRendered: renderedBatches.length === 8,
  allEightLabelsRendered: renderedLabels.length === 8,
  portsReleasedAfterDown: (dockerPsAfter?.stdout ?? "").trim().length === 0,
  checks,
  failed,
  commandSummary: {
    composeDownBefore: {
      exitCode: composeDownBefore?.exitCode,
      timedOut: composeDownBefore?.timedOut,
      seconds: composeDownBefore?.seconds
    },
    webBuild: {
      exitCode: webBuild?.exitCode,
      timedOut: webBuild?.timedOut,
      seconds: webBuild?.seconds,
      stderrTail: webBuild?.stderr
    },
    composeUp: {
      exitCode: composeUp?.exitCode,
      timedOut: composeUp?.timedOut,
      seconds: composeUp?.seconds,
      stderrTail: composeUp?.stderr
    },
    composeDownAfter: {
      exitCode: composeDownAfter?.exitCode,
      timedOut: composeDownAfter?.timedOut,
      seconds: composeDownAfter?.seconds
    }
  },
  next_action: passed
    ? "Run validator and commit BATCH 30."
    : "Repair Proof Centre runtime registry rendering before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
