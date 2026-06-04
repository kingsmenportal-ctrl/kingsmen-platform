import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_09_FINANCIAL_VIEW_SERVICE_ORDERS_REFUNDS.md",
  "manifests/n04/n04-candidate-09-financial-view-service-orders-refunds.json",
  "packages/contracts/src/n04-service-order-contract.ts",
  "packages/contracts/src/n04-payment-status-contract.ts",
  "packages/contracts/src/n04-refund-visibility-contract.ts",
  "packages/backend/src/n04/service-order-policy.ts",
  "packages/backend/src/n04/payment-status-policy.ts",
  "packages/backend/src/n04/refund-visibility-policy.ts",
  "apps/web/src/app/candidate/finance/page.tsx",
  "packages/db/src/n04-financial-view-policy.ts",
  "reports/n04/n04-candidate-08-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-09-financial-view-service-orders-refunds.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-09-financial-view-service-orders-refunds.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate08",
  "financialViewBuilt",
  "serviceOrdersBuilt",
  "paymentStatusVisibilityBuilt",
  "refundVisibilityBuilt",
  "candidateCannotMarkPaid",
  "returnUrlCannotMarkPaid",
  "paymentRequiresWebhookOrManualFinanceReview",
  "refundRequiresManualFinanceReview",
  "officialPricingPreserved",
  "cvRevampUpgradeBonusPreserved"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const serviceOrder = fs.existsSync("packages/backend/src/n04/service-order-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/service-order-policy.ts", "utf8")
  : "";

for (const phrase of ["Foundational Accord", "R169.99", "CV Revamp", "R49.99", "additionalManagedApplicationsOnUpgrade"]) {
  if (!serviceOrder.includes(phrase)) failures.push(`Service order policy missing phrase: ${phrase}`);
}

const payment = fs.existsSync("packages/backend/src/n04/payment-status-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/payment-status-policy.ts", "utf8")
  : "";

for (const phrase of ["return_url cannot mark paid", "candidate cannot mark paid", "webhook_verified", "manual_finance_review"]) {
  if (!payment.includes(phrase)) failures.push(`Payment status policy missing phrase: ${phrase}`);
}

const refund = fs.existsSync("packages/backend/src/n04/refund-visibility-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/refund-visibility-policy.ts", "utf8")
  : "";

for (const phrase of ["manual finance review", "auto approval is not allowed", "candidate cannot approve"]) {
  if (!refund.includes(phrase)) failures.push(`Refund visibility policy missing phrase: ${phrase}`);
}

const page = fs.existsSync("apps/web/src/app/candidate/finance/page.tsx")
  ? fs.readFileSync("apps/web/src/app/candidate/finance/page.tsx", "utf8")
  : "";

for (const phrase of ["Financial View", "Candidate cannot mark paid", "Return URL cannot mark paid", "manual finance review", "two additional active managed applications"]) {
  if (!page.includes(phrase)) failures.push(`Finance page missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-09-validation.v1",
  module: "N04-CANDIDATE-09",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-09-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-09 validation passed.");