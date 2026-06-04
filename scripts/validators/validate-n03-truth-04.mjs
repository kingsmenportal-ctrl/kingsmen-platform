import fs from "node:fs";

const requiredFiles = [
  "docs/n03/N03_TRUTH_04_POPIA_EVIDENCE_SOURCE_AUTHORITY.md",
  "manifests/n03/n03-truth-04-popia-evidence-source-authority.json",
  "packages/contracts/src/n03-popia-access-log-contract.ts",
  "packages/contracts/src/n03-evidence-immutability-contract.ts",
  "packages/contracts/src/n03-source-authority-contract.ts",
  "packages/backend/src/n03/popia-access-log-policy.ts",
  "packages/backend/src/n03/evidence-immutability-policy.ts",
  "packages/backend/src/n03/source-authority-policy.ts",
  "packages/db/src/n03-popia-evidence-source-policy.ts",
  "reports/n03/n03-truth-03-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n03/n03-truth-04-popia-evidence-source-authority.json")
  ? JSON.parse(fs.readFileSync("manifests/n03/n03-truth-04-popia-evidence-source-authority.json", "utf8"))
  : {};

for (const key of [
  "requiresN03Truth03",
  "popiaAccessLogBuilt",
  "evidenceImmutableAppendFirst",
  "sourceAuthorityRegistryBuilt",
  "sourceConfidenceBandsRequired",
  "officialInstructionsRequireVerifiedSource",
  "candidateDataAccessMustBeLogged",
  "evidenceDeleteBlocked",
  "silentOverwriteBlocked"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const evidence = fs.existsSync("packages/backend/src/n03/evidence-immutability-policy.ts")
  ? fs.readFileSync("packages/backend/src/n03/evidence-immutability-policy.ts", "utf8")
  : "";

for (const phrase of ["delete_evidence", "overwrite_evidence", "append correction evidence", "canDelete: false", "canOverwrite: false"]) {
  if (!evidence.includes(phrase)) failures.push(`Evidence policy missing phrase: ${phrase}`);
}

const source = fs.existsSync("packages/backend/src/n03/source-authority-policy.ts")
  ? fs.readFileSync("packages/backend/src/n03/source-authority-policy.ts", "utf8")
  : "";

for (const phrase of ["official_verified", "Official instruction blocked", "sourceUrl"]) {
  if (!source.includes(phrase)) failures.push(`Source policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n03-truth-04-validation.v1",
  module: "N03-TRUTH-04",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n03-truth-04-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-04 validation passed.");