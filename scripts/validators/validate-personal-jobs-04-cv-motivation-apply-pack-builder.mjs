import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofPath = path.join(root, "reports", "personal-jobs", "personal-jobs-04-cv-motivation-apply-pack-builder-proof.json");
const validationPath = path.join(root, "reports", "validation", "personal-jobs-04-cv-motivation-apply-pack-builder-latest.json");

const filesExpected = [
  "apps/web/src/app/personal-job-desk/apply-pack/page.tsx",
  "apps/web/src/app/personal-job-desk/apply-pack/ApplyPackBuilderClient.tsx",
  "docs/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder.md",
  "manifests/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder.json",
  "packages/contracts/src/personal-jobs-04-cv-motivation-apply-pack-builder.ts",
  "scripts/proof/prove-personal-jobs-04-cv-motivation-apply-pack-builder.mjs",
  "scripts/validators/validate-personal-jobs-04-cv-motivation-apply-pack-builder.mjs",
  "reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json"
];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const failedChecks = [];

for (const file of filesExpected) {
  if (!exists(file)) failedChecks.push({ name: `expected-file:${file}`, passed: false, detail: file });
}

let proof = {};

try {
  proof = JSON.parse(fs.readFileSync(proofPath, "utf8").replace(/^\uFEFF/, ""));
} catch (error) {
  failedChecks.push({ name: "proof-readable", passed: false, detail: error.message });
}

if (proof.status !== "PERSONAL_JOBS_04_CV_MOTIVATION_APPLY_PACK_BUILDER_PROVEN") {
  failedChecks.push({ name: "proof-status", passed: false, detail: proof.status ?? "missing" });
}

if (proof.passed !== true) {
  failedChecks.push({ name: "proof-passed", passed: false, detail: String(proof.passed) });
}

if (Array.isArray(proof.failed) && proof.failed.length > 0) {
  failedChecks.push({ name: "proof-no-failed-checks", passed: false, detail: `failed=${proof.failed.length}` });
}

if (proof.cvSlots !== 15 || proof.motivationLetterSlots !== 15) {
  failedChecks.push({ name: "slot-counts", passed: false, detail: `cv=${proof.cvSlots}, ml=${proof.motivationLetterSlots}` });
}

if (proof.sendsApplications !== false || proof.sendsEmail !== false || proof.sendsWhatsApp !== false || proof.touchesPayments !== false) {
  failedChecks.push({ name: "no-send-no-payment-boundary", passed: false, detail: "send/payment boundary failed" });
}

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-04 - CV & Motivation Letter Apply Pack Builder",
  status: failedChecks.length === 0 ? "VALIDATED" : "FAILED",
  passed: failedChecks.length === 0,
  generated_at: new Date().toISOString(),
  files_checked: filesExpected.length,
  missing_files: filesExpected.filter((file) => !exists(file)),
  failed_checks: failedChecks,
  warnings: [
    "Apply packs are local drafts only; final applications require manual human review.",
    "This module does not send applications, emails, WhatsApps, payments, or portal submissions.",
    "Generated CV and motivation wording must remain truthful and must not invent candidate facts."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk/apply-pack",
  reads_local_storage_key: "kingsmen.personalJobs03.shortlist.v1",
  writes_local_storage_key: "kingsmen.personalJobs04.applyPacks.v1",
  proof: "reports/personal-jobs/personal-jobs-04-cv-motivation-apply-pack-builder-proof.json",
  next_action: failedChecks.length === 0
    ? "Commit PERSONAL-JOBS-04 tracked files only."
    : "Repair PERSONAL-JOBS-04 before moving forward."
};

fs.mkdirSync(path.dirname(validationPath), { recursive: true });
fs.writeFileSync(validationPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!report.passed) process.exit(1);