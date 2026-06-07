import fs from "fs";
import path from "path";

const root = process.cwd();

const moduleName = "PERSONAL-JOBS-05 - Manual Application Submission Tracker / Evidence Ledger";

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/submissions/page.tsx",
  "apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx",
  "docs/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger.md",
  "manifests/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger.json",
  "packages/contracts/src/personal-jobs-05-manual-submission-tracker-evidence-ledger.ts",
  "scripts/proof/prove-personal-jobs-05-manual-submission-tracker-evidence-ledger.mjs",
  "scripts/validators/validate-personal-jobs-05-manual-submission-tracker-evidence-ledger.mjs"
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

const checks = [];

function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

for (const file of dependencyFiles) {
  check(`dependency-file:${file}`, exists(file), file);
}

const page = exists(expectedFiles[1]) ? read(expectedFiles[1]) : "";
const client = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const doc = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const manifest = exists(expectedFiles[4]) ? readJson(expectedFiles[4]) : {};
const contract = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";
const gitignore = exists(".gitignore") ? read(".gitignore") : "";

const dependencyProofs = [
  ["personal-jobs-01-proof-passed", "reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json"],
  ["personal-jobs-01-validation-passed", "reports/validation/personal-jobs-01-local-job-desk-latest.json"],
  ["personal-jobs-02-proof-passed", "reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json"],
  ["personal-jobs-02-validation-passed", "reports/validation/personal-jobs-02-local-opportunity-intake-latest.json"],
  ["personal-jobs-03-proof-passed", "reports/personal-jobs/personal-jobs-03-local-fit-scoring-shortlist-proof.json"],
  ["personal-jobs-03-validation-passed", "reports/validation/personal-jobs-03-local-fit-scoring-shortlist-latest.json"],
  ["personal-jobs-04-proof-passed", "reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json"],
  ["personal-jobs-04-validation-passed", "reports/validation/personal-jobs-04-cv-motivation-apply-pack-builder-latest.json"]
];

for (const [name, file] of dependencyProofs) {
  if (exists(file)) {
    const json = readJson(file);
    check(name, json.passed === true, String(json.passed));
  } else {
    check(name, false, file);
  }
}

check(
  "gitignore-keeps-local-profile-private",
  gitignore.includes("data/personal-job-desk/*.local.json") ||
    gitignore.includes("data/personal-job-desk/") ||
    gitignore.includes("personal-candidate.local.json"),
  "local json ignore pattern"
);

check("page-route-marker", page.includes("PERSONAL_JOBS_05_ROUTE_MARKER"), "page marker");
check("page-force-dynamic", page.includes('dynamic = "force-dynamic"'), "runtime local read");
check("page-reads-local-private-profile", page.includes("data/personal-job-desk/personal-candidate.local.json"), "local private profile path");

check("client-no-send-marker", client.includes("PERSONAL_JOBS_05_NO_SEND_BOUNDARY"), "local no-send marker");
check("client-reads-personal-jobs-04-apply-packs", client.includes("kingsmen.personalJobs04.applyPacks.v1"), "PERSONAL-JOBS-04 localStorage key");
check("client-writes-submission-ledger", client.includes("kingsmen.personalJobs05.submissions.v1"), "PERSONAL-JOBS-05 localStorage key");
check("client-record-manual-submission-function", client.includes("recordManualSubmission"), "recordManualSubmission");
check("client-export-evidence-ledger", client.includes("exportEvidenceLedger"), "exportEvidenceLedger");
check("client-draft-pack-ready-status", client.includes("DRAFT_PACK_READY"), "DRAFT_PACK_READY");
check("client-manually-submitted-status", client.includes("MANUALLY_SUBMITTED"), "MANUALLY_SUBMITTED");
check("client-proof-captured-status", client.includes("PROOF_CAPTURED"), "PROOF_CAPTURED");
check("client-follow-up-due-status", client.includes("FOLLOW_UP_DUE"), "FOLLOW_UP_DUE");
check("client-offer-received-status", client.includes("OFFER_RECEIVED"), "OFFER_RECEIVED");
check("client-no-send-boundary", client.includes("no applications, emails, WhatsApps, payment actions, portal submissions, employer contact"), "no-send boundary");

