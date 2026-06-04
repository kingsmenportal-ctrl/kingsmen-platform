import fs from "node:fs";

const required = [
  "docs/n05/N05_DOCUMENT_01_SERVICE_OVERVIEW_STORAGE_OCR_FRAUD_REVIEW.md",
  "manifests/n05/n05-document-01-service-overview-storage-ocr-fraud-review.json",
  "packages/contracts/src/n05-document-vault-contract.ts",
  "packages/contracts/src/n05-storage-boundary-contract.ts",
  "packages/contracts/src/n05-ocr-fraud-review-contract.ts",
  "packages/backend/src/n05/document-storage-boundary-policy.ts",
  "packages/backend/src/n05/document-authority-policy.ts",
  "packages/backend/src/n05/ocr-fraud-review-policy.ts",
  "apps/web/src/app/candidate/documents/page.tsx",
  "packages/db/src/n05-document-vault-policy.ts",
  "scripts/validators/validate-n05-document-01.mjs",
  "reports/n04/n04-candidate-11-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n05/n05-document-01-service-overview-storage-ocr-fraud-review.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.signedUploadBoundaryBuilt !== true) failures.push("signedUploadBoundaryBuilt must be true");
if (manifest.rawPublicFileAccessBlocked !== true) failures.push("rawPublicFileAccessBlocked must be true");
if (manifest.candidateCannotVerifyDocuments !== true) failures.push("candidateCannotVerifyDocuments must be true");
if (manifest.ocrAssistiveOnly !== true) failures.push("ocrAssistiveOnly must be true");

const report = {
  schema: "kingsmen.n05-document-01-proof.v1",
  module: "N05-DOCUMENT-01 - Document Vault Service Overview / Storage Boundary / OCR-Fraud-Review Doctrine",
  status: failures.length === 0 ? "N05_DOCUMENT_SERVICE_OVERVIEW_STORAGE_OCR_FRAUD_REVIEW_PROVEN" : "N05_DOCUMENT_SERVICE_OVERVIEW_STORAGE_OCR_FRAUD_REVIEW_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  documentVaultServiceBuilt: manifest.documentVaultServiceBuilt === true,
  signedUploadBoundaryBuilt: manifest.signedUploadBoundaryBuilt === true,
  privateStorageRequired: manifest.privateStorageRequired === true,
  rawPublicFileAccessBlocked: manifest.rawPublicFileAccessBlocked === true,
  candidateCanViewOwnDocuments: manifest.candidateCanViewOwnDocuments === true,
  candidateCannotVerifyDocuments: manifest.candidateCannotVerifyDocuments === true,
  ocrAssistiveOnly: manifest.ocrAssistiveOnly === true,
  fraudReviewRequiresEvidence: manifest.fraudReviewRequiresEvidence === true,
  riskyDocumentRequiresHumanReview: manifest.riskyDocumentRequiresHumanReview === true,
  documentStatusRequiresProof: manifest.documentStatusRequiresProof === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N05-DOCUMENT-02 - PostgreSQL schema, RLS, document status views, and seeds."
    : "Repair N05-DOCUMENT-01 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n05", { recursive: true });
fs.writeFileSync("reports/n05/n05-document-01-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-01 proof passed.");