#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const validationPath = "reports/validation/personal-jobs-02-local-opportunity-intake-latest.json";
const proofPath = "reports/personal-jobs/personal-jobs-02-local-opportunity-intake-proof.json";
const route = "/personal-job-desk/opportunities";

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/opportunities/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx",
  "docs/personal-jobs/personal-jobs-02-local-opportunity-intake.md",
  "manifests/personal-jobs/personal-jobs-02-local-opportunity-intake.json",
  "packages/contracts/src/personal-jobs-02-local-opportunity-intake.ts",
  "scripts/proof/prove-personal-jobs-02-local-opportunity-intake.mjs",
  "scripts/validators/validate-personal-jobs-02-local-opportunity-intake.mjs",
  proofPath
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

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const page = exists("apps/web/src/app/personal-job-desk/opportunities/page.tsx")
  ? readText("apps/web/src/app/personal-job-desk/opportunities/page.tsx")
  : "";

const client = exists("apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx")
  ? readText("apps/web/src/app/personal-job-desk/opportunities/OpportunityIntakeClient.tsx")
  : "";

const proof = exists(proofPath) ? readJson(proofPath) : null;

check("proof-schema", proof?.schema === "kingsmen.personal-jobs-02-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "PERSONAL_JOBS_02_LOCAL_OPPORTUNITY_INTAKE_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-no-docker", proof?.startsDocker === false, "docker false");
check("proof-route", proof?.route === route, proof?.route ?? "missing");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);
check("proof-private-contact-safe", proof?.committedFilesContainPersonalContact === false, "personal contact not committed");

check("page-marker", page.includes('data-kingsmen-personal-jobs-02="true"'), "page marker");
check("page-local-profile-read", page.includes("personal-candidate.local.json"), "local profile read");
check("client-local-storage-key", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "localStorage key");
check("client-external-lead-capture", client.includes('data-kingsmen-external-lead-capture="true"'), "capture marker");
check("client-tracker-marker", client.includes('data-kingsmen-local-opportunity-tracker="true"'), "tracker marker");
check("client-proof-field", client.includes('data-kingsmen-application-proof-field="true"'), "proof field marker");
check("client-cv-slot-field", client.includes('data-kingsmen-cv-slot-field="true"'), "CV slot marker");
check("client-motivation-slot-field", client.includes('data-kingsmen-motivation-slot-field="true"'), "motivation slot marker");
check("client-no-send-boundary", client.includes('data-kingsmen-no-send-boundary="true"'), "no send marker");

const forbiddenRuntimePatterns = [
  { name: "email-send-runtime", regex: /sendEmail|createDraft|smtp|nodemailer|mailgun|postmark|resend\.emails/i },
  { name: "payment-runtime", regex: /payfast|pay_fast|checkoutSession|checkoutProvider|merchant[_-]?key|paymentProvider|processPayment|createPayment|paymentIntent/i },
  { name: "whatsapp-runtime", regex: /WHATSAPP_TOKEN|sendWhatsApp|wa\.me|api\.whatsapp\.com|whatsappBusiness|twilio/i },
  { name: "positive-oracle-claim", regex: /deployedToOracle\s*[:=]\s*true|deployedToOracle"\s*:\s*true/i },
  { name: "positive-production-claim", regex: /productionReady\s*[:=]\s*true|productionReady"\s*:\s*true/i }
];

const runtimeCombined = [page, client].join("\n");
for (const item of forbiddenRuntimePatterns) {
  check(`runtime-no-forbidden:${item.name}`, !item.regex.test(runtimeCombined), item.name);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-02 - Local Job Opportunity Intake / Track External Job Leads",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [
    "Opportunity leads are stored in browser localStorage for local founder use.",
    "This does not send applications or messages; proof notes remain manually entered."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route,
  local_storage_key: "kingsmen.personalJobs02.externalLeads.v1",
  proof: proofPath,
  next_action: passed
    ? "Commit PERSONAL-JOBS-02 tracked files only."
    : "Repair PERSONAL-JOBS-02 before moving forward."
};

fs.mkdirSync(path.dirname(full(validationPath)), { recursive: true });
fs.writeFileSync(full(validationPath), `${JSON.stringify(validation, null, 2)}\n`, "utf8");

console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
