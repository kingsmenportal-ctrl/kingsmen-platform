import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-10-personal-job-campaign-daily-operating-loop-proof.json";

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
  "apps/web/src/app/personal-job-desk/daily-loop/page.tsx",
  "apps/web/src/app/personal-job-desk/daily-loop/DailyLoopClient.tsx",
  "docs/personal-jobs/personal-jobs-10-personal-job-campaign-daily-operating-loop.md",
  "manifests/personal-jobs/personal-jobs-10-personal-job-campaign-daily-operating-loop.json",
  "packages/contracts/src/personal-jobs-10-personal-job-campaign-daily-operating-loop.ts",
  "scripts/proof/prove-personal-jobs-10-personal-job-campaign-daily-operating-loop.mjs",
  "scripts/validators/validate-personal-jobs-10-personal-job-campaign-daily-operating-loop.mjs"
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
  "apps/web/src/app/personal-job-desk/daily-loop/page.tsx"
];

for (const file of routeFiles) check(`route-file:${file}`, exists(file), file);

const proofReports = list("reports/personal-jobs");
const validationReports = list("reports/validation");

for (const n of ["01", "02", "03", "04", "05", "06", "07", "08"]) {
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

check("page-route-marker", page.includes("data-kingsmen-personal-jobs-10-route"), "route marker");
check("page-force-dynamic", page.includes('export const dynamic = "force-dynamic"'), "force dynamic");
check("page-local-profile-read", page.includes("personal-candidate.local.json"), "local private profile");
check("client-daily-loop-marker", client.includes("data-kingsmen-personal-jobs-10-daily-loop"), "client marker");
check("client-no-send-marker", client.includes("data-kingsmen-personal-jobs-10-no-send"), "no-send marker");
check("client-build-snapshot", client.includes("function buildSnapshot"), "buildSnapshot");
check("client-build-commands", client.includes("function buildCommands"), "buildCommands");
check("client-run-daily-loop", client.includes("function runDailyLoop"), "runDailyLoop");
check("client-export-json", client.includes("function exportJson"), "exportJson");
check("client-crown-urgency", client.includes('"CROWN"'), "CROWN urgency");
check("client-proof-required", client.includes("proofRequired"), "proofRequired");
check("client-write-key", client.includes("kingsmen.personalJobs10.dailyOperatingLoop.v1"), "daily loop write key");

for (const key of [
  "kingsmen.personalJobs02.externalLeads.v1",
  "kingsmen.personalJobs03.shortlist.v1",
  "kingsmen.personalJobs04.applyPacks.v1",
  "kingsmen.personalJobs05.submissions.v1",
  "kingsmen.personalJobs06.followUps.v1",
  "kingsmen.personalJobs07.outcomeLedger.v1",
  "kingsmen.personalJobs08.realUseGate.v1"
]) {
  check(`client-reads-key:${key}`, client.includes(key), key);
}

for (const route of [
  "/personal-job-desk",
  "/personal-job-desk/opportunities",
  "/personal-job-desk/shortlist",
  "/personal-job-desk/apply-pack",
  "/personal-job-desk/submissions",
  "/personal-job-desk/follow-up",
  "/personal-job-desk/outcomes",
  "/personal-job-desk/real-use-gate"
]) {
  check(`client-links-route:${route}`, client.includes(route), route);
}

check("doc-local-boundary", doc.includes("local-only") && doc.includes("does not send applications"), "doc boundary");
check("manifest-status", manifest.status === "BUILT_PENDING_VALIDATION", "BUILT_PENDING_VALIDATION");
check("manifest-route", manifest.route === "/personal-job-desk/daily-loop", String(manifest.route));
check("manifest-read-key-count", Array.isArray(manifest.readsLocalStorageKeys) && manifest.readsLocalStorageKeys.length === 7, "7 read keys");
check("manifest-linked-route-count", Array.isArray(manifest.linkedRoutes) && manifest.linkedRoutes.length === 8, "8 linked routes");
check("manifest-write-key", manifest.writesLocalStorageKey === "kingsmen.personalJobs10.dailyOperatingLoop.v1", String(manifest.writesLocalStorageKey));
check("manifest-no-production", manifest.productionReady === false && manifest.canClaimProduction === false, "production false");
check("manifest-no-oracle", manifest.deployedToOracle === false, "oracle false");
check("manifest-no-docker", manifest.startsDocker === false, "docker false");
check("manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "send false");
check("manifest-no-payment", manifest.touchesPayments === false, "payment false");
check("manifest-no-calendar", manifest.touchesExternalCalendar === false, "calendar false");
check("manifest-no-employer-contact", manifest.contactsEmployers === false, "employer false");

check("contract-route", contract.includes("PERSONAL_JOBS_10_ROUTE") && contract.includes("/personal-job-desk/daily-loop"), "contract route");
check("contract-boundary", contract.includes("PERSONAL_JOBS_10_BOUNDARY") && contract.includes("sendsApplications: false"), "contract boundary");

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
  "gapi.client"
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
  schema: "kingsmen.personal-jobs-10-proof.v1",
  module: "PERSONAL-JOBS-10 - Personal Job Campaign Daily Operating Loop",
  status: passed
    ? "PERSONAL_JOBS_10_PERSONAL_JOB_CAMPAIGN_DAILY_OPERATING_LOOP_PROVEN"
    : "PERSONAL_JOBS_10_PERSONAL_JOB_CAMPAIGN_DAILY_OPERATING_LOOP_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/daily-loop",
  readsLocalStorageKeys: [
    "kingsmen.personalJobs02.externalLeads.v1",
    "kingsmen.personalJobs03.shortlist.v1",
    "kingsmen.personalJobs04.applyPacks.v1",
    "kingsmen.personalJobs05.submissions.v1",
    "kingsmen.personalJobs06.followUps.v1",
    "kingsmen.personalJobs07.outcomeLedger.v1",
    "kingsmen.personalJobs08.realUseGate.v1"
  ],
  writesLocalStorageKey: "kingsmen.personalJobs10.dailyOperatingLoop.v1",
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit: checks.find((item) => item.name === "gitignore-keeps-local-profile-private")?.passed === true,
  committedFilesContainPersonalContact: containsPersonalContact,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false,
  checks,
  failed,
  next_action: passed ? "Run validator and commit PERSONAL-JOBS-10 tracked files only." : "Repair PERSONAL-JOBS-10 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(path.join(root, proofPath), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);