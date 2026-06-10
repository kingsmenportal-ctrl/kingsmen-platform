import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-28-daily-worklist-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-28-daily-worklist-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/daily-worklist.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-28-daily-worklist.mjs"], {
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

const items = Array.isArray(output?.worklistItems) ? output.worklistItems : [];

const unsafe = items.filter((item) =>
  item.safetyBoundary?.sendsApplications ||
  item.safetyBoundary?.sendsEmail ||
  item.safetyBoundary?.sendsWhatsApp ||
  item.safetyBoundary?.sendsSms ||
  item.safetyBoundary?.contactsEmployers ||
  item.safetyBoundary?.touchesPayments ||
  item.safetyBoundary?.bypassesLoginOtpCaptcha
);

if (unsafe.length > 0) failed.push({ name: "unsafe_worklist_items", detail: `${unsafe.length}` });
if (!output?.founderDigest?.digestId) failed.push({ name: "founder_digest_exists", detail: "missing founder digest" });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-28 - Operator Daily Worklist / Founder Action Packet Digest",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-28-daily-worklist-proof.json",
  output: "data/personal-job-desk/daily-worklist.local.json",
  summary: output ? output.summary : null,
  founderDigest: output ? {
    dailyLoad: output.founderDigest?.dailyLoad,
    actionPacketCount: output.founderDigest?.actionPackets?.length
  } : null,
  failed_checks: failed,
  warnings: [
    "PJ28 does not execute applications automatically.",
    "PJ28 does not send email, WhatsApp, SMS, or employer messages automatically.",
    "PJ28 only packages daily work and founder action packets.",
    "Manual proof and founder/operator decisions are still required."
  ],
  next_action: failed.length === 0
    ? "Commit PJ28 tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);