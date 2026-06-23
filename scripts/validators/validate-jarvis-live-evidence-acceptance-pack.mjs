import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/live-evidence-acceptance-pack/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-live-evidence-acceptance-pack/page.tsx",
  runner: "scripts/proof/accept-jarvis-live-evidence-pack.mjs"
};

const checks = [];

function addCheck(name, passed, detail, path) {
  checks.push({ name, passed, detail, path });
}

function read(path) {
  if (!fs.existsSync(path)) {
    addCheck(`file_exists:${path}`, false, "missing", path);
    return "";
  }
  addCheck(`file_exists:${path}`, true, "found", path);
  return fs.readFileSync(path, "utf8");
}

function requireToken(path, content, token) {
  addCheck(`token:${path}:${token}`, content.includes(token), token, path);
}

function requireAbsent(path, content, token) {
  addCheck(`forbidden_absent:${path}:${token}`, !content.includes(token), token, path);
}

const route = read(files.route);
const page = read(files.page);
const runner = read(files.runner);

[
  "kingsmen.jarvis-live-evidence-acceptance-pack.v1",
  "liveEvidenceAccepted: false",
  "acceptanceDecision: \"WAITING_FOR_REAL_EVIDENCE\"",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "acceptanceRunner",
  "acceptanceReportPath",
  "acceptanceValidator",
  "docker-api-truth-vault-runtime-evidence",
  "ai-email-provider-live-evidence",
  "payfast-accepted-itn-evidence",
  "n8n-airtable-github-runtime-evidence",
  "branch-protection-final-launch-audit-evidence"
].forEach((token) => requireToken(files.route, route, token));

[
  "Live Evidence Acceptance Pack",
  "/api/jarvis/live-evidence-acceptance-pack",
  "Final HUD",
  "Runbook",
  "Evidence ledger",
  "Evidence accepted",
  "Runtime live",
  "Public launch"
].forEach((token) => requireToken(files.page, page, token));

[
  "kingsmen.jarvis-live-evidence-acceptance-pack-report.v1",
  "allEvidenceAccepted",
  "BLOCK_LAUNCH__EVIDENCE_NOT_ACCEPTED",
  "READY_FOR_FINAL_RELEASE_REVIEW",
  "reports/jarvis/jarvis-live-evidence-acceptance-pack-latest.json",
  "rawSecretsPrinted: false",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "directDatabaseAccessFromWeb: false"
].forEach((token) => requireToken(files.runner, runner, token));

[
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.AIRTABLE_API_KEY",
  "process.env.KINGSMEN_N8N_API_KEY",
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool"
].forEach((token) => {
  requireAbsent(files.route, route, token);
  requireAbsent(files.page, page, token);
  requireAbsent(files.runner, runner, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Live Evidence Acceptance Pack",
  status: passed ? "JARVIS_LIVE_EVIDENCE_ACCEPTANCE_PACK_SOURCE_VALIDATED" : "JARVIS_LIVE_EVIDENCE_ACCEPTANCE_PACK_SOURCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run capture runners, then run node scripts/proof/accept-jarvis-live-evidence-pack.mjs."
    : "Repair Jarvis live evidence acceptance pack source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
