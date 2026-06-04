import fs from "node:fs";

const required = [
  "docs/n05/N05_DOCUMENT_03_BACKEND_TYPES_SAFETY_STORAGE_SIGNER.md",
  "manifests/n05/n05-document-03-backend-types-safety-storage-signer.json",
  "packages/contracts/src/n05-storage-signer-contract.ts",
  "packages/contracts/src/n05-document-safety-contract.ts",
  "packages/backend/src/n05/document-safety-policy.ts",
  "packages/backend/src/n05/storage-signer-boundary.ts",
  "packages/backend/src/n05/document-own-boundary-policy.ts",
  "packages/db/src/n05-storage-signer-policy.ts",
  "scripts/validators/validate-n05-document-03.mjs",
  "reports/n05/n05-document-02-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n05/n05-document-03-backend-types-safety-storage-signer.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.storageSignerBoundaryBuilt !== true) failures.push("storageSignerBoundaryBuilt must be true");
if (manifest.serviceRoleBackendOnly !== true) failures.push("serviceRoleBackendOnly must be true");
if (manifest.rawPublicUrlBlocked !== true) failures.push("rawPublicUrlBlocked must be true");

const report = {
  schema: "kingsmen.n05-document-03-proof.v1",
  module: "N05-DOCUMENT-03 - Backend Types / Safety Policies / Storage Signer Boundary",
  status: failures.length === 0 ? "N05_DOCUMENT_BACKEND_TYPES_SAFETY_STORAGE_SIGNER_PROVEN" : "N05_DOCUMENT_BACKEND_TYPES_SAFETY_STORAGE_SIGNER_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  signedUploadTypesBuilt: manifest.signedUploadTypesBuilt === true,
  signedReadTypesBuilt: manifest.signedReadTypesBuilt === true,
  storageSignerBoundaryBuilt: manifest.storageSignerBoundaryBuilt === true,
  documentSafetyPolicyBuilt: manifest.documentSafetyPolicyBuilt === true,
  mimeSizeExtensionGuardBuilt: manifest.mimeSizeExtensionGuardBuilt === true,
  candidateOwnDocumentBoundaryBuilt: manifest.candidateOwnDocumentBoundaryBuilt === true,
  serviceRoleBackendOnly: manifest.serviceRoleBackendOnly === true,
  rawPublicUrlBlocked: manifest.rawPublicUrlBlocked === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N05-DOCUMENT-04 - repository, upload gateway, and API route boundary."
    : "Repair N05-DOCUMENT-03 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n05", { recursive: true });
fs.writeFileSync("reports/n05/n05-document-03-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-03 proof passed.");