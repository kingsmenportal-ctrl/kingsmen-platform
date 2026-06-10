import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-32-public-snapshot-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-32-public-snapshot-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/public-snapshot.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-32-public-snapshot.mjs"], {
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

const items = Array.isArray(output?.snapshotItems) ? output.snapshotItems : [];

const unsafe = items.filter((item) =>
  item.safetyBoundary?.sendsApplications ||
  item.safetyBoundary?.sendsEmail ||
  item.safetyBoundary?.sendsWhatsApp ||
  item.safetyBoundary?.sendsSms ||
  item.safetyBoundary?.contactsEmployers ||
  item.safetyBoundary?.touchesPayments ||
  item.safetyBoundary?.bypassesLoginOtpCaptcha ||
  item.safetyBoundary?.autoMutatesApplicationTracker ||
  item.safetyBoundary?.autoMutatesProofBoard ||
  item.safetyBoundary?.exposesSensitiveProof
);

if (unsafe.length > 0) failed.push({ name: "unsafe_snapshot_items", detail: `${unsafe.length}` });

const exposedSensitive = items.filter((item) =>
  item.evidence?.visibility === "INTERNAL_ONLY_REDACTED" &&
  (item.evidence?.proofReference || item.evidence?.proofLocation)
);

if (exposedSensitive.length > 0) failed.push({ name: "sensitive_proof_exposed", detail: `${exposedSensitive.length}` });
if (!output?.exportReport?.body) failed.push({ name: "export_report_exists", detail: "missing export report body" });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-32 - Candidate-Safe Public Job Desk Snapshot / Exportable Progress Report",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-32-public-snapshot-proof.json",
  output: "data/personal-job-desk/public-snapshot.local.json",
  summary: output ? output.summary : null,
  failed_checks: failed,
  warnings: [
    "PJ32 is read-only.",
    "PJ32 does not expose sensitive proof.",
    "PJ32 does not submit applications or contact employers.",
    "PJ32 does not guarantee employment, interview, offer, funding, or response."
  ],
  next_action: failed.length === 0
    ? "Commit PJ32 tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);