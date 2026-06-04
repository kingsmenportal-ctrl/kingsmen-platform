import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_11_CLOSEOUT_EVIDENCE_MATRIX_READINESS.md",
  "manifests/n04/n04-candidate-11-closeout-evidence-matrix-readiness.json",
  "packages/contracts/src/n04-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n04/n04-closeout-readiness-policy.ts",
  "reports/n04/n04-closeout-evidence-matrix-latest.json",
  "reports/n04/n04-candidate-11-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const matrix = fs.existsSync("reports/n04/n04-closeout-evidence-matrix-latest.json")
  ? JSON.parse(fs.readFileSync("reports/n04/n04-closeout-evidence-matrix-latest.json", "utf8"))
  : {};

if (matrix.productionReady !== false) failures.push("matrix productionReady must be false");
if (matrix.allPassed !== true) failures.push("matrix allPassed must be true");
if (!Array.isArray(matrix.rows) || matrix.rows.length !== 10) failures.push("matrix must have 10 rows");

const manifest = fs.existsSync("manifests/n04/n04-candidate-11-closeout-evidence-matrix-readiness.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-11-closeout-evidence-matrix-readiness.json", "utf8"))
  : {};

for (const key of [
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

const report = {
  schema: "kingsmen.n04-candidate-11-validation.v1",
  module: "N04-CANDIDATE-11",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-11-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-11 validation passed.");