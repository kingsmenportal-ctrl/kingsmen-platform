import fs from "node:fs";

const modules = [
  {
    moduleCode: "N05-DOCUMENT-01",
    proofReportPath: "reports/n05/n05-document-01-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-01-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-02",
    proofReportPath: "reports/n05/n05-document-02-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-02-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-03",
    proofReportPath: "reports/n05/n05-document-03-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-03-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-04",
    proofReportPath: "reports/n05/n05-document-04-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-04-validation-latest.json"
  },
  {
    moduleCode: "N05-DOCUMENT-04B",
    proofReportPath: "reports/n05/n05-document-04b-proof-latest.json",
    validationReportPath: "reports/validation/n05-document-04b-validation-latest.json"
  }
];

const required = [
  "docs/n05/N05_DOCUMENT_05_VALIDATOR_MANIFEST_EVIDENCE_MATRIX_CLOSEOUT.md",
  "manifests/n05/n05-document-05-validator-manifest-evidence-matrix-closeout.json",
  "packages/contracts/src/n05-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n05/n05-closeout-readiness-policy.ts",
  "apps/web/src/app/candidate/documents/page.tsx",
  "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  "apps/web/src/app/api/candidate/documents/status/route.ts",
  "apps/web/src/app/api/founder/documents/review/route.ts",
  ...modules.flatMap((row) => [row.proofReportPath, row.validationReportPath])
];

const failures = [];

for (const path of required) {
  if (!fs.existsSync(path)) failures.push(`Missing ${path}`);
}

const manifest = JSON.parse(fs.readFileSync("manifests/n05/n05-document-05-validator-manifest-evidence-matrix-closeout.json", "utf8"));

for (const key of [
  "requiresN05Document01",
  "requiresN05Document02",
  "requiresN05Document03",
  "requiresN05Document04",
  "requiresN05Document04B",
  "evidenceMatrixBuilt",
  "allN05ProofReportsRequired",
  "allN05ValidationReportsRequired",
  "signedUploadReadBoundaryConfirmed",
  "privateStorageConfirmed",
  "rawPublicUrlBlocked",
  "ocrAiAssistiveOnly",
  "candidateCannotVerifyRejectDelete",
  "documentStatusIntegrationConfirmed",
  "handoverToN06RouteUniverse"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const rows = [];

for (const item of modules) {
  if (fs.existsSync(item.proofReportPath) && fs.existsSync(item.validationReportPath)) {
    const proof = JSON.parse(fs.readFileSync(item.proofReportPath, "utf8"));
    const validation = JSON.parse(fs.readFileSync(item.validationReportPath, "utf8"));

    rows.push({
      moduleCode: item.moduleCode,
      proofReportPath: item.proofReportPath,
      validationReportPath: item.validationReportPath,
      passed: proof.passed === true && validation.passed === true,
      productionReady: false
    });

    if (proof.passed !== true) failures.push(`${item.proofReportPath} must pass`);
    if (validation.passed !== true) failures.push(`${item.validationReportPath} must pass`);
    if (proof.productionReady !== false) failures.push(`${item.proofReportPath} productionReady must be false`);
    if (validation.productionReady !== false) failures.push(`${item.validationReportPath} productionReady must be false`);
  }
}

const matrix = {
  schema: "kingsmen.n05-closeout-evidence-matrix.v1",
  productionReady: false,
  rows,
  allPassed: rows.length === 5 && rows.every((row) => row.passed === true),
  signedUploadReadBoundaryConfirmed: manifest.signedUploadReadBoundaryConfirmed === true,
  privateStorageConfirmed: manifest.privateStorageConfirmed === true,
  rawPublicUrlBlocked: manifest.rawPublicUrlBlocked === true,
  ocrAiAssistiveOnly: manifest.ocrAiAssistiveOnly === true,
  candidateCannotVerifyRejectDelete: manifest.candidateCannotVerifyRejectDelete === true,
  documentStatusIntegrationConfirmed: manifest.documentStatusIntegrationConfirmed === true,
  handoverTo: "N06-ROUTE-UNIVERSE",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n05", { recursive: true });
fs.writeFileSync("reports/n05/n05-closeout-evidence-matrix-latest.json", JSON.stringify(matrix, null, 2));

if (matrix.allPassed !== true) failures.push("N05 evidence matrix must include 5 passing rows");

const report = {
  schema: "kingsmen.n05-document-05-proof.v1",
  module: "N05-DOCUMENT-05 - Validator / Manifest / Evidence Matrix / Closeout",
  status: failures.length === 0 ? "N05_DOCUMENT_CLOSEOUT_EVIDENCE_MATRIX_PROVEN" : "N05_DOCUMENT_CLOSEOUT_EVIDENCE_MATRIX_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  evidenceMatrixBuilt: manifest.evidenceMatrixBuilt === true,
  signedUploadReadBoundaryConfirmed: manifest.signedUploadReadBoundaryConfirmed === true,
  privateStorageConfirmed: manifest.privateStorageConfirmed === true,
  rawPublicUrlBlocked: manifest.rawPublicUrlBlocked === true,
  ocrAiAssistiveOnly: manifest.ocrAiAssistiveOnly === true,
  candidateCannotVerifyRejectDelete: manifest.candidateCannotVerifyRejectDelete === true,
  documentStatusIntegrationConfirmed: manifest.documentStatusIntegrationConfirmed === true,
  handoverToN06RouteUniverse: manifest.handoverToN06RouteUniverse === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N06-ROUTE-01 - Route Universe / Application Workbench service overview and readiness engine."
    : "Repair N05-DOCUMENT-05 closeout files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.writeFileSync("reports/n05/n05-document-05-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-05 proof passed.");