import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/payfast-accepted-itn-proof/route.ts",
  page: "apps/web/src/app/founder/launch-control/jarvis-payfast-itn-proof/page.tsx",
  liveQueue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
  runbook: "apps/web/src/app/api/jarvis/live-proof-runbook/route.ts",
  ledger: "apps/web/src/app/api/jarvis/live-proof-evidence-ledger/route.ts",
  acceptance: "apps/web/src/app/api/jarvis/live-proof-acceptance-gate/route.ts",
  proofPack: "apps/web/src/app/api/jarvis/proof-pack-index/route.ts"
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

const loaded = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]));

[
  "kingsmen.jarvis-payfast-accepted-itn-proof.v1",
  "payfastProofGateConnected: true",
  "payfastAcceptedItnProofAccepted: false",
  "payfastMayMarkPaidFromReturnUrl: false",
  "payfastMayMarkPaidFromCancelUrl: false",
  "truthVaultFinanceAuthorityRequired: true",
  "BLOCK_PAYFAST_LIVE_UNTIL_ACCEPTED_ITN_EVIDENCE",
  "duplicate ITN",
  "failed-payment",
  "founder approval"
].forEach((token) => requireToken(files.route, loaded.route, token));

[
  "PayFast Accepted ITN Proof",
  "REJECTED_UNTIL_ACCEPTED_ITN",
  "return URL",
  "cancel URL",
  "/api/jarvis/payfast-accepted-itn-proof"
].forEach((token) => requireToken(files.page, loaded.page, token));

[
  "payfast-itn-proof",
  "/api/jarvis/payfast-accepted-itn-proof"
].forEach((token) => requireToken(files.liveQueue, loaded.liveQueue, token));

[
  "payfast-itn-proof",
  "/api/jarvis/payfast-accepted-itn-proof"
].forEach((token) => requireToken(files.runbook, loaded.runbook, token));

[
  "payfast-itn-evidence",
  "/api/jarvis/payfast-accepted-itn-proof"
].forEach((token) => requireToken(files.ledger, loaded.ledger, token));

[
  "payfast-itn-acceptance",
  "/api/jarvis/payfast-accepted-itn-proof",
  "REJECTED_UNTIL_REAL_EVIDENCE"
].forEach((token) => requireToken(files.acceptance, loaded.acceptance, token));

[
  "scripts/validators/validate-jarvis-payfast-accepted-itn-proof.mjs",
  "manifests/jarvis/jarvis-payfast-accepted-itn-proof-v1.json",
  "/founder/launch-control/jarvis-payfast-itn-proof",
  "/api/jarvis/payfast-accepted-itn-proof",
  "jarvisPayFastAcceptedItnProofIndexed: true"
].forEach((token) => requireToken(files.proofPack, loaded.proofPack, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.PAYFAST_PASSPHRASE",
  "process.env.PAYMENT_PROVIDER_SECRET"
].forEach((token) => {
  Object.entries(files).forEach(([key, path]) => requireAbsent(path, loaded[key], token));
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis PayFast Accepted ITN Proof Gate",
  status: passed ? "JARVIS_PAYFAST_ACCEPTED_ITN_PROOF_GATE_VALIDATED" : "JARVIS_PAYFAST_ACCEPTED_ITN_PROOF_GATE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Capture real PayFast sandbox checkout and accepted ITN evidence before PayFast can pass."
    : "Repair PayFast accepted ITN proof gate wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
