import fs from "node:fs";

const requiredFiles = [
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
  "reports/n04/n04-candidate-11-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n05/n05-document-01-service-overview-storage-ocr-fraud-review.json")
  ? JSON.parse(fs.readFileSync("manifests/n05/n05-document-01-service-overview-storage-ocr-fraud-review.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate11",
  "documentVaultServiceBuilt",
  "signedUploadBoundaryBuilt",
  "privateStorageRequired",
  "rawPublicFileAccessBlocked",
  "candidateCanViewOwnDocuments",
  "candidateCannotVerifyDocuments",
  "ocrAssistiveOnly",
  "fraudReviewRequiresEvidence",
  "riskyDocumentRequiresHumanReview",
  "documentStatusRequiresProof"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const storage = fs.existsSync("packages/backend/src/n05/document-storage-boundary-policy.ts")
  ? fs.readFileSync("packages/backend/src/n05/document-storage-boundary-policy.ts", "utf8")
  : "";

for (const phrase of ["signed upload", "signed read", "raw public file access is blocked", "service_role must never be visible"]) {
  if (!storage.includes(phrase)) failures.push(`Storage policy missing phrase: ${phrase}`);
}

const authority = fs.existsSync("packages/backend/src/n05/document-authority-policy.ts")
  ? fs.readFileSync("packages/backend/src/n05/document-authority-policy.ts", "utf8")
  : "";

for (const phrase of ["candidate cannot perform document authority action", "requires proof", "verify_document", "mark_fraud_confirmed"]) {
  if (!authority.includes(phrase)) failures.push(`Document authority policy missing phrase: ${phrase}`);
}

const ocr = fs.existsSync("packages/backend/src/n05/ocr-fraud-review-policy.ts")
  ? fs.readFileSync("packages/backend/src/n05/ocr-fraud-review-policy.ts", "utf8")
  : "";

for (const phrase of ["may suggest, not govern", "fraud risk requires human review", "requires evidence"]) {
  if (!ocr.includes(phrase)) failures.push(`OCR/fraud policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n05-document-01-validation.v1",
  module: "N05-DOCUMENT-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n05-document-01-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-01 validation passed.");