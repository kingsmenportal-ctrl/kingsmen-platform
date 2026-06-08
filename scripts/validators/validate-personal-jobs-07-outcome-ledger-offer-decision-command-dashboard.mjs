import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard-proof.json";
const validationPath = "reports/validation/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard-latest.json";

const requiredFiles = [
  "apps/web/src/app/personal-job-desk/outcomes/page.tsx",
  "apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx",
  "docs/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.md",
  "manifests/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.json",
  "packages/contracts/src/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.ts",
  "scripts/proof/prove-personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.mjs",
  "scripts/validators/validate-personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.mjs",
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
if (proof && proof.productionReady !== false) failedChecks.push({ name: "production-claim-blocker", detail: "PERSONAL-JOBS-07 must not claim production readiness" });
if (proof && proof.deployedToOracle !== false) failedChecks.push({ name: "oracle-claim-blocker", detail: "PERSONAL-JOBS-07 must not claim Oracle deployment" });
if (proof && proof.sendsApplications !== false) failedChecks.push({ name: "send-application-boundary", detail: "PERSONAL-JOBS-07 must remain local-only" });
if (proof && proof.sendsEmail !== false) failedChecks.push({ name: "send-message-boundary", detail: "PERSONAL-JOBS-07 must not send messages" });
if (proof && proof.touchesExternalCalendar !== false) failedChecks.push({ name: "external-calendar-boundary", detail: "PERSONAL-JOBS-07 must not sync external calendars" });
if (proof && proof.contactsEmployers !== false) failedChecks.push({ name: "employer-contact-boundary", detail: "PERSONAL-JOBS-07 must not contact employers" });

const passed = failedChecks.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-07 - Outcome Ledger / Offer Decision / Job Search Command Dashboard",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: requiredFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "Outcome records are local planning rows only; real employment decisions require human review.",
    "Offer decisions must verify written proof, employer legitimacy, salary, location, transport, contract, and safety.",
    "This module does not send applications, messages, payments, employer contact, or external calendar events."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/outcomes",
  reads_local_storage_keys: [
    "kingsmen.personalJobs02.externalLeads.v1",
    "kingsmen.personalJobs03.shortlist.v1",
    "kingsmen.personalJobs04.applyPacks.v1",
    "kingsmen.personalJobs05.submissions.v1",
    "kingsmen.personalJobs06.followUps.v1"
  ],
  writes_local_storage_key: "kingsmen.personalJobs07.outcomeLedger.v1",
  proof: proofPath,
  next_action: passed ? "Commit PERSONAL-JOBS-07 tracked files only." : "Repair PERSONAL-JOBS-07 before moving forward."
};

fs.writeFileSync(path.join(root, validationPath), JSON.stringify(validation, null, 2));
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);