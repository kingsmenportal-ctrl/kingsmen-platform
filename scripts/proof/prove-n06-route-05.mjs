import fs from "node:fs";

const modules = [
  {
    moduleCode: "N06-ROUTE-01",
    proofReportPath: "reports/n06/n06-route-01-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-01-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-02",
    proofReportPath: "reports/n06/n06-route-02-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-02-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-03",
    proofReportPath: "reports/n06/n06-route-03-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-03-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-04",
    proofReportPath: "reports/n06/n06-route-04-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-04-validation-latest.json"
  },
  {
    moduleCode: "N06-ROUTE-04B",
    proofReportPath: "reports/n06/n06-route-04b-proof-latest.json",
    validationReportPath: "reports/validation/n06-route-04b-validation-latest.json"
  }
];

const required = [
  "docs/n06/N06_ROUTE_05_VALIDATOR_DOCS_MANIFEST_EVIDENCE_MATRIX_CLOSEOUT.md",
  "manifests/n06/n06-route-05-validator-docs-manifest-evidence-matrix-closeout.json",
  "packages/contracts/src/n06-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n06/n06-closeout-readiness-policy.ts",
  "apps/web/src/app/candidate/workbench/page.tsx",
  ...modules.flatMap((row) => [row.proofReportPath, row.validationReportPath])
];

const failures = [];

for (const path of required) {
  if (!fs.existsSync(path)) failures.push(`Missing ${path}`);
}

const manifest = JSON.parse(fs.readFileSync("manifests/n06/n06-route-05-validator-docs-manifest-evidence-matrix-closeout.json", "utf8"));

for (const key of [
  "requiresN06Route01",
  "requiresN06Route02",
  "requiresN06Route03",
  "requiresN06Route04",
  "requiresN06Route04B",
  "evidenceMatrixBuilt",
  "allN06ProofReportsRequired",
  "allN06ValidationReportsRequired",
  "sixGateWorkbenchConfirmed",
  "caoParentChildRuleConfirmed",
  "sourceConfidenceGateConfirmed",
  "readinessScoringConfirmed",
  "choiceOptimizerConfirmed",
  "candidateSafeWorkbenchPortalConfirmed",
  "handoverToN07AirtableSync"
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
  schema: "kingsmen.n06-closeout-evidence-matrix.v1",
  productionReady: false,
  rows,
  allPassed: rows.length === 5 && rows.every((row) => row.passed === true),
  sixGateWorkbenchConfirmed: manifest.sixGateWorkbenchConfirmed === true,
  caoParentChildRuleConfirmed: manifest.caoParentChildRuleConfirmed === true,
  sourceConfidenceGateConfirmed: manifest.sourceConfidenceGateConfirmed === true,
  readinessScoringConfirmed: manifest.readinessScoringConfirmed === true,
  choiceOptimizerConfirmed: manifest.choiceOptimizerConfirmed === true,
  candidateSafeWorkbenchPortalConfirmed: manifest.candidateSafeWorkbenchPortalConfirmed === true,
  handoverTo: "N07-AIRTABLE-SYNC",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n06", { recursive: true });
fs.writeFileSync("reports/n06/n06-closeout-evidence-matrix-latest.json", JSON.stringify(matrix, null, 2));

if (matrix.allPassed !== true) failures.push("N06 evidence matrix must include 5 passing rows");

const report = {
  schema: "kingsmen.n06-route-05-proof.v1",
  module: "N06-ROUTE-05 - Validator / Docs / Manifest / Evidence Matrix / Closeout",
  status: failures.length === 0 ? "N06_ROUTE_CLOSEOUT_EVIDENCE_MATRIX_PROVEN" : "N06_ROUTE_CLOSEOUT_EVIDENCE_MATRIX_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  evidenceMatrixBuilt: manifest.evidenceMatrixBuilt === true,
  sixGateWorkbenchConfirmed: manifest.sixGateWorkbenchConfirmed === true,
  caoParentChildRuleConfirmed: manifest.caoParentChildRuleConfirmed === true,
  sourceConfidenceGateConfirmed: manifest.sourceConfidenceGateConfirmed === true,
  readinessScoringConfirmed: manifest.readinessScoringConfirmed === true,
  choiceOptimizerConfirmed: manifest.choiceOptimizerConfirmed === true,
  candidateSafeWorkbenchPortalConfirmed: manifest.candidateSafeWorkbenchPortalConfirmed === true,
  handoverToN07AirtableSync: manifest.handoverToN07AirtableSync === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N07-AIRTABLE-01 - Airtable mirror boundary / async sync doctrine / provider proof gate."
    : "Repair N06-ROUTE-05 closeout files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.writeFileSync("reports/n06/n06-route-05-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-05 proof passed.");