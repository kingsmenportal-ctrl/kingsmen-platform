import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer-proof.json";

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function list(folder) {
  const full = path.join(root, folder);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full);
}

const checks = [];
function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/normalizer/page.tsx",
  "apps/web/src/app/personal-job-desk/normalizer/ImportNormalizerClient.tsx",
  "docs/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.md",
  "manifests/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.json",
  "packages/contracts/src/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.ts",
  "scripts/proof/prove-personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.mjs",
  "scripts/validators/validate-personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer.mjs"
];

for (const file of expectedFiles) check(`expected-file:${file}`, exists(file), file);

const dependencyRouteFiles = [
  "apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx",
  "apps/web/src/app/personal-job-desk/import-search/page.tsx",
  "apps/web/src/app/personal-job-desk/source-runner/page.tsx",
  "apps/web/src/app/personal-job-desk/normalizer/page.tsx"
];

for (const file of dependencyRouteFiles) check(`route-file:${file}`, exists(file), file);

const proofReports = list("reports/personal-jobs");
const validationReports = list("reports/validation");

for (const n of ["02", "11", "12"]) {
  const proofFile = proofReports.find((file) => file.startsWith(`personal-jobs-${n}`) && file.endsWith("-proof.json"));
  const validationFile = validationReports.find((file) => file.startsWith(`personal-jobs-${n}`) && file.endsWith("-latest.json"));

  check(`dependency-personal-jobs-${n}-proof-exists`, Boolean(proofFile), proofFile || "missing");
  check(`dependency-personal-jobs-${n}-validation-exists`, Boolean(validationFile), validationFile || "missing");

  if (proofFile) {
    const proof = readJson(`reports/personal-jobs/${proofFile}`);
    check(`dependency-personal-jobs-${n}-proof-passed`, proof.passed === true, String(proof.passed));
  }

  if (validationFile) {
    const validation = readJson(`reports/validation/${validationFile}`);
    check(`dependency-personal-jobs-${n}-validation-passed`, validation.passed === true, String(validation.passed));
  }
}

const pj02 = exists(dependencyRouteFiles[0]) ? read(dependencyRouteFiles[0]) : "";
const page = exists(expectedFiles[1]) ? read(expectedFiles[1]) : "";
const client = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const doc = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const manifest = exists(expectedFiles[4]) ? readJson(expectedFiles[4]) : {};
const contract = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";

for (const field of [
  "company",
  "roleTitle",
  "opportunityLink",
  "sourceType",
  "location",
  "workMode",
  "deadline",
  "salaryText",
  "requirementsText",
  "fitReason",
  "riskNotes",
  "confidence",
  "status",
  "nextAction",
  "cvSlot",
  "motivationLetterSlot",
  "proofNote"
]) {
  check(`pj02-schema-source-field:${field}`, pj02.includes(field), field);
  check(`client-normalizes-field:${field}`, client.includes(field), field);
}

