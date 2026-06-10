import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-26-response-library-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-26-response-library-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/response-library.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-26-response-library.mjs"], {
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

const workflows = Array.isArray(output?.responseWorkflows) ? output.responseWorkflows : [];

const unsafe = workflows.filter((workflow) =>
  workflow.safetyBoundary?.sendsApplications ||
  workflow.safetyBoundary?.sendsEmail ||
  workflow.safetyBoundary?.sendsWhatsApp ||
  workflow.safetyBoundary?.sendsSms ||
  workflow.safetyBoundary?.contactsEmployers ||
  workflow.safetyBoundary?.touchesPayments ||
  workflow.safetyBoundary?.bypassesLoginOtpCaptcha
);

if (unsafe.length > 0) failed.push({ name: "unsafe_actions", detail: `${unsafe.length}` });

const sentWithoutProof = workflows.filter((workflow) =>
  workflow.responseStatus === "MANUAL_SEND_PROOF_CAPTURED" &&
  !workflow.manualSend?.manualSendProof
);

if (sentWithoutProof.length > 0) failed.push({ name: "manual_sent_without_proof", detail: `${sentWithoutProof.length}` });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-26 - Operator Response Library / Reusable Templates / Manual-Send Proof Workflow",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-26-response-library-proof.json",
  output: "data/personal-job-desk/response-library.local.json",
  summary: output ? output.summary : null,
  failed_checks: failed,
  warnings: [
    "PJ26 does not send email, WhatsApp, SMS, or employer messages automatically.",
    "PJ26 only creates response templates and manual-send proof workflow.",
    "Operator responses must not guarantee employment, interview, offer, funding, or response.",
    "Manual-send proof is required when response is marked sent."
  ],
  next_action: failed.length === 0
    ? "Commit PJ26 tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);