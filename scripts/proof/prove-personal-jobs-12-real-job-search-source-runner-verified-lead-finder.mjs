import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder-proof.json";

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
  "apps/web/src/app/personal-job-desk/source-runner/page.tsx",
  "apps/web/src/app/personal-job-desk/source-runner/SourceRunnerClient.tsx",
  "docs/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder.md",
  "manifests/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder.json",
  "packages/contracts/src/personal-jobs-12-real-job-search-source-runner-verified-lead-finder.ts",
  "scripts/proof/prove-personal-jobs-12-real-job-search-source-runner-verified-lead-finder.mjs",
  "scripts/validators/validate-personal-jobs-12-real-job-search-source-runner-verified-lead-finder.mjs"
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
  "apps/web/src/app/personal-job-desk/import-search/page.tsx",
  "apps/web/src/app/personal-job-desk/source-runner/page.tsx"
];

for (const file of routeFiles) check(`route-file:${file}`, exists(file), file);

const proofReports = list("reports/personal-jobs");
const validationReports = list("reports/validation");

for (const n of ["01", "02", "03", "04", "05", "06", "07", "08", "10", "11"]) {
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

check("page-route-marker", page.includes("data-kingsmen-personal-jobs-12-route"), "route marker");
check("page-force-dynamic", page.includes('export const dynamic = "force-dynamic"'), "force dynamic");
check("page-local-profile-read", page.includes("personal-candidate.local.json"), "local private profile");

check("client-source-runner-marker", client.includes("data-kingsmen-personal-jobs-12-source-runner"), "client marker");
check("client-no-send-marker", client.includes("data-kingsmen-personal-jobs-12-no-send"), "no-send marker");
check("client-session-key", client.includes("kingsmen.personalJobs12.sourceRunnerSessions.v1"), "session key");
check("client-pj02-target-key", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 target key");
check("client-source-definitions", client.includes("const SOURCES"), "source definitions");
check("client-indeed-source", client.includes("https://za.indeed.com/"), "Indeed source");
check("client-pnet-source", client.includes("https://www.pnet.co.za/"), "PNet source");
check("client-careers24-source", client.includes("https://www.careers24.com/"), "Careers24 source");
check("client-careerjunction-source", client.includes("https://www.careerjunction.co.za/"), "CareerJunction source");
check("client-build-source-url", client.includes("function buildSourceUrl"), "buildSourceUrl");
check("client-build-missions", client.includes("function buildMissions"), "buildMissions");
check("client-create-missions", client.includes("function createMissions"), "createMissions");
check("client-open-mission", client.includes("function openMission") && client.includes("window.open"), "user-controlled open");
check("client-capture-lead", client.includes("function captureLeadToPj02"), "captureLeadToPj02");
check("client-duplicate-check", client.includes("fingerprint") && client.includes("Possible duplicate"), "duplicate check");
check("client-verification-checklist", client.includes("verificationChecklist"), "verification checklist");
check("client-no-auto-text", client.includes("does not auto-submit") && client.includes("does not contact employers"), "boundary text");

check("doc-local-boundary", doc.includes("does not auto-submit applications") && doc.includes("does not extract website content automatically"), "doc boundary");
check("doc-route", doc.includes("/personal-job-desk/source-runner"), "doc route");

check("manifest-status", manifest.status === "BUILT_PENDING_VALIDATION", "BUILT_PENDING_VALIDATION");
check("manifest-route", manifest.route === "/personal-job-desk/source-runner", String(manifest.route));
check("manifest-session-key", Array.isArray(manifest.writesLocalStorageKeys) && manifest.writesLocalStorageKeys.includes("kingsmen.personalJobs12.sourceRunnerSessions.v1"), "session write key");
check("manifest-pj02-target-key", Array.isArray(manifest.writesLocalStorageKeys) && manifest.writesLocalStorageKeys.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 write key");
check("manifest-opens-source-pages", manifest.opensUserControlledSourcePages === true, "source pages true");
check("manifest-captures-leads", manifest.capturesVerifiedLeadsToPersonalJobs02 === true, "capture true");
check("manifest-no-secrets", manifest.usesSecrets === false, "secrets false");
check("manifest-no-bots", manifest.runsBackgroundBots === false, "bots false");
check("manifest-no-auto-extract", manifest.extractsWebsiteContentAutomatically === false, "auto extract false");
check("manifest-no-auto-submit", manifest.autoSubmitsApplications === false, "auto submit false");
check("manifest-no-production", manifest.productionReady === false && manifest.canClaimProduction === false, "production false");
check("manifest-no-oracle", manifest.deployedToOracle === false, "oracle false");
check("manifest-no-docker", manifest.startsDocker === false, "docker false");
check("manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "send false");
check("manifest-no-payment", manifest.touchesPayments === false, "payment false");
check("manifest-no-calendar", manifest.touchesExternalCalendar === false, "calendar false");
check("manifest-no-employer-contact", manifest.contactsEmployers === false, "employer false");

check("contract-route", contract.includes("PERSONAL_JOBS_12_ROUTE") && contract.includes("/personal-job-desk/source-runner"), "contract route");
check("contract-session-key", contract.includes("PERSONAL_JOBS_12_SESSION_KEY"), "contract session");
check("contract-pj02-key", contract.includes("PERSONAL_JOBS_12_PUSH_TARGET_KEY"), "contract PJ02");
check("contract-boundary", contract.includes("PERSONAL_JOBS_12_BOUNDARY") && contract.includes("autoSubmitsApplications: false"), "contract boundary");

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
  "gapi.client",
  "axios.",
  "puppeteer",
  "playwright",
  "cheerio",
  "usesSecrets: true",
  "runsBackgroundBots: true",
  "autoSubmitsApplications: true",
  "extractsWebsiteContentAutomatically: true"
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
  schema: "kingsmen.personal-jobs-12-proof.v1",
  module: "PERSONAL-JOBS-12 - Real Job Search Source Runner / Verified Lead Finder",
  status: passed
    ? "PERSONAL_JOBS_12_REAL_JOB_SEARCH_SOURCE_RUNNER_VERIFIED_LEAD_FINDER_PROVEN"
    : "PERSONAL_JOBS_12_REAL_JOB_SEARCH_SOURCE_RUNNER_VERIFIED_LEAD_FINDER_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/source-runner",
  readsLocalStorageKeys: [
    "kingsmen.personalJobs02.externalLeads.v1"
  ],
  writesLocalStorageKeys: [
    "kingsmen.personalJobs12.sourceRunnerSessions.v1",
    "kingsmen.personalJobs02.externalLeads.v1"
  ],
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit: checks.find((item) => item.name === "gitignore-keeps-local-profile-private")?.passed === true,
  committedFilesContainPersonalContact: containsPersonalContact,
  opensUserControlledSourcePages: true,
  capturesVerifiedLeadsToPersonalJobs02: true,
  usesSecrets: false,
  runsBackgroundBots: false,
  extractsWebsiteContentAutomatically: false,
  autoSubmitsApplications: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false,
  checks,
  failed,
  next_action: passed ? "Run validator and commit PERSONAL-JOBS-12 tracked files only." : "Repair PERSONAL-JOBS-12 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(path.join(root, proofPath), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);