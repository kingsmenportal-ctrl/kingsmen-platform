import fs from "node:fs";

const required = [
  "docs/n05/N05_DOCUMENT_04_REPOSITORY_UPLOAD_GATEWAY_API_ROUTE.md",
  "manifests/n05/n05-document-04-repository-upload-gateway-api-route.json",
  "packages/backend/src/n05/document-repository.ts",
  "packages/backend/src/n05/upload-gateway.ts",
  "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  "apps/web/src/app/api/candidate/documents/status/route.ts",
  "scripts/validators/validate-n05-document-04.mjs",
  "reports/n05/n05-document-03-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n05/n05-document-04-repository-upload-gateway-api-route.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.documentRepositoryBuilt !== true) failures.push("documentRepositoryBuilt must be true");
if (manifest.signedUploadGatewayBuilt !== true) failures.push("signedUploadGatewayBuilt must be true");
if (manifest.signedReadGatewayBuilt !== true) failures.push("signedReadGatewayBuilt must be true");
if (manifest.serviceRoleNotExposed !== true) failures.push("serviceRoleNotExposed must be true");

const report = {
  schema: "kingsmen.n05-document-04-proof.v1",
  module: "N05-DOCUMENT-04 - Repository / Upload Gateway / API Route Boundary",
  status: failures.length === 0 ? "N05_DOCUMENT_REPOSITORY_UPLOAD_GATEWAY_API_ROUTE_PROVEN" : "N05_DOCUMENT_REPOSITORY_UPLOAD_GATEWAY_API_ROUTE_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  documentRepositoryBuilt: manifest.documentRepositoryBuilt === true,
  signedUploadGatewayBuilt: manifest.signedUploadGatewayBuilt === true,
  signedReadGatewayBuilt: manifest.signedReadGatewayBuilt === true,
  candidateDocumentApiBuilt: manifest.candidateDocumentApiBuilt === true,
  serviceRoleNotExposed: manifest.serviceRoleNotExposed === true,
  candidateOwnDocumentOnly: manifest.candidateOwnDocumentOnly === true,
  candidateCannotVerifyRejectDelete: manifest.candidateCannotVerifyRejectDelete === true,
  rawPublicUrlBlocked: manifest.rawPublicUrlBlocked === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N05-DOCUMENT-04B - review methods, server wiring, and document status integration."
    : "Repair N05-DOCUMENT-04 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n05", { recursive: true });
fs.writeFileSync("reports/n05/n05-document-04-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-04 proof passed.");