check("contract-export", contract.includes("PERSONAL_JOBS_05_MANUAL_SUBMISSION_TRACKER_EVIDENCE_LEDGER"), "contract export");
check("contract-route", contract.includes("/personal-job-desk/submissions"), "contract route");
check("contract-no-send", contract.includes("sendsApplications: false"), "contract no-send");
check("contract-status-type", contract.includes("PersonalJobs05SubmissionStatus"), "status type");

check("doc-boundary", doc.includes("does not send applications"), "doc boundary");
check("doc-evidence-doctrine", doc.includes("what proof exists"), "doc evidence doctrine");

check("manifest-status-built-pending-validation", manifest.status === "BUILT_PENDING_VALIDATION", manifest.status);
check("manifest-local-route", manifest.route === "/personal-job-desk/submissions", manifest.route);
check("manifest-no-production-claim", manifest.productionReady === false && manifest.canClaimProduction === false, "manifest production false");
check("manifest-no-oracle-claim", manifest.deployedToOracle === false, "manifest oracle false");
check("manifest-no-docker", manifest.startsDocker === false, "manifest docker false");
check("manifest-no-send", manifest.sendsApplications === false && manifest.sendsEmail === false && manifest.sendsWhatsApp === false, "manifest send false");
check("manifest-no-payment", manifest.touchesPayments === false, "manifest payments false");

const runtimeScannedFiles = [
  "apps/web/src/app/personal-job-desk/submissions/page.tsx",
  "apps/web/src/app/personal-job-desk/submissions/SubmissionTrackerClient.tsx",
  "docs/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger.md",
  "manifests/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger.json",
  "packages/contracts/src/personal-jobs-05-manual-submission-tracker-evidence-ledger.ts"
];

const committedText = runtimeScannedFiles
  .filter((file) => exists(file))
  .map((file) => read(file))
  .join("\n");

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
  "payfast"
];

for (const forbidden of forbiddenRuntimeStrings) {
  check(`runtime-no-forbidden:${forbidden}`, !committedText.includes(forbidden), forbidden);
}

const containsPersonalContact =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(committedText) ||
  /(?:^|[^0-9])(?:\+27|0)(?:\s|-)?[6-8][0-9](?:\s|-)?[0-9]{3}(?:\s|-)?[0-9]{4}(?:[^0-9]|$)/.test(committedText);

check("committed-files-no-local-profile-contact", !containsPersonalContact, "local profile contact must stay untracked");

const failed = checks.filter((item) => !item.passed);

const report = {
  schema: "kingsmen.personal-jobs-05-proof.v1",
  module: moduleName,
  status: failed.length === 0
    ? "PERSONAL_JOBS_05_MANUAL_SUBMISSION_TRACKER_EVIDENCE_LEDGER_PROVEN"
    : "PERSONAL_JOBS_05_MANUAL_SUBMISSION_TRACKER_EVIDENCE_LEDGER_FAILED",
  passed: failed.length === 0,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/submissions",
  readsLocalStorageKey: "kingsmen.personalJobs04.applyPacks.v1",
  writesLocalStorageKey: "kingsmen.personalJobs05.submissions.v1",
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit:
    gitignore.includes("data/personal-job-desk/*.local.json") ||
    gitignore.includes("data/personal-job-desk/") ||
    gitignore.includes("personal-candidate.local.json"),
  committedFilesContainPersonalContact: containsPersonalContact,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  checks,
  failed,
  next_action: failed.length === 0
    ? "Run validator and commit PERSONAL-JOBS-05 tracked files only."
    : "Repair PERSONAL-JOBS-05 before moving forward."
};

fs.mkdirSync(path.join(root, "reports/personal-jobs"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/personal-jobs/personal-jobs-05-manual-submission-tracker-evidence-ledger-proof.json"),
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
