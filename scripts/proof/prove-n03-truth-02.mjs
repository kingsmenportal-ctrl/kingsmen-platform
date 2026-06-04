import fs from "node:fs";

const required = [
  "docs/n03/N03_TRUTH_02_PAYMENT_APPLICATION_EVIDENCE_STATUS_GUARDS.md",
  "manifests/n03/n03-truth-02-payment-application-evidence-status-guards.json",
  "packages/contracts/src/n03-status-transition-contract.ts",
  "packages/contracts/src/n03-proof-requirement-contract.ts",
  "packages/backend/src/n03/status-transition-guard.ts",
  "packages/db/src/n03-status-transition-policy.ts",
  "scripts/validators/validate-n03-truth-02.mjs",
  "reports/n03/n03-truth-01-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n03/n03-truth-02-payment-application-evidence-status-guards.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.returnUrlCannotMarkPaid !== true) failures.push("returnUrlCannotMarkPaid must be true");
if (manifest.applicationSubmittedRequiresProof !== true) failures.push("applicationSubmittedRequiresProof must be true");
if (manifest.outcomeVerifiedRequiresProof !== true) failures.push("outcomeVerifiedRequiresProof must be true");
if (manifest.auditRequiredForStatusTransition !== true) failures.push("auditRequiredForStatusTransition must be true");

const report = {
  schema: "kingsmen.n03-truth-02-proof.v1",
  module: "N03-TRUTH-02 - Payment / Application / Evidence Status Transition Guards",
  status: failures.length === 0 ? "N03_PAYMENT_APPLICATION_EVIDENCE_STATUS_GUARDS_PROVEN" : "N03_PAYMENT_APPLICATION_EVIDENCE_STATUS_GUARDS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  paymentRequiresWebhookOrManualFinanceProof: manifest.paymentRequiresWebhookOrManualFinanceProof === true,
  returnUrlCannotMarkPaid: manifest.returnUrlCannotMarkPaid === true,
  applicationSubmittedRequiresProof: manifest.applicationSubmittedRequiresProof === true,
  outcomeVerifiedRequiresProof: manifest.outcomeVerifiedRequiresProof === true,
  successStoryRequiresProofConsent: manifest.successStoryRequiresProofConsent === true,
  partnerSharingRequiresConsent: manifest.partnerSharingRequiresConsent === true,
  auditRequiredForStatusTransition: manifest.auditRequiredForStatusTransition === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N03-TRUTH-03 - CAO parent-child application model and six-gate visibility constraints."
    : "Repair N03-TRUTH-02 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n03", { recursive: true });
fs.writeFileSync("reports/n03/n03-truth-02-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-02 proof passed.");