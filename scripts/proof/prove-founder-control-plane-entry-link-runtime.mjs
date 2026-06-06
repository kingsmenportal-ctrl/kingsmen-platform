#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const timeoutArg = process.argv.find((arg) => arg.startsWith("--timeoutSeconds="));
const timeoutSeconds = timeoutArg ? Number(timeoutArg.split("=")[1]) : 720;

const composeFile = "docker/oracle-lite/docker-compose.local.yml";
const proofPath = "reports/control-plane/founder-control-plane-entry-link-runtime-proof.json";

const checks = [];
const commands = {};

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
      try {
        child.kill("SIGKILL");
      } catch {}
    }, seconds * 1000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        name,
        command,
        args,
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
        command,
        args,
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

    return {
      ok: true,
      status: response.status,
      url: response.url,
      text,
      error: ""
    };
  } catch (error) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      url,
      text: "",
      error: error.message
    };
  }
}

async function pollUrl(name, url, seconds, predicate) {
  const deadline = Date.now() + seconds * 1000;
  let last = null;

  while (Date.now() < deadline) {
    last = await fetchText(url, 15);
    if (predicate(last)) {
      return { ...last, name, polled: true };
    }
    await sleep(3000);
  }

  return {
    ...(last ?? { ok: false, status: 0, url, text: "", error: "no attempts completed" }),
    name,
    polled: true,
    timeout: true
  };
}

const requiredFiles = [
  composeFile,
  "apps/web/src/app/founder/control-plane/page.tsx",
  "apps/web/src/app/founder/proof-centre/page.tsx",
  "reports/control-plane/founder-proof-centre-entry-link-proof.json",
  "reports/validation/founder-proof-centre-entry-link-latest.json"
];

for (const file of requiredFiles) {
  check(`required-file:${file}`, exists(file), file);
}

const batch27ProofPath = "reports/control-plane/founder-proof-centre-entry-link-proof.json";
const batch27ValidationPath = "reports/validation/founder-proof-centre-entry-link-latest.json";

const batch27Proof = exists(batch27ProofPath) ? readJson(batch27ProofPath) : null;
const batch27Validation = exists(batch27ValidationPath) ? readJson(batch27ValidationPath) : null;

check(
  "batch27-entry-link-proven",
  batch27Proof?.status === "FOUNDER_PROOF_CENTRE_ENTRY_LINK_PROVEN" && batch27Proof?.passed === true,
  batch27Proof?.status ?? "missing"
);

check(
  "batch27-validation-passed",
  batch27Validation?.status === "VALIDATED" && batch27Validation?.passed === true,
  batch27Validation?.status ?? "missing"
);

check(
  "batch27-no-production-claim",
  batch27Proof?.productionReady === false && batch27Proof?.canClaimProduction === false,
  "BATCH 27 production false"
);

check(
  "batch27-no-oracle-claim",
  batch27Proof?.deployedToOracle === false,
  "BATCH 27 oracle false"
);

