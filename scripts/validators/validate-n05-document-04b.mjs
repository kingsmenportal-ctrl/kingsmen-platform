import fs from "node:fs";

const requiredFiles = [
  "docs/n05/N05_DOCUMENT_04B_REVIEW_METHODS_SERVER_WIRING_STATUS_INTEGRATION.md",
  "manifests/n05/n05-document-04b-review-methods-server-wiring-status-integration.json",
  "packages/backend/src/n05/document-review-methods.ts",
  "packages/backend/src/n05/ocr-fraud-review-methods.ts",
  "packages/backend/src/n05/document-status-integration.ts",
  "packages/backend/src/n05/document-server-wiring.ts",
  "apps/web/src/app/api/founder/documents/review/route.ts",
  "reports/n05/n05-document-04-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n05/n05-document-04b-review-methods-server-wiring-status-integration.json")
  ? JSON.parse(fs.readFileSync("manifests/n05/n05-document-04b-review-methods-server-wiring-status-integration.json", "utf8"))
  : {};

for (const key of [
  "requiresN05Document04",
  "reviewMethodsBuilt",
  "ocrFraudReviewMethodsBuilt",
  "statusIntegrationBuilt",
  "serverWiringRegistryBuilt",
  "candidateSafeStatusMappingBuilt",
  "reviewRequiresProofEvidenceAudit",
  "candidateReviewAuthorityBlocked",
  "fraudClearRequiresHumanReview"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const review = fs.existsSync("packages/backend/src/n05/document-review-methods.ts")
  ? fs.readFileSync("packages/backend/src/n05/document-review-methods.ts", "utf8")
  : "";

for (const phrase of ["proofId", "evidenceId", "auditId", "candidate review authority blocked"]) {
  if (!review.includes(phrase)) failures.push(`Review methods missing ${phrase}`);
}

const status = fs.existsSync("packages/backend/src/n05/document-status-integration.ts")
  ? fs.readFileSync("packages/backend/src/n05/document-status-integration.ts", "utf8")
  : "";

for (const phrase of ["candidateCanVerify: false", "candidateCanReject: false", "candidateCanDelete: false"]) {
  if (!status.includes(phrase)) failures.push(`Status integration missing ${phrase}`);
}

const wiring = fs.existsSync("packages/backend/src/n05/document-server-wiring.ts")
  ? fs.readFileSync("packages/backend/src/n05/document-server-wiring.ts", "utf8")
  : "";

for (const phrase of ["/api/candidate/documents/upload-url", "/api/founder/documents/review", "service_role exposed"]) {
  if (!wiring.includes(phrase)) failures.push(`Server wiring missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n05-document-04b-validation.v1",
  module: "N05-DOCUMENT-04B",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n05-document-04b-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-04B validation passed.");