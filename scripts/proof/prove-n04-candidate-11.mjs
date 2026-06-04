import fs from "node:fs";

const proofReports = Array.from({ length: 10 }, (_, i) => `reports/n04/n04-candidate-${String(i + 1).padStart(2, "0")}-proof-latest.json`);
const validationReports = Array.from({ length: 10 }, (_, i) => `reports/validation/n04-candidate-${String(i + 1).padStart(2, "0")}-validation-latest.json`);

const required = [
  "docs/n04/N04_CANDIDATE_11_CLOSEOUT_EVIDENCE_MATRIX_READINESS.md",
  "manifests/n04/n04-candidate-11-closeout-evidence-matrix-readiness.json",
  "packages/contracts/src/n04-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n04/n04-closeout-readiness-policy.ts",
  ...proofReports,
  ...validationReports,
  "apps/web/src/app/candidate/dashboard/page.tsx",
  "apps/web/src/app/candidate/mobile/page.tsx",
  "apps/web/src/app/candidate/messages/page.tsx",
  "apps/web/src/app/candidate/support/page.tsx",
  "apps/web/src/app/candidate/finance/page.tsx",
  "apps/web/src/app/candidate/outcomes/page.tsx"
];

const failures = [];

for (const path of required) {
  if (!fs.existsSync(path)) failures.push(`Missing ${path}`);
}

const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-11-closeout-evidence-matrix-readiness.json", "utf8"));

for (const key of [
  "requiresN04Candidate01To10",
  "evidenceMatrixBuilt",
  "candidatePortalPagesPresent",
  "allSixGatesVisibleToAllUsers",
  "emailFirst",
  "whatsappUrgentOnly",
  "smsBackupOnly",
  "candidateCannotSelfVerifyPaidSubmittedOutcome",
  "candidateCannotChangeSourceAuthority",
  "handoverToN05DocumentVault"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const rows = [];

for (let i = 0; i < 10; i++) {
  const proofPath = proofReports[i];
  const validationPath = validationReports[i];

  if (fs.existsSync(proofPath) && fs.existsSync(validationPath)) {
    const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
    const validation = JSON.parse(fs.readFileSync(validationPath, "utf8"));

    rows.push({
      moduleCode: `N04-CANDIDATE-${String(i + 1).padStart(2, "0")}`,
      proofReportPath: proofPath,
      validationReportPath: validationPath,
      passed: proof.passed === true && validation.passed === true,
      productionReady: false
    });

    if (proof.passed !== true) failures.push(`${proofPath} must pass`);
    if (validation.passed !== true) failures.push(`${validationPath} must pass`);
    if (proof.productionReady !== false) failures.push(`${proofPath} productionReady must be false`);
    if (validation.productionReady !== false) failures.push(`${validationPath} productionReady must be false`);
  }
}

const matrix = {
  schema: "kingsmen.n04-closeout-evidence-matrix.v1",
  productionReady: false,
  rows,
  allPassed: rows.length === 10 && rows.every((row) => row.passed === true),
  handoverTo: "N05-DOCUMENT-VAULT",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-closeout-evidence-matrix-latest.json", JSON.stringify(matrix, null, 2));

if (matrix.allPassed !== true) failures.push("N04 evidence matrix must include 10 passing rows");

const report = {
  schema: "kingsmen.n04-candidate-11-proof.v1",
  module: "N04-CANDIDATE-11 - N04 Closeout / Evidence Matrix / Readiness Gate",
  status: failures.length === 0 ? "N04_CLOSEOUT_EVIDENCE_MATRIX_READINESS_PROVEN" : "N04_CLOSEOUT_EVIDENCE_MATRIX_READINESS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  evidenceMatrixBuilt: manifest.evidenceMatrixBuilt === true,
  candidatePortalPagesPresent: manifest.candidatePortalPagesPresent === true,
  allSixGatesVisibleToAllUsers: manifest.allSixGatesVisibleToAllUsers === true,
  emailFirst: manifest.emailFirst === true,
  whatsappUrgentOnly: manifest.whatsappUrgentOnly === true,
  smsBackupOnly: manifest.smsBackupOnly === true,
  candidateCannotSelfVerifyPaidSubmittedOutcome: manifest.candidateCannotSelfVerifyPaidSubmittedOutcome === true,
  candidateCannotChangeSourceAuthority: manifest.candidateCannotChangeSourceAuthority === true,
  handoverToN05DocumentVault: manifest.handoverToN05DocumentVault === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N05-DOCUMENT-01 - Document Vault service overview, storage boundary, OCR/fraud/review doctrine."
    : "Repair N04 closeout files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.writeFileSync("reports/n04/n04-candidate-11-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-11 proof passed.");