let composeDownBefore = null;
let webBuild = null;
let composeUp = null;
let apiHealth = { status: 0, text: "", error: "not run" };
let controlPlane = { status: 0, text: "", error: "not run" };
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
  commands.composeDownBefore = composeDownBefore;
  check("compose-down-before", composeDownBefore.exitCode === 0, `exit=${composeDownBefore.exitCode}; timedOut=${composeDownBefore.timedOut}`);

  webBuild = await runCommand(
    "compose-build-web",
    "docker",
    ["compose", "-f", composeFile, "build", "kingsmen-web"],
    timeoutSeconds
  );
  commands.webBuild = webBuild;
  check("web-build-succeeded", webBuild.exitCode === 0, `exit=${webBuild.exitCode}; timedOut=${webBuild.timedOut}`);

  composeUp = await runCommand(
    "compose-up",
    "docker",
    ["compose", "-f", composeFile, "up", "-d", "--no-build", "kingsmen-api", "kingsmen-web"],
    240
  );
  commands.composeUp = composeUp;
  check("compose-up-succeeded", composeUp.exitCode === 0, `exit=${composeUp.exitCode}; timedOut=${composeUp.timedOut}`);

  if (composeUp.exitCode === 0) {
    apiHealth = await pollUrl(
      "api-health",
      "http://127.0.0.1:3001/health",
      90,
      (result) => result.status === 200
    );

    controlPlane = await pollUrl(
      "founder-control-plane",
      "http://127.0.0.1:3000/founder/control-plane",
      120,
      (result) => result.status === 200 && result.text.includes("Open Build Proof Centre")
    );

    proofCentre = await pollUrl(
      "founder-proof-centre",
      "http://127.0.0.1:3000/founder/proof-centre",
      120,
      (result) => result.status === 200 && result.text.includes("Build Proof Centre")
    );
  }
} finally {
  composeDownAfter = await runCommand(
    "compose-down-after",
    "docker",
    ["compose", "-f", composeFile, "down", "--remove-orphans"],
    180
  );
  commands.composeDownAfter = composeDownAfter;

  dockerPsAfter = await runCommand(
    "docker-ps-after",
    "docker",
    ["ps", "--filter", "name=kingsmen-", "--format", "{{.Names}}"],
    60
  );
  commands.dockerPsAfter = dockerPsAfter;
}

const controlText = controlPlane.text ?? "";
const proofText = proofCentre.text ?? "";

check("api-health-200", apiHealth.status === 200, `status=${apiHealth.status}; error=${apiHealth.error ?? ""}`);
check("control-plane-page-200", controlPlane.status === 200, `status=${controlPlane.status}; error=${controlPlane.error ?? ""}`);
check("control-plane-entry-marker-rendered", controlText.includes('data-kingsmen-proof-centre-entry="true"'), "entry marker");
check("control-plane-entry-href-rendered", controlText.includes('href="/founder/proof-centre/"'), "href");
check("control-plane-entry-label-rendered", controlText.includes("Open Build Proof Centre"), "label");
check("proof-centre-page-200", proofCentre.status === 200, `status=${proofCentre.status}; error=${proofCentre.error ?? ""}`);
check("proof-centre-page-rendered", proofText.includes("Build Proof Centre"), "Build Proof Centre text");
check("compose-down-after", composeDownAfter?.exitCode === 0, `exit=${composeDownAfter?.exitCode}; timedOut=${composeDownAfter?.timedOut}`);
check("docker-containers-released-after-down", (dockerPsAfter?.stdout ?? "").trim().length === 0, (dockerPsAfter?.stdout ?? "").trim());

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.founder-control-plane-entry-link-runtime-proof.v1",
  module: "BATCH 28 - Founder Control Plane Entry Link Runtime Proof",
  status: passed
    ? "FOUNDER_CONTROL_PLANE_ENTRY_LINK_RUNTIME_PROVEN"
    : "FOUNDER_CONTROL_PLANE_ENTRY_LINK_RUNTIME_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  runtimeScope: "controlled_local_docker_runtime_ui_navigation_proof",
  composeFile,
  webBuildSucceeded: webBuild?.exitCode === 0,
  composeUpSucceeded: composeUp?.exitCode === 0,
  composeDownSucceeded: composeDownAfter?.exitCode === 0,
  apiHealthStatus: apiHealth.status ?? 0,
  controlPlaneStatus: controlPlane.status ?? 0,
  proofCentreStatus: proofCentre.status ?? 0,
  entryLinkRendered:
    controlText.includes('data-kingsmen-proof-centre-entry="true"') &&
    controlText.includes('href="/founder/proof-centre/"') &&
    controlText.includes("Open Build Proof Centre"),
  targetRouteReached: proofCentre.status === 200 && proofText.includes("Build Proof Centre"),
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
    ? "Run validator and commit BATCH 28."
    : "Repair runtime rendering or Docker build before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
