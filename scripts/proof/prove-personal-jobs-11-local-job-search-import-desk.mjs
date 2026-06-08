import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-11-local-job-search-import-desk-proof.json";

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
  "apps/web/src/app/personal-job-desk/import-search/page.tsx",
  "apps/web/src/app/personal-job-desk/import-search/JobSearchImportClient.tsx",
  "docs/personal-jobs/personal-jobs-11-local-job-search-import-desk.md",
  "manifests/personal-jobs/personal-jobs-11-local-job-search-import-desk.json",
  "packages/contracts/src/personal-jobs-11-local-job-search-import-desk.ts",
  "scripts/proof/prove-personal-jobs-11-local-job-search-import-desk.mjs",
  "scripts/validators/validate-personal-jobs-11-local-job-search-import-desk.mjs"
];

for (const file of expectedFiles) check(`expected-file:${file}`, exists(file), file);

const routeFiles = [
  "apps/web/src/app/personal-job-desk/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunities/page.tsx",
  "apps/web/src/app/personal-job-desk/shortlist/page.tsx",
  "apps/web/src/app/personal-job-desk/apply-pack/page.tsx",
  "apps/web/src/app/personal-job-desk/submissions/page.tsx",
  "apps/web/src/app/personal-job-desk/follow-up/page.tsx",
  "apps/web/src/app/personal-job-desk/outcomes/page.tsx",
  "apps/web/src/app/personal-job-desk/real-use-gate/page.tsx",
  "apps/web/src/app/personal-job-desk/daily-loop/page.tsx",
  "apps/web/src/app/personal-job-desk/import-search/page.tsx"
];

for (const file of routeFiles) check(`route-file:${file}`, exists(file), file);

const proofReports = list("reports/personal-jobs");
const validationReports = list("reports/validation");

