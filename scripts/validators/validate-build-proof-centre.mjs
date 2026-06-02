#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/build-proof-centre-latest.json");

const requiredFiles = [
  "docs/proof/build-proof-centre.md",
  "manifests/proof/build-proof-centre.json",
  "packages/contracts/src/build-proof-centre.ts",
  "apps/web/src/components/kingsmen/BuildProofStatusCard.tsx",
  "apps/web/src/components/kingsmen/BuildProofCentreShell.tsx",
  "apps/web/src/app/founder/build-proof/page.tsx",
  "scripts/validators/validate-build-proof-centre.mjs",
  "reports/validation/build-proof-centre-latest.json"
];

const proofReports = [
  "reports/validation/merge-foundation-latest.json",
  "reports/validation/creator-normalize-latest.json",
  "reports/creator/creator-doctor-report.json",
  "reports/creator/creator-audit-existing-report.json",
  "reports/creator/creator-action-scaffold-report.json",
  "reports/creator/creator-action-validate-report.json"
];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(rel) {
  return JSON.parse(read(rel));
}

const failures = [];
const warnings = [];
const checked = [];

for (const file of requiredFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty required file: ${file}`);
}

for (const report of proofReports) {
  checked.push(report);
  if (!exists(report)) {
    failures.push(`Missing indexed proof report: ${report}`);
    continue;
  }
  try {
    const parsed = parseJson(report);
    if (parsed.passed !== true) warnings.push(`Indexed report is not passing: ${report}`);
  } catch (error) {
    failures.push(`Could not parse indexed report ${report}: ${error.message}`);
  }
}

if (exists("manifests/proof/build-proof-centre.json")) {
  const manifest = parseJson("manifests/proof/build-proof-centre.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare Oracle Lite impact.");
}

for (const [file, tokens] of [
  ["packages/contracts/src/build-proof-centre.ts", ["KingsmenProofStatus", "KingsmenProofReportSummary", "KINGSMEN_BUILD_PROOF_RULES", "KINGSMEN_INITIAL_PROOF_REPORTS", "isValidatedProof"]],
  ["apps/web/src/app/founder/build-proof/page.tsx", ["BuildProofCentreShell", "productionReady: false", "BATCH 01", "BATCH 02", "CREATOR.2B"]]
]) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 03 - Build Proof Centre",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds founder-facing Build Proof Centre UI shell and proof-report policy.",
  next_action: passed ? "Proceed to BATCH 04 - First Public Website + Free Destiny Map shell or next approved batch." : "Repair Build Proof Centre failures and rerun validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
