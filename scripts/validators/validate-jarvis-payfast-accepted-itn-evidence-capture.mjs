import fs from "node:fs";

const files = {
  runner: "scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
  gate: "apps/web/src/app/api/jarvis/payfast-accepted-itn-proof/route.ts",
  queue: "apps/web/src/app/api/jarvis/live-proof-queue/route.ts",
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

const runner = read(files.runner);
const gate = read(files.gate);
const queue = read(files.queue);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-payfast-accepted-itn-evidence-capture.v1",
  "payment.payfast.itn.proof.requested",
  "JARVIS_PAYFAST_SANDBOX_CHECKOUT_EVIDENCE_FILE",
  "JARVIS_PAYFAST_ACCEPTED_ITN_EVIDENCE_FILE",
  "JARVIS_PAYFAST_REJECTION_EVIDENCE_FILE",
  "JARVIS_PAYFAST_REFUND_APPROVAL_EVIDENCE_FILE",
  "PAYFAST_MERCHANT_ID",
  "PAYFAST_MERCHANT_KEY",
  "PAYFAST_PASSPHRASE",
  "PAYFAST_NOTIFY_URL",
  "PAYMENT_PROVIDER_SECRET",
  "kingsmen.jarvis-payfast-sandbox-checkout-evidence.v1",
  "kingsmen.jarvis-payfast-accepted-itn-evidence.v1",
  "kingsmen.jarvis-payfast-rejection-evidence.v1",
  "kingsmen.jarvis-payfast-refund-founder-approval-evidence.v1",
  "payfastMayMarkPaidFromReturnUrl: false",
  "payfastMayMarkPaidFromCancelUrl: false",
  "truthVaultFinanceAuthorityRequired: true",
  "rawSecretsReturned: false",
  "secretValuesReturned: false"
].forEach((token) => requireToken(files.runner, runner, token));

[
  "captureRunner: \"scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs\"",
  "captureReportPath: \"reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json\"",
  "captureValidator: \"scripts/validators/validate-jarvis-payfast-accepted-itn-evidence-capture.mjs\"",
  "payfastEvidenceCaptureConnected: true",
  "payfastAcceptedItnProofAccepted: false",
  "productionReady: false",
  "publicLaunchAllowed: false"
].forEach((token) => requireToken(files.gate, gate, token));

[
  "node scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
  "/api/jarvis/payfast-accepted-itn-proof",
  "accepted ITN proof"
].forEach((token) => requireToken(files.queue, queue, token));

[
  "scripts/proof/capture-jarvis-payfast-accepted-itn-evidence.mjs",
  "scripts/validators/validate-jarvis-payfast-accepted-itn-evidence-capture.mjs",
  "reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json",
  "manifests/jarvis/jarvis-payfast-accepted-itn-evidence-capture-v1.json",
  "jarvisPayFastAcceptedItnEvidenceCaptureIndexed: true"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "console.log(process.env",
  "PAYFAST_MERCHANT_KEY:",
  "PAYFAST_PASSPHRASE:",
  "PAYMENT_PROVIDER_SECRET:",
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool"
].forEach((token) => {
  requireAbsent(files.runner, runner, token);
  requireAbsent(files.gate, gate, token);
  requireAbsent(files.queue, queue, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis PayFast Accepted ITN Evidence Capture",
  status: passed ? "JARVIS_PAYFAST_ACCEPTED_ITN_EVIDENCE_CAPTURE_SOURCE_VALIDATED" : "JARVIS_PAYFAST_ACCEPTED_ITN_EVIDENCE_CAPTURE_SOURCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecutedFromWeb: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run the PayFast evidence capture runner only when backend runtime and accepted redacted evidence files are available."
    : "Repair PayFast accepted ITN evidence capture source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
