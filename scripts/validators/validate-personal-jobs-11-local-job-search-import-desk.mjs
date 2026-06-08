import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-11-local-job-search-import-desk-proof.json";
const validationPath = "reports/validation/personal-jobs-11-local-job-search-import-desk-latest.json";

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

const requiredFiles = [
  "apps/web/src/app/personal-job-desk/import-search/page.tsx",
  "apps/web/src/app/personal-job-desk/import-search/JobSearchImportClient.tsx",
  "docs/personal-jobs/personal-jobs-11-local-job-search-import-desk.md",
  "manifests/personal-jobs/personal-jobs-11-local-job-search-import-desk.json",
  "packages/contracts/src/personal-jobs-11-local-job-search-import-desk.ts",
  "scripts/proof/prove-personal-jobs-11-local-job-search-import-desk.mjs",
  "scripts/validators/validate-personal-jobs-11-local-job-search-import-desk.mjs",
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
if (proof && proof.searchesInternet !== false) failedChecks.push({ name: "internet-search-boundary", detail: "must remain false" });
if (proof && proof.scrapesWebsites !== false) failedChecks.push({ name: "scraping-boundary", detail: "must remain false" });
if (proof && proof.sendsApplications !== false) failedChecks.push({ name: "application-send-boundary", detail: "must remain false" });
if (proof && proof.sendsEmail !== false) failedChecks.push({ name: "email-send-boundary", detail: "must remain false" });
if (proof && proof.sendsWhatsApp !== false) failedChecks.push({ name: "whatsapp-send-boundary", detail: "must remain false" });
if (proof && proof.touchesPayments !== false) failedChecks.push({ name: "payment-boundary", detail: "must remain false" });
if (proof && proof.touchesExternalCalendar !== false) failedChecks.push({ name: "external-calendar-boundary", detail: "must remain false" });
if (proof && proof.contactsEmployers !== false) failedChecks.push({ name: "employer-contact-boundary", detail: "must remain false" });
if (proof && (!Array.isArray(proof.writesLocalStorageKeys) || !proof.writesLocalStorageKeys.includes("kingsmen.personalJobs11.searchImportBatches.v1"))) failedChecks.push({ name: "history-write-key", detail: "missing PJ11 history key" });
if (proof && (!Array.isArray(proof.writesLocalStorageKeys) || !proof.writesLocalStorageKeys.includes("kingsmen.personalJobs02.externalLeads.v1"))) failedChecks.push({ name: "pj02-write-key", detail: "missing PJ02 target key" });
if (proof && proof.parsesPastedJobSearchText !== true) failedChecks.push({ name: "paste-parser", detail: "must parse pasted text" });
if (proof && proof.extractsUrls !== true) failedChecks.push({ name: "url-extractor", detail: "must extract URLs" });
if (proof && proof.pushesToPersonalJobs02 !== true) failedChecks.push({ name: "pj02-push", detail: "must push to PJ02 local key" });

const passed = failedChecks.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-11 - Local Job Search Import Desk",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: requiredFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "This is local UI and browser localStorage only.",
    "This does not search the internet automatically.",
    "Imported leads are unverified until source review.",
    "This does not prove production readiness.",
    "This does not send applications, email, WhatsApp, payments, employer contact, scraping, or external calendar events."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/import-search",
  proof: proofPath,
  next_action: passed ? "Commit PERSONAL-JOBS-11 tracked files only." : "Repair PERSONAL-JOBS-11 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(path.join(root, validationPath), JSON.stringify(validation, null, 2));
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);