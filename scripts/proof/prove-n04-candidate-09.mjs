import fs from "node:fs";

const required = [
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
  "scripts/validators/validate-n04-candidate-09.mjs",
  "reports/n04/n04-candidate-08-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-09-financial-view-service-orders-refunds.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.candidateCannotMarkPaid !== true) failures.push("candidateCannotMarkPaid must be true");
if (manifest.returnUrlCannotMarkPaid !== true) failures.push("returnUrlCannotMarkPaid must be true");
if (manifest.officialPricingPreserved !== true) failures.push("officialPricingPreserved must be true");

const report = {
  schema: "kingsmen.n04-candidate-09-proof.v1",
  module: "N04-CANDIDATE-09 - Financial View / Service Orders / Payment Status / Refund Visibility",
  status: failures.length === 0 ? "N04_FINANCIAL_VIEW_SERVICE_ORDERS_REFUNDS_PROVEN" : "N04_FINANCIAL_VIEW_SERVICE_ORDERS_REFUNDS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  financialViewBuilt: manifest.financialViewBuilt === true,
  serviceOrdersBuilt: manifest.serviceOrdersBuilt === true,
  paymentStatusVisibilityBuilt: manifest.paymentStatusVisibilityBuilt === true,
  refundVisibilityBuilt: manifest.refundVisibilityBuilt === true,
  candidateCannotMarkPaid: manifest.candidateCannotMarkPaid === true,
  returnUrlCannotMarkPaid: manifest.returnUrlCannotMarkPaid === true,
  paymentRequiresWebhookOrManualFinanceReview: manifest.paymentRequiresWebhookOrManualFinanceReview === true,
  refundRequiresManualFinanceReview: manifest.refundRequiresManualFinanceReview === true,
  officialPricingPreserved: manifest.officialPricingPreserved === true,
  cvRevampUpgradeBonusPreserved: manifest.cvRevampUpgradeBonusPreserved === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-10 - success loop, feedback, outcomes, and learning signals."
    : "Repair N04-CANDIDATE-09 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-09-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-09 proof passed.");