for (const n of ["01", "02", "03", "04", "05", "06", "07", "08", "10"]) {
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

const gitignore = exists(".gitignore") ? read(".gitignore") : "";
check(
  "gitignore-keeps-local-profile-private",
  gitignore.includes("data/personal-job-desk") || gitignore.includes("personal-candidate.local.json"),
  "local profile ignore pattern"
);

const page = exists(expectedFiles[1]) ? read(expectedFiles[1]) : "";
const client = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const doc = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const manifest = exists(expectedFiles[4]) ? readJson(expectedFiles[4]) : {};
const contract = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";

check("page-route-marker", page.includes("data-kingsmen-personal-jobs-11-route"), "route marker");
check("page-force-dynamic", page.includes('export const dynamic = "force-dynamic"'), "force dynamic");
check("page-local-profile-read", page.includes("personal-candidate.local.json"), "local private profile");
check("client-import-marker", client.includes("data-kingsmen-personal-jobs-11-import-desk"), "client marker");
check("client-no-send-marker", client.includes("data-kingsmen-personal-jobs-11-no-send"), "no-send marker");
check("client-import-history-key", client.includes("kingsmen.personalJobs11.searchImportBatches.v1"), "history key");
check("client-pj02-target-key", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 target key");
check("client-extract-urls", client.includes("function extractUrls"), "extractUrls");
check("client-split-blocks", client.includes("function splitIntoBlocks"), "splitIntoBlocks");
check("client-build-lead", client.includes("function buildLead"), "buildLead");
check("client-parse-import", client.includes("function parseImport"), "parseImport");
check("client-save-batch", client.includes("function saveBatch"), "saveBatch");
check("client-push-to-pj02", client.includes("pushToPj02") && client.includes("importedBy"), "PJ02 push");
check("client-duplicate-risk", client.includes("possible_duplicate") && client.includes("fingerprintLead"), "duplicate risk");
check("client-confidence-bands", client.includes('"high"') && client.includes('"medium"') && client.includes('"low"'), "confidence bands");
check("client-unverified-import", client.includes("unverified_import"), "unverified import");
check("client-local-export", client.includes("function exportJson"), "exportJson");
check("client-linked-pj02", client.includes("/personal-job-desk/opportunities"), "PJ02 link");
check("client-linked-shortlist", client.includes("/personal-job-desk/shortlist"), "shortlist link");
check("client-linked-daily-loop", client.includes("/personal-job-desk/daily-loop"), "daily loop link");
check("client-boundary-text", client.includes("does not search the internet by itself") && client.includes("does not browse"), "boundary text");

check("doc-local-boundary", doc.includes("local-only") && doc.includes("does not search automatically"), "doc boundary");
check("doc-pj02-push", doc.includes("kingsmen.personalJobs02.externalLeads.v1"), "doc PJ02");

check("manifest-status", manifest.status === "BUILT_PENDING_VALIDATION", "BUILT_PENDING_VALIDATION");
check("manifest-route", manifest.route === "/personal-job-desk/import-search", String(manifest.route));
check("manifest-import-history-key", Array.isArray(manifest.writesLocalStorageKeys) && manifest.writesLocalStorageKeys.includes("kingsmen.personalJobs11.searchImportBatches.v1"), "history write key");
check("manifest-pj02-target-key", Array.isArray(manifest.writesLocalStorageKeys) && manifest.writesLocalStorageKeys.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 write key");
check("manifest-parses-text", manifest.parsesPastedJobSearchText === true, "parse true");
check("manifest-extracts-urls", manifest.extractsUrls === true, "URL true");
check("manifest-pushes-pj02", manifest.pushesToPersonalJobs02 === true, "PJ02 true");
check("manifest-no-internet-search", manifest.searchesInternet === false, "internet search false");
check("manifest-no-scrape", manifest.scrapesWebsites === false, "scrape false");
check("manifest-no-production", manifest.productionReady === false && manifest.canClaimProduction === false, "production false");
check("manifest-no-oracle", manifest.deployedToOracle === false, "oracle false");
check("manifest-no-docker", manifest.startsDocker === false, "docker false");
check("manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "send false");
check("manifest-no-payment", manifest.touchesPayments === false, "payment false");
check("manifest-no-calendar", manifest.touchesExternalCalendar === false, "calendar false");
check("manifest-no-employer-contact", manifest.contactsEmployers === false, "employer false");

check("contract-route", contract.includes("PERSONAL_JOBS_11_ROUTE") && contract.includes("/personal-job-desk/import-search"), "contract route");
check("contract-history-key", contract.includes("PERSONAL_JOBS_11_IMPORT_HISTORY_KEY"), "contract history");
check("contract-pj02-key", contract.includes("PERSONAL_JOBS_11_PUSH_TARGET_KEY"), "contract PJ02");
check("contract-boundary", contract.includes("PERSONAL_JOBS_11_BOUNDARY") && contract.includes("searchesInternet: false"), "contract boundary");

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
  "google.calendar",
  "gapi.client",
  "fetch(",
  "axios.",
  "puppeteer",
  "playwright",
  "cheerio",
  "scrapesWebsites: true"
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
  schema: "kingsmen.personal-jobs-11-proof.v1",
  module: "PERSONAL-JOBS-11 - Local Job Search Import Desk",
  status: passed
    ? "PERSONAL_JOBS_11_LOCAL_JOB_SEARCH_IMPORT_DESK_PROVEN"
    : "PERSONAL_JOBS_11_LOCAL_JOB_SEARCH_IMPORT_DESK_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/import-search",
  readsLocalStorageKeys: [
    "kingsmen.personalJobs02.externalLeads.v1"
  ],
  writesLocalStorageKeys: [
    "kingsmen.personalJobs11.searchImportBatches.v1",
    "kingsmen.personalJobs02.externalLeads.v1"
  ],
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit: checks.find((item) => item.name === "gitignore-keeps-local-profile-private")?.passed === true,
  committedFilesContainPersonalContact: containsPersonalContact,
  parsesPastedJobSearchText: true,
  extractsUrls: true,
  pushesToPersonalJobs02: true,
  searchesInternet: false,
  scrapesWebsites: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false,
  checks,
  failed,
  next_action: passed ? "Run validator and commit PERSONAL-JOBS-11 tracked files only." : "Repair PERSONAL-JOBS-11 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(path.join(root, proofPath), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);