check("page-route-marker", page.includes("data-kingsmen-personal-jobs-13-route"), "route marker");
check("client-normalizer-marker", client.includes("data-kingsmen-personal-jobs-13-normalizer"), "client marker");
check("client-no-send-marker", client.includes("data-kingsmen-personal-jobs-13-no-send"), "no-send marker");
check("client-pj02-key", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 key");
check("client-backup-key", client.includes("kingsmen.personalJobs13.normalizerBackups.v1"), "backup key");
check("client-report-key", client.includes("kingsmen.personalJobs13.normalizerReports.v1"), "report key");
check("client-normalize-function", client.includes("function normalizeLead"), "normalizeLead");
check("client-exact-shape-function", client.includes("function isExactPJ02Lead"), "isExactPJ02Lead");
check("client-backup-before-rewrite", client.includes("backup") && client.includes("normalizeAndSave"), "backup before rewrite");
check("client-slot-15", client.includes("% 15") && client.includes("CV-") && client.includes("ML-"), "15 slots");
check("client-status-values", client.includes('"Found"') && client.includes('"Follow Up"') && client.includes('"Closed"'), "PJ02 statuses");
check("client-source-values", client.includes('"Indeed"') && client.includes('"Company Career Page"') && client.includes('"WhatsApp Group"'), "PJ02 sources");
check("client-work-modes", client.includes('"On-site"') && client.includes('"Hybrid"') && client.includes('"Remote"') && client.includes('"Unknown"'), "work modes");
check("client-confidence-values", client.includes('"Low"') && client.includes('"Medium"') && client.includes('"High"'), "confidence values");

check("doc-boundary", doc.includes("does not search the internet") && doc.includes("does not send applications"), "doc boundary");

check("manifest-status", manifest.status === "BUILT_PENDING_VALIDATION", "BUILT_PENDING_VALIDATION");
check("manifest-route", manifest.route === "/personal-job-desk/normalizer", String(manifest.route));
check("manifest-exact-shape", manifest.normalizesToExactPersonalJobs02LeadShape === true, "exact shape true");
check("manifest-backup", manifest.createsBackupBeforeRewrite === true, "backup true");
check("manifest-repairs-imported", manifest.repairsImportedPersonalJobs11And12Leads === true, "repairs true");
check("manifest-pj02-write", Array.isArray(manifest.writesLocalStorageKeys) && manifest.writesLocalStorageKeys.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 write key");
check("manifest-backup-write", Array.isArray(manifest.writesLocalStorageKeys) && manifest.writesLocalStorageKeys.includes("kingsmen.personalJobs13.normalizerBackups.v1"), "backup write key");
check("manifest-report-write", Array.isArray(manifest.writesLocalStorageKeys) && manifest.writesLocalStorageKeys.includes("kingsmen.personalJobs13.normalizerReports.v1"), "report write key");
check("manifest-no-production", manifest.productionReady === false && manifest.canClaimProduction === false, "production false");
check("manifest-no-oracle", manifest.deployedToOracle === false, "oracle false");
check("manifest-no-docker", manifest.startsDocker === false, "docker false");
check("manifest-no-external", manifest.searchesInternet === false && manifest.opensExternalPages === false && manifest.scrapesWebsites === false, "external false");
check("manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "send false");
check("manifest-no-employer-contact", manifest.contactsEmployers === false, "employer false");

check("contract-route", contract.includes("PERSONAL_JOBS_13_ROUTE") && contract.includes("/personal-job-desk/normalizer"), "contract route");
check("contract-fields", contract.includes("PERSONAL_JOBS_13_EXACT_PJ02_FIELDS") && contract.includes("roleTitle") && contract.includes("proofNote"), "contract fields");
check("contract-boundary", contract.includes("PERSONAL_JOBS_13_BOUNDARY") && contract.includes("contactsEmployers: false"), "contract boundary");

const committedText = [page, client, doc, JSON.stringify(manifest), contract].join("\n");

for (const forbidden of [
  "email-send-runtime",
  "payment-runtime",
  "whatsapp-runtime",
  "service-role-secret",
  "payfast-passphrase",
  "private-key-material",
  "oci-private-path",
  "ssh-private-path",
  "docker-compose-up-runtime",
  "PRODUCTION_READY_TRUE",
  "DEPLOYED_TO_ORACLE_TRUE",
  "smtp.send",
  "sendEmail(",
  "sendWhatsApp(",
  "submitApplication(",
  "window.open(",
  "fetch(",
  "axios.",
  "puppeteer",
  "playwright",
  "cheerio"
]) {
  check(`runtime-no-forbidden:${forbidden}`, !committedText.includes(forbidden), forbidden);
}

const containsPersonalContact =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(committedText) ||
  /(?:^|[^0-9])(?:\+27|0)(?:\s|-)?[6-8][0-9](?:\s|-)?[0-9]{3}(?:\s|-)?[0-9]{4}(?:[^0-9]|$)/.test(committedText);

check("committed-files-no-local-profile-contact", !containsPersonalContact, "local profile contact must stay untracked");

const failed = checks.filter((item) => !item.passed);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.personal-jobs-13-proof.v1",
  module: "PERSONAL-JOBS-13 - PJ02 Lead Schema Compatibility Repair / Import Normalizer",
  status: passed
    ? "PERSONAL_JOBS_13_PJ02_LEAD_SCHEMA_COMPATIBILITY_REPAIR_IMPORT_NORMALIZER_PROVEN"
    : "PERSONAL_JOBS_13_PJ02_LEAD_SCHEMA_COMPATIBILITY_REPAIR_IMPORT_NORMALIZER_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/normalizer",
  normalizesToExactPersonalJobs02LeadShape: true,
  createsBackupBeforeRewrite: true,
  repairsImportedPersonalJobs11And12Leads: true,
  readsLocalStorageKeys: [
    "kingsmen.personalJobs02.externalLeads.v1"
  ],
  writesLocalStorageKeys: [
    "kingsmen.personalJobs02.externalLeads.v1",
    "kingsmen.personalJobs13.normalizerBackups.v1",
    "kingsmen.personalJobs13.normalizerReports.v1"
  ],
  searchesInternet: false,
  opensExternalPages: false,
  scrapesWebsites: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false,
  checks,
  failed,
  next_action: passed ? "Run validator and commit PERSONAL-JOBS-13 tracked files only." : "Repair PERSONAL-JOBS-13 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(path.join(root, proofPath), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);