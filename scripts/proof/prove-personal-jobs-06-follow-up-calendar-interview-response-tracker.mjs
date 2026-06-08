import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker-proof.json";

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/follow-up/page.tsx",
  "apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx",
  "docs/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker.md",
  "manifests/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker.json",
  "packages/contracts/src/personal-jobs-06-follow-up-calendar-interview-response-tracker.ts",
  "scripts/proof/prove-personal-jobs-06-follow-up-calendar-interview-response-tracker.mjs",
  "scripts/validators/validate-personal-jobs-06-follow-up-calendar-interview-response-tracker.mjs"
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

for (const moduleNumber of ["01", "02", "03", "04", "05"]) {
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

addCheck(checks, "page-route-marker", page.includes("data-kingsmen-personal-jobs-06-route"), "page marker");
addCheck(checks, "page-force-dynamic", page.includes('export const dynamic = "force-dynamic"'), "runtime local read");
addCheck(checks, "page-reads-local-private-profile", page.includes("data") && page.includes("personal-job-desk") && page.includes("personal-candidate.local.json"), "local private profile path");
addCheck(checks, "page-client-wiring", page.includes("FollowUpTrackerClient"), "client component");

addCheck(checks, "client-no-send-marker", client.includes("data-kingsmen-personal-jobs-06-no-send"), "local no-send marker");
addCheck(checks, "client-reads-personal-jobs-05-submissions", client.includes("kingsmen.personalJobs05.submissions.v1"), "PERSONAL-JOBS-05 localStorage key");
addCheck(checks, "client-writes-follow-up-ledger", client.includes("kingsmen.personalJobs06.followUps.v1"), "PERSONAL-JOBS-06 localStorage key");
addCheck(checks, "client-schedule-follow-up-function", client.includes("scheduleFollowUp"), "scheduleFollowUp");
addCheck(checks, "client-export-follow-up-ledger", client.includes("exportFollowUpLedger"), "exportFollowUpLedger");

for (const status of [
  "WAITING_RESPONSE",
  "FOLLOW_UP_DUE",
  "RECRUITER_REPLIED",
  "INTERVIEW_INVITED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_PREP_READY",
  "OFFER_RECEIVED",
  "REJECTED",
  "CLOSED_NO_RESPONSE"
]) {
  addCheck(checks, `client-status:${status}`, client.includes(status), status);
}

addCheck(checks, "client-local-storage-only", client.includes("localStorage.setItem") && client.includes("localStorage.getItem"), "browser local storage");
addCheck(checks, "client-truthful-boundary", client.includes("Do not invent experience") && client.includes("Do not invent replies"), "truthful boundary");

addCheck(checks, "contract-export", contract.includes("PERSONAL_JOBS_06_ROUTE"), "contract export");
addCheck(checks, "contract-route", contract.includes("/personal-job-desk/follow-up"), "contract route");
addCheck(checks, "contract-no-send", contract.includes("sendsApplications: false"), "contract no-send");
addCheck(checks, "contract-no-calendar-sync", contract.includes("touchesExternalCalendar: false"), "contract no external calendar");
addCheck(checks, "contract-status-type", contract.includes("PersonalJobs06Status"), "status type");

addCheck(checks, "doc-boundary", doc.includes("local-only") && doc.includes("does not send"), "doc local boundary");
addCheck(checks, "doc-interview-prep", doc.includes("Interview preparation"), "doc interview prep");

addCheck(checks, "manifest-status-built-pending-validation", manifest.status === "BUILT_PENDING_VALIDATION", "BUILT_PENDING_VALIDATION");
addCheck(checks, "manifest-local-route", manifest.route === "/personal-job-desk/follow-up", "/personal-job-desk/follow-up");
addCheck(checks, "manifest-no-production-claim", manifest.productionReady === false, "manifest production false");
addCheck(checks, "manifest-no-oracle-claim", manifest.deployedToOracle === false, "manifest oracle false");
addCheck(checks, "manifest-no-docker", manifest.startsDocker === false, "manifest docker false");
addCheck(checks, "manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "manifest send false");
addCheck(checks, "manifest-no-payment", manifest.touchesPayments === false, "manifest payments false");
addCheck(checks, "manifest-no-external-calendar", manifest.touchesExternalCalendar === false, "manifest calendar false");

const runtimeScannedFiles = [
  "apps/web/src/app/personal-job-desk/follow-up/page.tsx",
  "apps/web/src/app/personal-job-desk/follow-up/FollowUpTrackerClient.tsx",
  "docs/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker.md",
  "manifests/personal-jobs/personal-jobs-06-follow-up-calendar-interview-response-tracker.json",
  "packages/contracts/src/personal-jobs-06-follow-up-calendar-interview-response-tracker.ts"
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
  schema: "kingsmen.personal-jobs-06-proof.v1",
  module: "PERSONAL-JOBS-06 - Follow-Up Calendar / Interview Prep / Response Tracker",
  status: passed
    ? "PERSONAL_JOBS_06_FOLLOW_UP_CALENDAR_INTERVIEW_RESPONSE_TRACKER_PROVEN"
    : "PERSONAL_JOBS_06_FOLLOW_UP_CALENDAR_INTERVIEW_RESPONSE_TRACKER_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/follow-up",
  readsLocalStorageKey: "kingsmen.personalJobs05.submissions.v1",
  writesLocalStorageKey: "kingsmen.personalJobs06.followUps.v1",
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit: checks.find((check) => check.name === "gitignore-keeps-local-profile-private")?.passed === true,
  committedFilesContainPersonalContact: containsPersonalContact,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  checks,
  failed,
  next_action: passed ? "Run validator and commit PERSONAL-JOBS-06 tracked files only." : "Repair PERSONAL-JOBS-06 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(path.join(root, proofPath), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);