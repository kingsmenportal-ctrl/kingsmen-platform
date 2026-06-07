import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports", "personal-jobs", "personal-jobs-03-local-fit-scoring-shortlist-proof.json");

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/shortlist/page.tsx",
  "apps/web/src/app/personal-job-desk/shortlist/ShortlistDecisionClient.tsx",
  "docs/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.md",
  "manifests/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.json",
  "packages/contracts/src/personal-jobs-03-local-fit-scoring-shortlist.ts",
  "scripts/proof/prove-personal-jobs-03-local-fit-scoring-shortlist.mjs",
  "scripts/validators/validate-personal-jobs-03-local-fit-scoring-shortlist.mjs"
];

const dependencyFiles = [
  "reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json",
  "reports/validation/personal-jobs-01-local-job-desk-latest.json",
  "reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json",
  "reports/validation/personal-jobs-02-local-opportunity-intake-latest.json",
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

function push(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

const checks = [];

for (const file of expectedFiles) push(checks, `expected-file:${file}`, exists(file), file);
for (const file of dependencyFiles) push(checks, `dependency-file:${file}`, exists(file), file);

let pj01Proof = {};
let pj01Validation = {};
let pj02Proof = {};
let pj02Validation = {};
let manifest = {};

try {
  if (exists("reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json")) pj01Proof = readJson("reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json");
  if (exists("reports/validation/personal-jobs-01-local-job-desk-latest.json")) pj01Validation = readJson("reports/validation/personal-jobs-01-local-job-desk-latest.json");
  if (exists("reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json")) pj02Proof = readJson("reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json");
  if (exists("reports/validation/personal-jobs-02-local-opportunity-intake-latest.json")) pj02Validation = readJson("reports/validation/personal-jobs-02-local-opportunity-intake-latest.json");
  if (exists("manifests/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.json")) manifest = readJson("manifests/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.json");
} catch (error) {
  push(checks, "json-load", false, error.message);
}

push(checks, "personal-jobs-01-proof-passed", pj01Proof.passed === true, String(pj01Proof.passed));
push(checks, "personal-jobs-01-validation-passed", pj01Validation.passed === true, String(pj01Validation.passed));
push(checks, "personal-jobs-02-proof-passed", pj02Proof.passed === true, String(pj02Proof.passed));
push(checks, "personal-jobs-02-validation-passed", pj02Validation.passed === true, String(pj02Validation.passed));
push(checks, "personal-jobs-02-no-production-claim", pj02Proof.productionReady === false && pj02Proof.canClaimProduction === false, "PERSONAL-JOBS-02 production false");

const gitignore = exists(".gitignore") ? read(".gitignore") : "";
push(
  checks,
  "gitignore-keeps-local-profile-private",
  gitignore.includes("data/personal-job-desk/*.local.json") || gitignore.includes("personal-candidate.local.json"),
  "local json ignore pattern"
);

const page = exists("apps/web/src/app/personal-job-desk/shortlist/page.tsx") ? read("apps/web/src/app/personal-job-desk/shortlist/page.tsx") : "";
const client = exists("apps/web/src/app/personal-job-desk/shortlist/ShortlistDecisionClient.tsx") ? read("apps/web/src/app/personal-job-desk/shortlist/ShortlistDecisionClient.tsx") : "";
const contract = exists("packages/contracts/src/personal-jobs-03-local-fit-scoring-shortlist.ts") ? read("packages/contracts/src/personal-jobs-03-local-fit-scoring-shortlist.ts") : "";

push(checks, "page-route-marker", page.includes("data-kingsmen-personal-jobs-03-shortlist"), "page marker");
push(checks, "page-force-dynamic", page.includes('dynamic = "force-dynamic"'), "runtime local read");
push(checks, "page-reads-local-private-profile", page.includes("personal-candidate.local.json"), "local private profile path");

push(checks, "client-no-send-marker", client.includes("PERSONAL_JOBS_03_NO_SEND_BOUNDARY"), "local no-send marker");
push(checks, "client-reads-personal-jobs-02-leads", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PERSONAL-JOBS-02 localStorage key");
push(checks, "client-writes-shortlist-export", client.includes("kingsmen.personalJobs03.shortlist.v1"), "PERSONAL-JOBS-03 localStorage key");
push(checks, "client-score-function", client.includes("function scoreOpportunity"), "scoreOpportunity");
push(checks, "client-crown-target-band", client.includes("CROWN_TARGET"), "CROWN_TARGET");
push(checks, "client-strong-route-band", client.includes("STRONG_ROUTE"), "STRONG_ROUTE");
push(checks, "client-watchlist-band", client.includes("WATCHLIST"), "WATCHLIST");
push(checks, "client-research-first-band", client.includes("RESEARCH_FIRST"), "RESEARCH_FIRST");
push(checks, "client-source-confidence", client.includes("function sourceConfidence"), "source confidence");
push(checks, "client-deadline-risk", client.includes("function hasDeadlineRisk"), "deadline risk");
push(checks, "client-json-export", client.includes("Export Local Shortlist JSON") && client.includes("download"), "manual shortlist export");
push(checks, "client-15-cv-slots", client.includes("CV-15"), "15 CV slots");
push(checks, "client-15-motivation-slots", client.includes("ML-15"), "15 motivation slots");
push(checks, "client-no-send-boundary", client.includes("no applications") && client.includes("no applications, emails, WhatsApps, payments"), "no-send boundary");

push(checks, "contract-export", contract.includes("PERSONAL_JOBS_03_LOCAL_FIT_SCORING_SHORTLIST"), "contract export");
push(checks, "contract-route", contract.includes("/personal-job-desk/shortlist"), "contract route");
push(checks, "contract-no-send", contract.includes("sendsApplications: false") && contract.includes("sendsEmail: false") && contract.includes("sendsWhatsApp: false"), "contract no-send");

push(checks, "manifest-status-built-pending-validation", manifest.status === "BUILT_PENDING_VALIDATION", manifest.status ?? "missing");
push(checks, "manifest-local-route", manifest.route === "/personal-job-desk/shortlist", manifest.route ?? "missing");
push(checks, "manifest-cv-slots", manifest.cv_slots === 15, String(manifest.cv_slots));
push(checks, "manifest-motivation-slots", manifest.motivation_letter_slots === 15, String(manifest.motivation_letter_slots));
push(checks, "manifest-no-production-claim", manifest.productionReady === false && manifest.canClaimProduction === false, "manifest production false");
push(checks, "manifest-no-oracle-claim", manifest.deployedToOracle === false, "manifest oracle false");
push(checks, "manifest-no-docker", manifest.startsDocker === false, "manifest docker false");
push(checks, "manifest-no-send", manifest.sendsCandidateData === false && manifest.touchesMessaging === false, "manifest send false");
push(checks, "manifest-no-payment", manifest.touchesPayments === false, "manifest payments false");

const scannedFiles = [
  "apps/web/src/app/personal-job-desk/shortlist/page.tsx",
  "apps/web/src/app/personal-job-desk/shortlist/ShortlistDecisionClient.tsx",
  "docs/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.md",
  "manifests/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist.json",
  "packages/contracts/src/personal-jobs-03-local-fit-scoring-shortlist.ts"
];

const committedText = scannedFiles.filter(exists).map(read).join("\n");

const forbiddenRuntimeClaims = [
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
  "DEPLOYED_TO_ORACLE_TRUE"
];

for (const forbidden of forbiddenRuntimeClaims) {
  push(checks, `runtime-no-forbidden:${forbidden}`, !committedText.includes(forbidden), forbidden);
}

const containsPersonalContact =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(committedText) ||
  /(?:^|[^0-9])(?:\+27|0)(?:\s|-)?[6-8][0-9](?:\s|-)?[0-9]{3}(?:\s|-)?[0-9]{4}(?:[^0-9]|$)/.test(committedText);

push(checks, "committed-files-no-local-profile-contact", !containsPersonalContact, "local profile contact must stay untracked");

const failed = checks.filter((check) => !check.passed);

const report = {
  schema: "kingsmen.personal-jobs-03-proof.v1",
  module: "PERSONAL-JOBS-03 - Local Fit Scoring / Shortlist Decision Desk",
  status: failed.length === 0 ? "PERSONAL_JOBS_03_LOCAL_FIT_SCORING_SHORTLIST_PROVEN" : "PERSONAL_JOBS_03_LOCAL_FIT_SCORING_SHORTLIST_FAILED",
  passed: failed.length === 0,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/shortlist",
  readsLocalStorageKey: "kingsmen.personalJobs02.externalLeads.v1",
  writesLocalStorageKey: "kingsmen.personalJobs03.shortlist.v1",
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit: checks.find((check) => check.name === "gitignore-keeps-local-profile-private")?.passed === true,
  committedFilesContainPersonalContact: containsPersonalContact,
  checks,
  failed,
  next_action: failed.length === 0
    ? "Run validator and commit PERSONAL-JOBS-03 tracked files only."
    : "Repair PERSONAL-JOBS-03 before committing."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!report.passed) process.exit(1);

