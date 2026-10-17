import fs from "node:fs";

const requiredFiles = [
  "docs/n05/N05_DOCUMENT_03_BACKEND_TYPES_SAFETY_STORAGE_SIGNER.md",
  "manifests/n05/n05-document-03-backend-types-safety-storage-signer.json",
  "packages/contracts/src/n05-storage-signer-contract.ts",
  "packages/contracts/src/n05-document-safety-contract.ts",
  "packages/backend/src/n05/document-safety-policy.ts",
  "packages/backend/src/n05/storage-signer-boundary.ts",
  "packages/backend/src/n05/document-own-boundary-policy.ts",
  "packages/db/src/n05-storage-signer-policy.ts",
  "reports/n05/n05-document-02-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n05/n05-document-03-backend-types-safety-storage-signer.json")
  ? JSON.parse(fs.readFileSync("manifests/n05/n05-document-03-backend-types-safety-storage-signer.json", "utf8"))
  : {};

for (const key of [
  "requiresN05Document02",
  "signedUploadTypesBuilt",
  "signedReadTypesBuilt",
  "storageSignerBoundaryBuilt",
  "documentSafetyPolicyBuilt",
  "mimeSizeExtensionGuardBuilt",
  "candidateOwnDocumentBoundaryBuilt",
  "serviceRoleBackendOnly",
  "rawPublicUrlBlocked"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const safety = fs.existsSync("packages/backend/src/n05/document-safety-policy.ts")
  ? fs.readFileSync("packages/backend/src/n05/document-safety-policy.ts", "utf8")
  : "";

for (const phrase of [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "10 * 1024 * 1024",
  "raw public URL is not allowed",
  "service_role must never be visible",
  "MAX_FILENAME_LENGTH = 255",
  "MIME type and file extension do not match",
  "unsafe filename",
  "Number.isSafeInteger(input.sizeBytes)",
  'input.filename.includes("/")',
  'character.charCodeAt(0) === 127'
]) {
  if (!safety.includes(phrase)) failures.push(`Document safety policy missing phrase: ${phrase}`);
}

const signer = fs.existsSync("packages/backend/src/n05/storage-signer-boundary.ts")
  ? fs.readFileSync("packages/backend/src/n05/storage-signer-boundary.ts", "utf8")
  : "";

for (const phrase of ["SIGNER_RUNTIME_REQUIRED", "15 * 60 * 1000", "10 * 60 * 1000", "candidate can read only own document"]) {
  if (!signer.includes(phrase)) failures.push(`Storage signer missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n05-document-03-validation.v1",
  module: "N05-DOCUMENT-03",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n05-document-03-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-03 validation passed.");