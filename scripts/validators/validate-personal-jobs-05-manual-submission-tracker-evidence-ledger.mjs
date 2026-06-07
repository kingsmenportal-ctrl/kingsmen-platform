import fs from "fs";
import path from "path";

const root = process.cwd();

const moduleName = "PERSONAL-JOBS-05 - Manual Application Submission Tracker / Evidence Ledger";

const expectedFiles = [
  "apps/web/src/app/personal-job-desk/submissions/page.tsx",
  "apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx",
  "docs/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger.md",
  "manifests/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger.json",
  "packages/contracts/src/personal-jobs-05-manual-submission-tracker-evidence-ledger.ts",
  "scripts/proof/prove-personal-jobs-05-manual-submission-tracker-evidence-ledger.mjs",
  "scripts/validators/validate-personal-jobs-05-manual-submission-tracker-evidence-ledger.mjs",
  "reports/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger-proof.json"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

const missing = expectedFiles.filter((file) => !exists(file));
const proofPath = "reports/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger-proof.json";

let proof = null;
let proofPassed = false;

if (exists(proofPath)) {
  proof = readJson(proofPath);
  proofPassed = proof.passed === true;
}

const failedChecks = [];

if (missing.length > 0) {
  failedChecks.push({
    name: "missing-files",
    detail: missing.join(", ")
  });
}

if (!proofPassed) {
  failedChecks.push({
    name: "proof-not-passed",
    detail: proof ? proof.status : "proof file missing"
  });
}

if (proof && proof.productionReady !== false) {
  failedChecks.push({
    name: "production-claim-not-allowed",
    detail: "PERSONAL-JOBS-05 must remain non-production"
  });
}

if (proof && proof.deployedToOracle !== false) {
  failedChecks.push({
    name: "oracle-claim-not-allowed",
    detail: "PERSONAL-JOBS-05 is local-only"
  });
}

if (proof && proof.sendsApplications !== false) {
  failedChecks.push({
    name: "send-claim-not-allowed",
    detail: "PERSONAL-JOBS-05 must not send applications"
  });
}

const report = {
  schema: "kingsmen.validation-report.v1",
  module: moduleName,
  status: failedChecks.length === 0 ? "VALIDATED" : "FAILED",
  passed: failedChecks.length === 0,
  generated_at: new Date().toISOString(),
  files_checked: expectedFiles.length,
  missing_files: missing,
  failed_checks: failedChecks,
  warnings: [
    "Submission records are local evidence rows only; actual applications require human action.",
    "This module does not send applications, emails, WhatsApps, payments, or portal submissions.",
    "Proof references must be truthful and should point to real screenshots, confirmation numbers, or records."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/submissions",
  reads_local_storage_key: "kingsmen.personalJobs04.applyPacks.v1",
  writes_local_storage_key: "kingsmen.personalJobs05.submissions.v1",
  proof: proofPath,
  next_action: failedChecks.length === 0
    ? "Commit PERSONAL-JOBS-05 tracked files only."
    : "Repair PERSONAL-JOBS-05 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/validation/personal-jobs-05-manual-submission-tracker-evidence-ledger-latest.json"),
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
