import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder-proof.json";
const validationPath = "reports/validation/personal-jobs-12-real-job-search-source-runner-verified-lead-finder-latest.json";

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

const requiredFiles = [
  "apps/web/src/app/personal-job-desk/source-runner/page.tsx",
  "apps/web/src/app/personal-job-desk/source-runner/SourceRunnerClient.tsx",
  "docs/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder.md",
  "manifests/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder.json",
  "packages/contracts/src/personal-jobs-12-real-job-search-source-runner-verified-lead-finder.ts",
  "scripts/proof/prove-personal-jobs-12-real-job-search-source-runner-verified-lead-finder.mjs",
  "scripts/validators/validate-personal-jobs-12-real-job-search-source-runner-verified-lead-finder.mjs",
  proofPath
];

const missingFiles = requiredFiles.filter((file) => !exists(file));
const failedChecks = [];

if (missingFiles.length > 0) failedChecks.push({ name: "missing-required-files", detail: missingFiles.join(", ") });

const proof = exists(proofPath) ? readJson(proofPath) : null;

if (!proof) failedChecks.push({ name: "proof-report-missing", detail: proofPath });
if (proof && proof.passed !== true) failedChecks.push({ name: "proof-report-not-passed", detail: String(proof.passed) });
if (proof && proof.productionReady !== false) failedChecks.push({ name: "production-claim-blocker", detail: "must remain false" });
if (proof && proof.canClaimProduction !== false) failedChecks.push({ name: "production-claim-capability-blocker", detail: "must remain false" });
if (proof && proof.deployedToOracle !== false) failedChecks.push({ name: "oracle-claim-blocker", detail: "must remain false" });
if (proof && proof.startsDocker !== false) failedChecks.push({ name: "docker-boundary", detail: "must remain false" });
if (proof && proof.usesSecrets !== false) failedChecks.push({ name: "secret-boundary", detail: "must remain false" });
if (proof && proof.runsBackgroundBots !== false) failedChecks.push({ name: "bot-boundary", detail: "must remain false" });
if (proof && proof.extractsWebsiteContentAutomatically !== false) failedChecks.push({ name: "auto-extract-boundary", detail: "must remain false" });
if (proof && proof.autoSubmitsApplications !== false) failedChecks.push({ name: "auto-submit-boundary", detail: "must remain false" });
if (proof && proof.sendsApplications !== false) failedChecks.push({ name: "application-send-boundary", detail: "must remain false" });
if (proof && proof.sendsEmail !== false) failedChecks.push({ name: "email-send-boundary", detail: "must remain false" });
if (proof && proof.sendsWhatsApp !== false) failedChecks.push({ name: "whatsapp-send-boundary", detail: "must remain false" });
if (proof && proof.touchesPayments !== false) failedChecks.push({ name: "payment-boundary", detail: "must remain false" });
if (proof && proof.touchesExternalCalendar !== false) failedChecks.push({ name: "external-calendar-boundary", detail: "must remain false" });
if (proof && proof.contactsEmployers !== false) failedChecks.push({ name: "employer-contact-boundary", detail: "must remain false" });
if (proof && proof.opensUserControlledSourcePages !== true) failedChecks.push({ name: "source-open-runner", detail: "must open user-controlled source pages" });
if (proof && proof.capturesVerifiedLeadsToPersonalJobs02 !== true) failedChecks.push({ name: "pj02-lead-capture", detail: "must capture leads into PJ02" });
if (proof && (!Array.isArray(proof.writesLocalStorageKeys) || !proof.writesLocalStorageKeys.includes("kingsmen.personalJobs12.sourceRunnerSessions.v1"))) failedChecks.push({ name: "session-write-key", detail: "missing PJ12 session key" });
if (proof && (!Array.isArray(proof.writesLocalStorageKeys) || !proof.writesLocalStorageKeys.includes("kingsmen.personalJobs02.externalLeads.v1"))) failedChecks.push({ name: "pj02-write-key", detail: "missing PJ02 target key" });

const passed = failedChecks.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-12 - Real Job Search Source Runner / Verified Lead Finder",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: requiredFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "This is local UI and browser localStorage only.",
    "This opens source pages under user control only.",
    "Captured leads still require human review before applications.",
    "This does not prove production readiness.",
    "This does not send applications, email, WhatsApp, payments, employer contact, background bots, or external calendar events."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/source-runner",
  proof: proofPath,
  next_action: passed ? "Commit PERSONAL-JOBS-12 tracked files only." : "Repair PERSONAL-JOBS-12 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(path.join(root, validationPath), JSON.stringify(validation, null, 2));
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);