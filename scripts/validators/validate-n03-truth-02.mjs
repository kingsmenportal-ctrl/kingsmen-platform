import fs from "node:fs";

const requiredFiles = [
  "docs/n03/N03_TRUTH_02_PAYMENT_APPLICATION_EVIDENCE_STATUS_GUARDS.md",
  "manifests/n03/n03-truth-02-payment-application-evidence-status-guards.json",
  "packages/contracts/src/n03-status-transition-contract.ts",
  "packages/contracts/src/n03-proof-requirement-contract.ts",
  "packages/backend/src/n03/status-transition-guard.ts",
  "packages/db/src/n03-status-transition-policy.ts",
  "reports/n03/n03-truth-01-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n03/n03-truth-02-payment-application-evidence-status-guards.json")
  ? JSON.parse(fs.readFileSync("manifests/n03/n03-truth-02-payment-application-evidence-status-guards.json", "utf8"))
  : {};

for (const key of [
  "requiresN03Truth01",
  "paymentRequiresWebhookOrManualFinanceProof",
  "returnUrlCannotMarkPaid",
  "applicationSubmittedRequiresProof",
  "outcomeVerifiedRequiresProof",
  "successStoryRequiresProofConsent",
  "partnerSharingRequiresConsent",
  "sourceConfidenceCandidateBlocked",
  "auditRequiredForStatusTransition"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const guard = fs.existsSync("packages/backend/src/n03/status-transition-guard.ts")
  ? fs.readFileSync("packages/backend/src/n03/status-transition-guard.ts", "utf8")
  : "";

for (const phrase of [
  "return_url/browser alone",
  "webhook_verified",
  "manual_finance_review",
  "mark_submitted",
  "verify_outcome",
  "publish_success_story",
  "share_identity_with_partner",
  "change_source_confidence",
  "Audit required"
]) {
  if (!guard.includes(phrase)) failures.push(`Status guard missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n03-truth-02-validation.v1",
  module: "N03-TRUTH-02",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n03-truth-02-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-02 validation passed.");