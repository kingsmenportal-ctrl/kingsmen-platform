#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

const route = "/personal-job-desk/opportunities";
const localStorageKey = "kingsmen.personalJobs02.externalLeads.v1";
const proofPath = "reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json";

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/opportunities/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx",
  "docs/personal-jobs/personal-jobs-02-local-opportunity-intake.md",
  "manifests/personal-jobs/personal-jobs-02-local-opportunity-intake.json",
  "packages/contracts/src/personal-jobs-02-local-opportunity-intake.ts",
  "scripts/proof/prove-personal-jobs-02-local-opportunity-intake.mjs",
  "scripts/validators/validate-personal-jobs-02-local-opportunity-intake.mjs"
];

const dependencyFiles = [
  "reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json",
  "reports/validation/personal-jobs-01-local-job-desk-latest.json",
  "data/personal-job-desk/personal-candidate.local.json"
];

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function writeJson(rel, value) {
  writeText(rel, `${JSON.stringify(value, null, 2)}\n`);
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

for (const file of dependencyFiles) {
  check(`dependency-file:${file}`, exists(file), file);
}

const b01Proof = exists("reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json")
  ? readJson("reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json")
  : null;

const b01Validation = exists("reports/validation/personal-jobs-01-local-job-desk-latest.json")
  ? readJson("reports/validation/personal-jobs-01-local-job-desk-latest.json")
  : null;

check(
  "personal-jobs-01-proven",
  b01Proof?.status === "PERSONAL_JOBS_01_LOCAL_JOB_DESK_PROVEN" && b01Proof?.passed === true,
  b01Proof?.status ?? "missing"
);

check(
  "personal-jobs-01-validated",
  b01Validation?.status === "VALIDATED" && b01Validation?.passed === true,
  b01Validation?.status ?? "missing"
);

check(
  "personal-jobs-01-no-production-claim",
  b01Proof?.productionReady === false && b01Proof?.canClaimProduction === false,
  "PERSONAL-JOBS-01 production false"
);

const gitignore = exists(".gitignore") ? readText(".gitignore") : "";
const page = exists("apps/web/src/app/personal-job-desk/opportunities/page.tsx")
  ? readText("apps/web/src/app/personal-job-desk/opportunities/page.tsx")
  : "";
const client = exists("apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx")
  ? readText("apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx")
  : "";
const manifest = exists("manifests/personal-jobs/personal-jobs-02-local-opportunity-intake.json")
  ? readJson("manifests/personal-jobs/personal-jobs-02-local-opportunity-intake.json")
  : null;

check("gitignore-keeps-local-profile-private", gitignore.includes("data/personal-job-desk/*.local.json"), "local json ignore pattern");
check("page-route-marker", page.includes('data-kingsmen-personal-jobs-02="true"'), "page marker");
check("page-force-dynamic", page.includes('export const dynamic = "force-dynamic"'), "runtime local read");
check("page-reads-local-private-profile", page.includes("personal-candidate.local.json"), "local private profile path");
check("client-marker", client.includes('data-kingsmen-local-opportunity-tracker="true"'), "local tracker marker");
check("client-capture-marker", client.includes('data-kingsmen-external-lead-capture="true"'), "external lead capture marker");
check("client-uses-local-storage", client.includes("window.localStorage") && client.includes(localStorageKey), localStorageKey);
check("client-has-duplicate-warning", client.includes("Possible duplicate") && client.includes("duplicateLead"), "duplicate detection");
check("client-has-json-export", client.includes("Copy Local JSON Export") && client.includes("clipboard"), "manual export");
check("client-has-status-flow", ["Found", "Reviewed", "Prepared", "Applied", "Follow Up", "Interview", "Rejected", "Offer", "Closed"].every((status) => client.includes(status)), "lead statuses");
check("client-has-source-types", ["Indeed", "LinkedIn", "Company Career Page", "Facebook", "Referral", "Walk-in"].every((source) => client.includes(source)), "external sources");
check("client-has-15-cv-slots", client.includes("CV-01") && client.includes("CV-15") && client.includes("length: 15"), "15 CV slots");
check("client-has-15-motivation-slots", client.includes("ML-01") && client.includes("ML-15") && client.includes("length: 15"), "15 motivation slots");
check("client-has-proof-field", client.includes('data-kingsmen-application-proof-field="true"'), "proof note field");
check("client-has-no-send-boundary", client.includes('data-kingsmen-no-send-boundary="true"'), "no-send boundary");

check("manifest-status-built-pending-validation", manifest?.status === "BUILT_PENDING_VALIDATION", manifest?.status ?? "missing");
check("manifest-local-route", manifest?.route === route, manifest?.route ?? "missing");
check("manifest-local-storage-key", manifest?.localStorageKey === localStorageKey, manifest?.localStorageKey ?? "missing");
check("manifest-no-production-claim", manifest?.productionReady === false && manifest?.canClaimProduction === false, "manifest production false");
check("manifest-no-oracle-claim", manifest?.deployedToOracle === false, "manifest oracle false");
check("manifest-no-docker", manifest?.startsDocker === false, "manifest docker false");

const runtimeCombined = [page, client].join("\n");

const forbiddenRuntimePatterns = [
  { name: "email-send-runtime", regex: /sendEmail|createDraft|smtp|nodemailer|mailgun|postmark|resend\.emails/i },
  { name: "payment-runtime", regex: /payfast|pay_fast|checkoutSession|checkoutProvider|merchant[_-]?key|paymentProvider|processPayment|createPayment|paymentIntent/i },
  { name: "whatsapp-runtime", regex: /WHATSAPP_TOKEN|sendWhatsApp|wa\.me|api\.whatsapp\.com|whatsappBusiness|twilio/i },
  { name: "service-role-secret", regex: /service_role/i },
  { name: "payfast-passphrase", regex: /PAYFAST_PASSPHRASE/i },
  { name: "private-key-material", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { name: "oci-private-path", regex: /\.oci[\\/]/i },
  { name: "ssh-private-path", regex: /\.ssh[\\/]/i },
  { name: "docker-compose-up-runtime", regex: /\bdocker\s+compose\s+up\b/i },
  { name: "positive-oracle-claim", regex: /deployedToOracle\s*[:=]\s*true|deployedToOracle"\s*:\s*true/i },
  { name: "positive-production-claim", regex: /productionReady\s*[:=]\s*true|productionReady"\s*:\s*true/i }
];

for (const item of forbiddenRuntimePatterns) {
  check(`runtime-no-forbidden:${item.name}`, !item.regex.test(runtimeCombined), item.name);
}

let localProfile = null;
if (exists("data/personal-job-desk/personal-candidate.local.json")) {
  try {
    localProfile = readJson("data/personal-job-desk/personal-candidate.local.json");
  } catch {
    localProfile = null;
  }
}

const possibleContacts = [
  localProfile?.email,
  localProfile?.phone,
  localProfile?.contact?.email,
  localProfile?.contact?.phone
].filter((value) => typeof value === "string" && value.trim().length > 0);

let trackedFiles = [];
try {
  trackedFiles = execSync("git ls-files", { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
} catch {
  trackedFiles = [];
}

const trackedText = trackedFiles
  .filter((file) => exists(file))
  .map((file) => {
    try {
      return readText(file);
    } catch {
      return "";
    }
  })
  .join("\n");

let committedFilesContainPersonalContact = false;

for (const contact of possibleContacts) {
  const pattern = new RegExp(escapeRegExp(contact.trim()), "i");
  if (pattern.test(trackedText)) {
    committedFilesContainPersonalContact = true;
  }
}

check("committed-files-no-local-profile-contact", committedFilesContainPersonalContact === false, "local profile contact must stay untracked");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.personal-jobs-02-proof.v1",
  module: "PERSONAL-JOBS-02 - Local Job Opportunity Intake / Track External Job Leads",
  status: passed
    ? "PERSONAL_JOBS_02_LOCAL_OPPORTUNITY_INTAKE_PROVEN"
    : "PERSONAL_JOBS_02_LOCAL_OPPORTUNITY_INTAKE_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route,
  localStorageKey,
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  localPrivateProfileIgnoredByGit: gitignore.includes("data/personal-job-desk/*.local.json"),
  committedFilesContainPersonalContact,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit PERSONAL-JOBS-02 tracked files only."
    : "Repair PERSONAL-JOBS-02 opportunity intake before committing."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
