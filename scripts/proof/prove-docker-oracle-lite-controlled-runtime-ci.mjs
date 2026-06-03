#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const composeFile = "docker/oracle-lite/docker-compose.local.yml";
const proofPath = path.join(root, "reports/runtime/batch21c-docker-runtime-proof.json");
const localDataFile = path.join(root, "data/local/free-destiny-map/backend-runtime-boundary/backend-runtime-demo-intakes.jsonl");
const checks = [];

function check(name, passed, detail = "") { checks.push({ name, passed, detail }); }
function run(args, timeoutMs = 180000) {
  return new Promise((resolve) => {
    const child = spawn("docker", args, { cwd: root, env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "", timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGTERM"); }, timeoutMs);
    child.stdout.on("data", d => stdout += d.toString());
    child.stderr.on("data", d => stderr += d.toString());
    child.on("close", code => { clearTimeout(timer); resolve({ code, stdout, stderr, timedOut }); });
    child.on("error", e => { clearTimeout(timer); resolve({ code: null, stdout, stderr, timedOut, error: e.message }); });
  });
}
async function wait(url, expected, timeoutMs = 180000) {
  const end = Date.now() + timeoutMs;
  let last = "";
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (res.status === expected) return { ok: true, status: res.status, text };
      last = `status=${res.status}`;
    } catch (e) { last = e.message; }
    await new Promise(r => setTimeout(r, 1500));
  }
  return { ok: false, status: 0, text: "", last };
}

const payload = {
  fullName: "Kingsmen GitHub Actions Runtime Demo Candidate",
  province: "KwaZulu-Natal",
  currentSituation: "GitHub Actions CI runtime proof.",
  knownRoute: "BATCH 21C GitHub Actions Docker runtime proof",
  routeInterests: ["higher_education","tvet","nsfas_bursary","accommodation","cv_revamp","source_check"],
  needsAccommodation: true,
  accommodationArea: "Durban",
  needsFundingHelp: true,
  needsCvHelp: true,
  hasDocumentsReady: false,
  randomSourceName: "GitHub Actions demo source",
  consentToBeContacted: true,
  consentToProcessBasicInfo: true
};

let composeUpSucceeded = false;
let composeDownSucceeded = false;
let apiHealthStatus = 0;
let webStatus = 0;
let bridgeApiStatus = 0;
let bridgeResponse = null;

try {
  let downBefore = await run(["compose","-f",composeFile,"down","--remove-orphans"], 120000);
  check("ci-compose-down-before", downBefore.code === 0, `exit=${downBefore.code}; ${downBefore.stderr}`);

  let up = await run(["compose","-f",composeFile,"up","-d","--no-build","--remove-orphans"], 180000);
  composeUpSucceeded = up.code === 0;
  check("ci-compose-up-no-build", composeUpSucceeded, `exit=${up.code}; ${up.stderr}`);

  let ps = await run(["compose","-f",composeFile,"ps"], 30000);
  check("ci-compose-ps-has-services", ps.code === 0 && ps.stdout.includes("kingsmen-api") && ps.stdout.includes("kingsmen-web"), ps.stdout);

  const api = await wait("http://127.0.0.1:3001/health", 200);
  apiHealthStatus = api.status;
  check("ci-api-health-200", api.ok, api.last || "HTTP 200");

  const web = await wait("http://127.0.0.1:3000/free-destiny-map", 200);
  webStatus = web.status;
  check("ci-web-page-200", web.ok, web.last || "HTTP 200");
  check("ci-web-page-has-free-destiny-map", web.text.includes("Free Destiny Map") || web.text.includes("Start your Free Destiny Map"), "page text");

  const bridge = await fetch("http://127.0.0.1:3000/api/public/free-destiny-map/intake/local", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  bridgeApiStatus = bridge.status;
  bridgeResponse = await bridge.json();

  check("ci-bridge-api-202", bridgeApiStatus === 202, `status=${bridgeApiStatus}`);
  check("ci-bridge-backend-succeeded", bridgeResponse.backendBridgeSucceeded === true, "backendBridgeSucceeded true");
  check("ci-bridge-backend-boundary-reached", bridgeResponse.backendBoundaryReached === true, "backendBoundaryReached true");
  check("ci-backend-local-write-succeeded", bridgeResponse.backendLocalWriteSucceeded === true && fs.existsSync(localDataFile), "backend local write");
  check("ci-production-false", bridgeResponse.productionReady === false && bridgeResponse.canClaimProduction === false && bridgeResponse.deployedToOracle === false, "production/oracle false");
  check("ci-no-payment-email-document-official", bridgeResponse.paymentInstructionSent === false && bridgeResponse.emailSent === false && bridgeResponse.documentUploadAccepted === false && bridgeResponse.officialApplicationSubmitted === false, "blocked high-risk outputs false");
} catch (e) {
  check("ci-runtime-exception-absent", false, e.message);
} finally {
  let down = await run(["compose","-f",composeFile,"down","--remove-orphans"], 120000);
  composeDownSucceeded = down.code === 0;
  check("ci-compose-down-after", composeDownSucceeded, `exit=${down.code}; ${down.stderr}`);
}

const failed = checks.filter(c => !c.passed);
const passed = failed.length === 0 && composeUpSucceeded && composeDownSucceeded && apiHealthStatus === 200 && webStatus === 200 && bridgeApiStatus === 202;

const report = {
  schema: "kingsmen.batch21c.github-actions-docker-runtime-report.v1",
  module: "BATCH 21C - GitHub Actions Docker Runtime Proof",
  status: passed ? "GITHUB_ACTIONS_DOCKER_RUNTIME_PROVEN" : "GITHUB_ACTIONS_DOCKER_RUNTIME_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  runsInGitHubActions: true,
  composeUpSucceeded,
  composeDownSucceeded,
  apiHealthStatus,
  webStatus,
  bridgeApiStatus,
  backend_bridge_succeeded: bridgeResponse?.backendBridgeSucceeded ?? false,
  backend_boundary_reached: bridgeResponse?.backendBoundaryReached ?? false,
  backend_local_write_succeeded: bridgeResponse?.backendLocalWriteSucceeded ?? false,
  checks,
  failed,
  oracle_lite_impact: "ci_docker_runtime_proof_only",
  next_action: passed ? "Run validator and proceed to N_PROVIDER.5." : "Repair BATCH 21C CI runtime proof."
};

fs.mkdirSync(path.dirname(proofPath), { recursive: true });
fs.writeFileSync(proofPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
