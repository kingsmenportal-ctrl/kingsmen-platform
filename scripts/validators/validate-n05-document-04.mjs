import fs from "node:fs";

const requiredFiles = [
  "docs/n05/N05_DOCUMENT_04_REPOSITORY_UPLOAD_GATEWAY_API_ROUTE.md",
  "manifests/n05/n05-document-04-repository-upload-gateway-api-route.json",
  "packages/backend/src/n05/document-repository.ts",
  "packages/backend/src/n05/upload-gateway.ts",
  "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  "apps/web/src/app/api/candidate/documents/status/route.ts",
  "reports/n05/n05-document-03-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n05/n05-document-04-repository-upload-gateway-api-route.json")
  ? JSON.parse(fs.readFileSync("manifests/n05/n05-document-04-repository-upload-gateway-api-route.json", "utf8"))
  : {};

for (const key of [
  "requiresN05Document03",
  "documentRepositoryBuilt",
  "signedUploadGatewayBuilt",
  "signedReadGatewayBuilt",
  "candidateDocumentApiBuilt",
  "serviceRoleNotExposed",
  "candidateOwnDocumentOnly",
  "candidateCannotVerifyRejectDelete",
  "rawPublicUrlBlocked"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const routes = [
  "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  "apps/web/src/app/api/candidate/documents/status/route.ts"
];

for (const route of routes) {
  const content = fs.existsSync(route) ? fs.readFileSync(route, "utf8") : "";
  for (const phrase of ["productionReady: false", "serviceRoleVisibleToBrowser: false", "rawPublicUrlAllowed: false"]) {
    if (!content.includes(phrase)) failures.push(`${route} missing ${phrase}`);
  }
}

const status = fs.existsSync("apps/web/src/app/api/candidate/documents/status/route.ts")
  ? fs.readFileSync("apps/web/src/app/api/candidate/documents/status/route.ts", "utf8")
  : "";

for (const phrase of ["candidateCanVerify: false", "candidateCanReject: false", "candidateCanDelete: false"]) {
  if (!status.includes(phrase)) failures.push(`Status route missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n05-document-04-validation.v1",
  module: "N05-DOCUMENT-04",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n05-document-04-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-04 validation passed.");