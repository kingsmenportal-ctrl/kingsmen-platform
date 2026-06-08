import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard-proof.json";

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/outcomes/page.tsx",
  "apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx",
  "docs/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.md",
  "manifests/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.json",
  "packages/contracts/src/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.ts",
  "scripts/proof/prove-personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.mjs",
  "scripts/validators/validate-personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.mjs"
];

const dependencyFiles = [
  "reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json",
  "reports/validation/personal-jobs-01-local-job-desk-latest.json",
  "reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json",
  "reports/validation/personal-jobs-02-local-opportunity-intake-latest.json",
  "reports/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist-proof.json",
  "reports/validation/personal-jobs-03-local-fit-scoring-shortlist-latest.json",
  "reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json",
  "reports/validation/personal-jobs-04-cv-motivation-apply-pack-builder-latest.json",
  "reports/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger-proof.json",
  "reports/validation/personal-jobs-05-manual-submission-tracker-evidence-ledger-latest.json",
  "reports/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker-proof.json",
  "reports/validation/personal-jobs-06-follow-up-calendar-interview-response-tracker-latest.json",
  "data/personal-job-desk/personal-candidate.local.json"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function addCheck(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

const checks = [];

for (const file of expectedFiles) addCheck(checks, `expected-file:${file}`, exists(file), file);
for (const file of dependencyFiles) addCheck(checks, `dependency-file:${file}`, exists(file), file);

const gitignore = exists(".gitignore") ? read(".gitignore") : "";
addCheck(
  checks,
  "gitignore-keeps-local-profile-private",
  gitignore.includes("data/personal-job-desk/*.local.json") ||
    gitignore.includes("data/personal-job-desk/") ||
    gitignore.includes("personal-candidate.local.json"),
  "local json ignore pattern"
);

for (const moduleNumber of ["01", "02", "03", "04", "05", "06"]) {
  const proofFile = dependencyFiles.find((file) => file.includes(`personal-jobs-${moduleNumber}`) && file.includes("proof"));
  const validationFile = dependencyFiles.find((file) => file.includes(`personal-jobs-${moduleNumber}`) && file.includes("validation"));

  if (proofFile && exists(proofFile)) {
    const proof = readJson(proofFile);
    addCheck(checks, `personal-jobs-${moduleNumber}-proof-passed`, proof.passed === true, String(proof.passed));
  } else {
    addCheck(checks, `personal-jobs-${moduleNumber}-proof-passed`, false, "missing proof");
  }

  if (validationFile && exists(validationFile)) {
    const validation = readJson(validationFile);
    addCheck(checks, `personal-jobs-${moduleNumber}-validation-passed`, validation.passed === true, String(validation.passed));
  } else {
    addCheck(checks, `personal-jobs-${moduleNumber}-validation-passed`, false, "missing validation");
  }
}

const page = exists(expectedFiles[1]) ? read(expectedFiles[1]) : "";
const client = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const doc = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const manifest = exists(expectedFiles[4]) ? readJson(expectedFiles[4]) : {};
const contract = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";

addCheck(checks, "page-route-marker", page.includes("data-kingsmen-personal-jobs-07-route"), "page marker");
addCheck(checks, "page-force-dynamic", page.includes('export const dynamic = "force-dynamic"'), "runtime local read");
addCheck(checks, "page-reads-local-private-profile", page.includes("personal-candidate.local.json"), "local private profile path");
addCheck(checks, "page-client-wiring", page.includes("OutcomeCommandDashboardClient"), "client component");

addCheck(checks, "client-command-dashboard-marker", client.includes("data-kingsmen-personal-jobs-07-command-dashboard"), "command dashboard marker");
addCheck(checks, "client-no-send-marker", client.includes("data-kingsmen-personal-jobs-07-no-send"), "local no-send marker");
addCheck(checks, "client-reads-leads", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "leads key");
addCheck(checks, "client-reads-shortlist", client.includes("kingsmen.personalJobs03.shortlist.v1"), "shortlist key");
addCheck(checks, "client-reads-apply-packs", client.includes("kingsmen.personalJobs04.applyPacks.v1"), "apply packs key");
addCheck(checks, "client-reads-submissions", client.includes("kingsmen.personalJobs05.submissions.v1"), "submissions key");
addCheck(checks, "client-reads-follow-ups", client.includes("kingsmen.personalJobs06.followUps.v1"), "followups key");
addCheck(checks, "client-writes-outcomes", client.includes("kingsmen.personalJobs07.outcomeLedger.v1"), "outcome key");

addCheck(checks, "client-compute-today-commands", client.includes("computeTodayCommands"), "daily command logic");
addCheck(checks, "client-build-offer-decision", client.includes("buildOfferDecision"), "offer decision logic");
addCheck(checks, "client-seed-outcomes", client.includes("seedOutcomesFromFollowUps"), "seed outcomes");
addCheck(checks, "client-export-outcomes", client.includes("exportOutcomeLedger"), "export outcomes");

for (const status of [
  "STILL_SEARCHING",
  "WAITING_RESPONSE",
  "INTERVIEW_ACTIVE",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "OFFER_DECLINED",
  "UNSUCCESSFUL",
  "CLOSED_NO_RESPONSE",
  "HIRED"
]) {
  addCheck(checks, `client-outcome-status:${status}`, client.includes(status), status);
}

for (const decision of [
  "NO_OFFER_YET",
  "TAKE_NOW",
  "NEGOTIATE",
  "WAIT_FOR_BETTER",
  "DECLINE_RISK",
  "NEEDS_INFORMATION"
]) {
  addCheck(checks, `client-offer-decision:${decision}`, client.includes(decision), decision);
}

addCheck(checks, "contract-export", contract.includes("PERSONAL_JOBS_07_ROUTE"), "contract export");
addCheck(checks, "contract-route", contract.includes("/personal-job-desk/outcomes"), "contract route");
addCheck(checks, "contract-no-send", contract.includes("sendsApplications: false"), "contract no-send");
addCheck(checks, "contract-no-calendar-sync", contract.includes("touchesExternalCalendar: false"), "contract no external calendar");
addCheck(checks, "contract-no-employer-contact", contract.includes("contactsEmployers: false"), "contract employer false");
addCheck(checks, "contract-status-type", contract.includes("PersonalJobs07OutcomeStatus"), "status type");

addCheck(checks, "doc-boundary", doc.includes("local-only") && doc.includes("does not send"), "doc local boundary");
addCheck(checks, "doc-offer-decision", doc.includes("Offer decision"), "doc offer decision");

addCheck(checks, "manifest-status-built-pending-validation", manifest.status === "BUILT_PENDING_VALIDATION", "BUILT_PENDING_VALIDATION");
addCheck(checks, "manifest-local-route", manifest.route === "/personal-job-desk/outcomes", "/personal-job-desk/outcomes");
addCheck(checks, "manifest-no-production-claim", manifest.productionReady === false, "manifest production false");
addCheck(checks, "manifest-no-oracle-claim", manifest.deployedToOracle === false, "manifest oracle false");
addCheck(checks, "manifest-no-docker", manifest.startsDocker === false, "manifest docker false");
addCheck(checks, "manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "manifest send false");
addCheck(checks, "manifest-no-payment", manifest.touchesPayments === false, "manifest payments false");
addCheck(checks, "manifest-no-external-calendar", manifest.touchesExternalCalendar === false, "manifest calendar false");
addCheck(checks, "manifest-no-employer-contact", manifest.contactsEmployers === false, "manifest employer false");

const runtimeScannedFiles = [
  "apps/web/src/app/personal-job-desk/outcomes/page.tsx",
  "apps/web/src/app/personal-job-desk/outcomes/OutcomeCommandDashboardClient.tsx",
  "docs/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.md",
  "manifests/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.json",
  "packages/contracts/src/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard.ts"
];

const committedText = runtimeScannedFiles.filter((file) => exists(file)).map((file) => read(file)).join("\n");

const forbiddenRuntimeStrings = [
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
  "fetch('/api/send",
  "sendEmail(",
  "sendWhatsApp(",
  "submitApplication(",
  "payfast",
  "google.calendar",
  "gapi.client"
];

for (const forbidden of forbiddenRuntimeStrings) {
  addCheck(checks, `runtime-no-forbidden:${forbidden}`, !committedText.includes(forbidden), forbidden);
}

const containsPersonalContact =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(committedText) ||
  /(?:^|[^0-9])(?:\+27|0)(?:\s|-)?[6-8][0-9](?:\s|-)?[0-9]{3}(?:\s|-)?[0-9]{4}(?:[^0-9]|$)/.test(committedText);

addCheck(checks, "committed-files-no-local-profile-contact", !containsPersonalContact, "local profile contact must stay untracked");

const failed = checks.filter((check) => !check.passed);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.personal-jobs-07-proof.v1",
  module: "PERSONAL-JOBS-07 - Outcome Ledger / Offer Decision / Job Search Command Dashboard",
  status: passed
    ? "PERSONAL_JOBS_07_OUTCOME_LEDGER_OFFER_DECISION_COMMAND_DASHBOARD_PROVEN"
    : "PERSONAL_JOBS_07_OUTCOME_LEDGER_OFFER_DECISION_COMMAND_DASHBOARD_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/outcomes",
  readsLocalStorageKeys: [
    "kingsmen.personalJobs02.externalLeads.v1",
    "kingsmen.personalJobs03.shortlist.v1",
    "kingsmen.personalJobs04.applyPacks.v1",
    "kingsmen.personalJobs05.submissions.v1",
    "kingsmen.personalJobs06.followUps.v1"
  ],
  writesLocalStorageKey: "kingsmen.personalJobs07.outcomeLedger.v1",
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit: checks.find((check) => check.name === "gitignore-keeps-local-profile-private")?.passed === true,
  committedFilesContainPersonalContact: containsPersonalContact,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false,
  checks,
  failed,
  next_action: passed ? "Run validator and commit PERSONAL-JOBS-07 tracked files only." : "Repair PERSONAL-JOBS-07 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(path.join(root, proofPath), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);