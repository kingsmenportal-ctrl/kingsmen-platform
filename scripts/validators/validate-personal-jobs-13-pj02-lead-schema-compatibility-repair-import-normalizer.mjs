import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer-proof.json";
const validationPath = "reports/validation/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer-latest.json";

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

const requiredFiles = [
  "apps/web/src/app/personal-job-desk/normalizer/page.tsx",
  "apps/web/src/app/personal-job-desk/normalizer/ImportNormalizerClient.tsx",
  "docs/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.md",
  "manifests/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.json",
  "packages/contracts/src/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.ts",
  "scripts/proof/prove-personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.mjs",
  "scripts/validators/validate-personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.mjs",
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
if (proof && proof.normalizesToExactPersonalJobs02LeadShape !== true) failedChecks.push({ name: "exact-pj02-shape", detail: "must normalize to exact PJ02 shape" });
if (proof && proof.createsBackupBeforeRewrite !== true) failedChecks.push({ name: "backup-before-rewrite", detail: "must backup before rewrite" });
if (proof && proof.repairsImportedPersonalJobs11And12Leads !== true) failedChecks.push({ name: "import-repair", detail: "must repair PJ11/PJ12 imported leads" });
if (proof && proof.searchesInternet !== false) failedChecks.push({ name: "internet-boundary", detail: "must remain false" });
if (proof && proof.opensExternalPages !== false) failedChecks.push({ name: "external-open-boundary", detail: "must remain false" });
if (proof && proof.scrapesWebsites !== false) failedChecks.push({ name: "scrape-boundary", detail: "must remain false" });
if (proof && proof.sendsApplications !== false) failedChecks.push({ name: "application-send-boundary", detail: "must remain false" });
if (proof && proof.sendsEmail !== false) failedChecks.push({ name: "email-send-boundary", detail: "must remain false" });
if (proof && proof.sendsWhatsApp !== false) failedChecks.push({ name: "whatsapp-send-boundary", detail: "must remain false" });
if (proof && proof.contactsEmployers !== false) failedChecks.push({ name: "employer-contact-boundary", detail: "must remain false" });

const passed = failedChecks.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-13 - PJ02 Lead Schema Compatibility Repair / Import Normalizer",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_checked: requiredFiles.length,
  missing_files: missingFiles,
  failed_checks: failedChecks,
  warnings: [
    "This is local UI and browser localStorage only.",
    "This rewrites PJ02 localStorage only after creating a local backup.",
    "This does not prove production readiness.",
    "This does not search, scrape, open external pages, send messages, contact employers, or touch payments."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/normalizer",
  proof: proofPath,
  next_action: passed ? "Commit PERSONAL-JOBS-13 tracked files only." : "Repair PERSONAL-JOBS-13 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(path.join(root, validationPath), JSON.stringify(validation, null, 2));
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);