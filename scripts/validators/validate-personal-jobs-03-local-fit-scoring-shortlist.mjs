import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = path.join(root, "reports", "personal-jobs", "personal-jobs-03-local-fit-scoring-shortlist-proof.json");
const validationPath = path.join(root, "reports", "validation", "personal-jobs-03-local-fit-scoring-shortlist-latest.json");

const filesExpected = [
  "apps/web/src/app/personal-job-desk/shortlist/page.tsx",
  "apps/web/src/app/personal-job-desk/shortlist/ShortlistDecisionClient.tsx",
  "docs/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.md",
  "manifests/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.json",
  "packages/contracts/src/personal-jobs-03-local-fit-scoring-shortlist.ts",
  "scripts/proof/prove-personal-jobs-03-local-fit-scoring-shortlist.mjs",
  "scripts/validators/validate-personal-jobs-03-local-fit-scoring-shortlist.mjs",
  "reports/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist-proof.json"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const failedChecks = [];

for (const file of filesExpected) {
  if (!exists(file)) failedChecks.push({ name: `expected-file:${file}`, passed: false, detail: file });
}

let proof = {};

try {
  proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
} catch (error) {
  failedChecks.push({ name: "proof-readable", passed: false, detail: error.message });
}

if (proof.status !== "PERSONAL_JOBS_03_LOCAL_FIT_SCORING_SHORTLIST_PROVEN") {
  failedChecks.push({ name: "proof-status", passed: false, detail: proof.status ?? "missing" });
}

if (proof.passed !== true) {
  failedChecks.push({ name: "proof-passed", passed: false, detail: String(proof.passed) });
}

if (Array.isArray(proof.failed) && proof.failed.length > 0) {
  failedChecks.push({ name: "proof-no-failed-checks", passed: false, detail: `failed=${proof.failed.length}` });
}

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-03 - Local Fit Scoring / Shortlist Decision Desk",
  status: failedChecks.length === 0 ? "VALIDATED" : "FAILED",
  passed: failedChecks.length === 0,
  generated_at: new Date().toISOString(),
  files_checked: filesExpected.length,
  missing_files: filesExpected.filter((file) => !exists(file)),
  failed_checks: failedChecks,
  warnings: [
    "Shortlist scoring is local and heuristic; final application decisions still require human review.",
    "This does not send applications or messages; it only ranks locally captured leads."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/shortlist",
  reads_local_storage_key: "kingsmen.personalJobs02.externalLeads.v1",
  writes_local_storage_key: "kingsmen.personalJobs03.shortlist.v1",
  proof: "reports/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist-proof.json",
  next_action: failedChecks.length === 0
    ? "Commit PERSONAL-JOBS-03 tracked files only."
    : "Repair PERSONAL-JOBS-03 before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!report.passed) process.exit(1);
