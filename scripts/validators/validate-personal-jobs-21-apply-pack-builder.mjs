import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-21-apply-pack-builder-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-21-apply-pack-builder-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/application-packs.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-21-apply-pack-builder.mjs"], {
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

const packs = Array.isArray(output?.packs) ? output.packs : [];
const unsafe = packs.filter((pack) =>
  pack.safetyBoundary?.sendsApplications ||
  pack.safetyBoundary?.sendsEmail ||
  pack.safetyBoundary?.sendsWhatsApp ||
  pack.safetyBoundary?.contactsEmployers ||
  pack.safetyBoundary?.touchesPayments ||
  pack.safetyBoundary?.bypassesLoginOrCaptcha
);

if (unsafe.length > 0) failed.push({ name: "unsafe_pack_actions", detail: `${unsafe.length}` });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-21 - One Profile Apply Pack Builder / CV + Motivation Drafts / Manual Submission Packet",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-21-apply-pack-builder-proof.json",
  output: "data/personal-job-desk/application-packs.local.json",
  summary: output ? {
    totalReadyLeadsFromPJ20B: output.totalReadyLeadsFromPJ20B,
    applicationPackCount: output.applicationPackCount,
    readyForHumanReviewCount: output.readyForHumanReviewCount,
    needsProfileCompletionCount: output.needsProfileCompletionCount
  } : null,
  failed_checks: failed,
  warnings: [
    "PJ21 does not apply to jobs.",
    "PJ21 does not contact employers.",
    "PJ21 only creates reviewable CV/motivation/manual application packs.",
    "Candidate/founder approval is required before any real submission."
  ],
  next_action: failed.length === 0
    ? "Commit PJ21 tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);