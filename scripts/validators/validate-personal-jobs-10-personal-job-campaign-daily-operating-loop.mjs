import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-10-personal-job-campaign-daily-operating-loop-proof.json";
const validationPath = "reports/validation/personal-jobs-10-personal-job-campaign-daily-operating-loop-latest.json";

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

const requiredFiles = [
  "apps/web/src/app/personal-job-desk/daily-loop/page.tsx",
  "apps/web/src/app/personal-job-desk/daily-loop/DailyLoopClient.tsx",
  "docs/personal-jobs/personal-jobs-10-personal-job-campaign-daily-operating-loop.md",
  "manifests/personal-jobs/personal-jobs-10-personal-job-campaign-daily-operating-loop.json",
  "packages/contracts/src/personal-jobs-10-personal-job-campaign-daily-operating-loop.ts",
  "scripts/proof/prove-personal-jobs-10-personal-job-campaign-daily-operating-loop.mjs",
  "scripts/validators/validate-personal-jobs-10-personal-job-campaign-daily-operating-loop.mjs",
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
if (proof && proof.sendsApplications !== false) failedChecks.push({ name: "application-send-boundary", detail: "must remain false" });
if (proof && proof.sendsEmail !== false) failedChecks.push({ name: "email-send-boundary", detail: "must remain false" });
if (proof && proof.sendsWhatsApp !== false) failedChecks.push({ name: "whatsapp-send-boundary", detail: "must remain false" });
if (proof && proof.touchesPayments !== false) failedChecks.push({ name: "payment-boundary", detail: "must remain false" });
if (proof && proof.touchesExternalCalendar !== false) failedChecks.push({ name: "external-calendar-boundary", detail: "must remain false" });
if (proof && proof.contactsEmployers !== false) failedChecks.push({ name: "employer-contact-boundary", detail: "must remain false" });
if (proof && (!Array.isArray(proof.readsLocalStorageKeys) || proof.readsLocalStorageKeys.length !== 7)) failedChecks.push({ name: "read-key-count", detail: "must read seven prior local storage keys" });
if (proof && proof.writesLocalStorageKey !== "kingsmen.personalJobs10.dailyOperatingLoop.v1") failedChecks.push({ name: "write-key", detail: "write key mismatch" });

const passed = failedChecks.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-10 - Personal Job Campaign Daily Operating Loop",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: requiredFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "This is local UI and browser localStorage only.",
    "This does not prove production readiness.",
    "This does not send applications, email, WhatsApp, payments, employer contact, or external calendar events."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/daily-loop",
  proof: proofPath,
  next_action: passed ? "Commit PERSONAL-JOBS-10 tracked files only." : "Repair PERSONAL-JOBS-10 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(path.join(root, validationPath), JSON.stringify(validation, null, 2));
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);