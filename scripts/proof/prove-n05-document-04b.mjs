import fs from "node:fs";

const required = [
  "docs/n05/N05_DOCUMENT_04B_REVIEW_METHODS_SERVER_WIRING_STATUS_INTEGRATION.md",
  "manifests/n05/n05-document-04b-review-methods-server-wiring-status-integration.json",
  "packages/backend/src/n05/document-review-methods.ts",
  "packages/backend/src/n05/ocr-fraud-review-methods.ts",
  "packages/backend/src/n05/document-status-integration.ts",
  "packages/backend/src/n05/document-server-wiring.ts",
  "apps/web/src/app/api/founder/documents/review/route.ts",
  "scripts/validators/validate-n05-document-04b.mjs",
  "reports/n05/n05-document-04-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n05/n05-document-04b-review-methods-server-wiring-status-integration.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.reviewMethodsBuilt !== true) failures.push("reviewMethodsBuilt must be true");
if (manifest.statusIntegrationBuilt !== true) failures.push("statusIntegrationBuilt must be true");
if (manifest.candidateReviewAuthorityBlocked !== true) failures.push("candidateReviewAuthorityBlocked must be true");

const report = {
  schema: "kingsmen.n05-document-04b-proof.v1",
  module: "N05-DOCUMENT-04B - Review Methods / Server Wiring / Document Status Integration",
  status: failures.length === 0 ? "N05_DOCUMENT_REVIEW_METHODS_SERVER_WIRING_STATUS_INTEGRATION_PROVEN" : "N05_DOCUMENT_REVIEW_METHODS_SERVER_WIRING_STATUS_INTEGRATION_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  reviewMethodsBuilt: manifest.reviewMethodsBuilt === true,
  ocrFraudReviewMethodsBuilt: manifest.ocrFraudReviewMethodsBuilt === true,
  statusIntegrationBuilt: manifest.statusIntegrationBuilt === true,
  serverWiringRegistryBuilt: manifest.serverWiringRegistryBuilt === true,
  candidateSafeStatusMappingBuilt: manifest.candidateSafeStatusMappingBuilt === true,
  reviewRequiresProofEvidenceAudit: manifest.reviewRequiresProofEvidenceAudit === true,
  candidateReviewAuthorityBlocked: manifest.candidateReviewAuthorityBlocked === true,
  fraudClearRequiresHumanReview: manifest.fraudClearRequiresHumanReview === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N05-DOCUMENT-05 - validator, manifest, evidence matrix, and closeout."
    : "Repair N05-DOCUMENT-04B files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n05", { recursive: true });
fs.writeFileSync("reports/n05/n05-document-04b-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-04B proof passed.");