import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-22-review-ledger-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-22-review-ledger-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/application-review-ledger.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-22-review-ledger.mjs"], {
  cwd: root,
  encoding: "utf8",
  timeout: 90000,
  maxBuffer: 1024 * 1024 * 30,
  stdio: "inherit"
});

const failed = [];
if (proofRun.status !== 0) failed.push({ name: "proof_exit_zero", detail: `exit ${proofRun.status}` });
if (!fs.existsSync(proofPath)) failed.push({ name: "proof_exists", detail: proofPath });
if (!fs.existsSync(outputPath)) failed.push({ name: "output_exists", detail: outputPath });

let proof = null;
let output = null;

try { proof = JSON.parse(fs.readFileSync(proofPath, "utf8")); } catch {}
try { output = JSON.parse(fs.readFileSync(outputPath, "utf8")); } catch {}

if (proof?.passed !== true) failed.push({ name: "proof_passed", detail: String(proof?.passed) });
if (output?.status !== "COMPLETED") failed.push({ name: "output_completed", detail: String(output?.status) });

const records = Array.isArray(output?.records) ? output.records : [];

const unsafe = records.filter((record) =>
  record.submissionBoundary?.canSendAutomatically ||
  record.submissionBoundary?.canEmailEmployer ||
  record.submissionBoundary?.canWhatsAppEmployer ||
  record.submissionBoundary?.canTouchPayments ||
  record.submissionBoundary?.canBypassLoginOtpCaptcha
);

if (unsafe.length > 0) failed.push({ name: "unsafe_submission_boundary", detail: `${unsafe.length}` });

const badReady = records.filter((record) =>
  record.actionState === "READY_FOR_MANUAL_SUBMISSION" &&
  (!record.review?.candidateApproved || !record.review?.founderReviewed)
);

if (badReady.length > 0) failed.push({ name: "manual_ready_without_approval", detail: `${badReady.length}` });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-22 - Human Review Selector / Proof Capture / Outcome Ledger Handoff",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-22-review-ledger-proof.json",
  output: "data/personal-job-desk/application-review-ledger.local.json",
  summary: output ? output.summary : null,
  failed_checks: failed,
  warnings: [
    "PJ22 does not apply to jobs.",
    "PJ22 does not contact employers.",
    "PJ22 only records review, approval, proof, and outcomes.",
    "Manual submission readiness requires both candidate approval and founder/operator review."
  ],
  next_action: failed.length === 0
    ? "Commit PJ22 tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);