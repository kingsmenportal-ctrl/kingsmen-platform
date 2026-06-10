import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-30-status-advancement-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-30-status-advancement-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/status-advancement-audit.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-30-status-advancement.mjs"], {
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

const records = Array.isArray(output?.advancementRecords) ? output.advancementRecords : [];

const unsafe = records.filter((record) =>
  record.safetyBoundary?.sendsApplications ||
  record.safetyBoundary?.sendsEmail ||
  record.safetyBoundary?.sendsWhatsApp ||
  record.safetyBoundary?.sendsSms ||
  record.safetyBoundary?.contactsEmployers ||
  record.safetyBoundary?.touchesPayments ||
  record.safetyBoundary?.bypassesLoginOtpCaptcha ||
  record.safetyBoundary?.autoMutatesApplicationTracker ||
  record.safetyBoundary?.autoMutatesProofBoard
);

if (unsafe.length > 0) failed.push({ name: "unsafe_advancement_records", detail: `${unsafe.length}` });

const badRecordable = records.filter((record) =>
  record.controls?.canRecordAuditMirror &&
  (!record.proofReference || !record.advanceApproved || record.targetStatus === "NONE")
);

if (badRecordable.length > 0) failed.push({ name: "bad_recording_gate", detail: `${badRecordable.length}` });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-30 - Status Advancement Writer / Audit Mirror",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-30-status-advancement-proof.json",
  output: "data/personal-job-desk/status-advancement-audit.local.json",
  summary: output ? output.summary : null,
  failed_checks: failed,
  warnings: [
    "PJ30 writes an audit mirror only.",
    "PJ30 does not mutate PJ24 application tracker automatically.",
    "PJ30 does not mutate PJ29 proof review board automatically.",
    "PJ30 does not send email, WhatsApp, SMS, or employer messages automatically."
  ],
  next_action: failed.length === 0
    ? "Commit PJ30 tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);