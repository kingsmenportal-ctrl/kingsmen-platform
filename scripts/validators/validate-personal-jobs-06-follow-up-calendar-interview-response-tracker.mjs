import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker-proof.json";
const validationPath = "reports/validation/personal-jobs-06-follow-up-calendar-interview-response-tracker-latest.json";

const requiredFiles = [
  "apps/web/src/app/personal-job-desk/follow-up/page.tsx",
  "apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx",
  "docs/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker.md",
  "manifests/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker.json",
  "packages/contracts/src/personal-jobs-06-follow-up-calendar-interview-response-tracker.ts",
  "scripts/proof/prove-personal-jobs-06-follow-up-calendar-interview-response-tracker.mjs",
  "scripts/validators/validate-personal-jobs-06-follow-up-calendar-interview-response-tracker.mjs",
  proofPath
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });

const missingFiles = requiredFiles.filter((file) => !exists(file));
const proof = exists(proofPath) ? readJson(proofPath) : null;
const failedChecks = [];

if (missingFiles.length > 0) failedChecks.push({ name: "missing-required-files", detail: missingFiles.join(", ") });
if (!proof) failedChecks.push({ name: "proof-report-missing", detail: proofPath });
if (proof && proof.passed !== true) failedChecks.push({ name: "proof-report-not-passed", detail: String(proof.passed) });
if (proof && proof.productionReady !== false) failedChecks.push({ name: "production-claim-blocker", detail: "PERSONAL-JOBS-06 must not claim production readiness" });
if (proof && proof.deployedToOracle !== false) failedChecks.push({ name: "oracle-claim-blocker", detail: "PERSONAL-JOBS-06 must not claim Oracle deployment" });
if (proof && proof.sendsApplications !== false) failedChecks.push({ name: "send-application-boundary", detail: "PERSONAL-JOBS-06 must remain local-only" });
if (proof && proof.sendsEmail !== false) failedChecks.push({ name: "send-message-boundary", detail: "PERSONAL-JOBS-06 must not send messages" });
if (proof && proof.touchesExternalCalendar !== false) failedChecks.push({ name: "external-calendar-boundary", detail: "PERSONAL-JOBS-06 must not sync external calendars" });

const passed = failedChecks.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-06 - Follow-Up Calendar / Interview Prep / Response Tracker",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: requiredFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "Follow-up records are local planning rows only; actual follow-up remains manual.",
    "Interview preparation notes must remain truthful and must not invent experience, qualifications, certificates, references, or recruiter replies.",
    "This module does not send applications, messages, payments, or external calendar events."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/follow-up",
  reads_local_storage_key: "kingsmen.personalJobs05.submissions.v1",
  writes_local_storage_key: "kingsmen.personalJobs06.followUps.v1",
  proof: proofPath,
  next_action: passed ? "Commit PERSONAL-JOBS-06 tracked files only." : "Repair PERSONAL-JOBS-06 before moving forward."
};

fs.writeFileSync(path.join(root, validationPath), JSON.stringify(validation, null, 2));
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);