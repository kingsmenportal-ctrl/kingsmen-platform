import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = "reports/personal-jobs/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate-proof.json";

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/real-use-gate/page.tsx",
  "apps/web/src/app/personal-job-desk/real-use-gate/RealUseGateClient.tsx",
  "docs/personal-jobs/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.md",
  "manifests/personal-jobs/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.json",
  "packages/contracts/src/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.ts",
  "scripts/proof/prove-personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.mjs",
  "scripts/validators/validate-personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.mjs"
];

const routeFiles = [
  "apps/web/src/app/personal-job-desk/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunities/page.tsx",
  "apps/web/src/app/personal-job-desk/shortlist/page.tsx",
  "apps/web/src/app/personal-job-desk/apply-pack/page.tsx",
  "apps/web/src/app/personal-job-desk/submissions/page.tsx",
  "apps/web/src/app/personal-job-desk/follow-up/page.tsx",
  "apps/web/src/app/personal-job-desk/outcomes/page.tsx",
  "apps/web/src/app/personal-job-desk/real-use-gate/page.tsx"
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
  "reports/personal-jobs/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard-proof.json",
  "reports/validation/personal-jobs-07-outcome-ledger-offer-decision-command-dashboard-latest.json",
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
for (const file of routeFiles) addCheck(checks, `route-file:${file}`, exists(file), file);
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

for (const moduleNumber of ["01", "02", "03", "04", "05", "06", "07"]) {
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

addCheck(checks, "page-route-marker", page.includes("data-kingsmen-personal-jobs-08-route"), "page marker");
addCheck(checks, "page-force-dynamic", page.includes('export const dynamic = "force-dynamic"'), "runtime local read");
addCheck(checks, "page-reads-local-private-profile", page.includes("personal-candidate.local.json"), "local private profile path");
addCheck(checks, "page-client-wiring", page.includes("RealUseGateClient"), "client component");

addCheck(checks, "client-navigation-hub-marker", client.includes("data-kingsmen-personal-jobs-08-navigation-hub"), "navigation hub marker");
addCheck(checks, "client-no-send-marker", client.includes("data-kingsmen-personal-jobs-08-no-send"), "local no-send marker");
addCheck(checks, "client-writes-gate-key", client.includes("kingsmen.personalJobs08.realUseGate.v1"), "gate localStorage key");
addCheck(checks, "client-run-gate-function", client.includes("function runGate"), "runGate");
addCheck(checks, "client-export-gate-function", client.includes("exportGate"), "exportGate");
addCheck(checks, "client-copy-gate-function", client.includes("copyGateReport"), "copyGateReport");
addCheck(checks, "client-refresh-counts-function", client.includes("refreshCounts"), "refreshCounts");
addCheck(checks, "client-commands-function", client.includes("buildCommands"), "buildCommands");

for (const route of [
  "/personal-job-desk",
  "/personal-job-desk/opportunities",
  "/personal-job-desk/shortlist",
  "/personal-job-desk/apply-pack",
  "/personal-job-desk/submissions",
  "/personal-job-desk/follow-up",
  "/personal-job-desk/outcomes"
]) {
  addCheck(checks, `client-links-route:${route}`, client.includes(route), route);
}

for (const key of [
  "kingsmen.personalJobs02.externalLeads.v1",
  "kingsmen.personalJobs03.shortlist.v1",
  "kingsmen.personalJobs04.applyPacks.v1",
  "kingsmen.personalJobs05.submissions.v1",
  "kingsmen.personalJobs06.followUps.v1",
  "kingsmen.personalJobs07.outcomeLedger.v1"
]) {
  addCheck(checks, `client-reads-key:${key}`, client.includes(key), key);
}

addCheck(checks, "contract-export", contract.includes("PERSONAL_JOBS_08_ROUTE"), "contract export");
addCheck(checks, "contract-route", contract.includes("/personal-job-desk/real-use-gate"), "contract route");
addCheck(checks, "contract-navigation-routes", contract.includes("PERSONAL_JOBS_08_NAVIGATION_ROUTES"), "navigation routes");
addCheck(checks, "contract-no-send", contract.includes("sendsApplications: false"), "contract no-send");
addCheck(checks, "contract-no-calendar-sync", contract.includes("touchesExternalCalendar: false"), "contract no external calendar");
addCheck(checks, "contract-no-employer-contact", contract.includes("contactsEmployers: false"), "contract employer false");
addCheck(checks, "contract-gate-result-type", contract.includes("PersonalJobs08GateResult"), "gate result type");

addCheck(checks, "doc-boundary", doc.includes("local-only") && doc.includes("does not send"), "doc local boundary");
addCheck(checks, "doc-navigation", doc.includes("/personal-job-desk/outcomes") && doc.includes("/personal-job-desk/real-use-gate"), "doc navigation");

addCheck(checks, "manifest-status-built-pending-validation", manifest.status === "BUILT_PENDING_VALIDATION", "BUILT_PENDING_VALIDATION");
addCheck(checks, "manifest-local-route", manifest.route === "/personal-job-desk/real-use-gate", "/personal-job-desk/real-use-gate");
addCheck(checks, "manifest-navigation-route-count", Array.isArray(manifest.navigationRoutes) && manifest.navigationRoutes.length === 7, "7 routes");
addCheck(checks, "manifest-no-production-claim", manifest.productionReady === false, "manifest production false");
addCheck(checks, "manifest-no-oracle-claim", manifest.deployedToOracle === false, "manifest oracle false");
addCheck(checks, "manifest-no-docker", manifest.startsDocker === false, "manifest docker false");
addCheck(checks, "manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "manifest send false");
addCheck(checks, "manifest-no-payment", manifest.touchesPayments === false, "manifest payments false");
addCheck(checks, "manifest-no-external-calendar", manifest.touchesExternalCalendar === false, "manifest calendar false");
addCheck(checks, "manifest-no-employer-contact", manifest.contactsEmployers === false, "manifest employer false");

const runtimeScannedFiles = [
  "apps/web/src/app/personal-job-desk/real-use-gate/page.tsx",
  "apps/web/src/app/personal-job-desk/real-use-gate/RealUseGateClient.tsx",
  "docs/personal-jobs/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.md",
  "manifests/personal-jobs/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.json",
  "packages/contracts/src/personal-jobs-08-end-to-end-local-runtime-smoke-test-navigation-hub-real-use-gate.ts"
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
  schema: "kingsmen.personal-jobs-08-proof.v1",
  module: "PERSONAL-JOBS-08 - End-to-End Local Runtime Smoke Test / Navigation Hub / Real Use Gate",
  status: passed
    ? "PERSONAL_JOBS_08_END_TO_END_LOCAL_RUNTIME_SMOKE_TEST_NAVIGATION_HUB_REAL_USE_GATE_PROVEN"
    : "PERSONAL_JOBS_08_END_TO_END_LOCAL_RUNTIME_SMOKE_TEST_NAVIGATION_HUB_REAL_USE_GATE_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/real-use-gate",
  navigationRoutes: [
    "/personal-job-desk",
    "/personal-job-desk/opportunities",
    "/personal-job-desk/shortlist",
    "/personal-job-desk/apply-pack",
    "/personal-job-desk/submissions",
    "/personal-job-desk/follow-up",
    "/personal-job-desk/outcomes"
  ],
  readsLocalStorageKeys: [
    "kingsmen.personalJobs02.externalLeads.v1",
    "kingsmen.personalJobs03.shortlist.v1",
    "kingsmen.personalJobs04.applyPacks.v1",
    "kingsmen.personalJobs05.submissions.v1",
    "kingsmen.personalJobs06.followUps.v1",
    "kingsmen.personalJobs07.outcomeLedger.v1"
  ],
  writesLocalStorageKey: "kingsmen.personalJobs08.realUseGate.v1",
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
  next_action: passed ? "Run validator and commit PERSONAL-JOBS-08 tracked files only." : "Repair PERSONAL-JOBS-08 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(path.join(root, proofPath), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);