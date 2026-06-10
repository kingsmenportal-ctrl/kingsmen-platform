import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-33-document-pack-index-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-33-document-pack-index-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/document-pack-index.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-33-document-pack-index.mjs"], {
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

const packs = Array.isArray(output?.documentPacks) ? output.documentPacks : [];

const unsafe = packs.filter((pack) =>
  pack.safetyBoundary?.createsDocuments ||
  pack.safetyBoundary?.fabricatesDocuments ||
  pack.safetyBoundary?.exposesSensitiveProof ||
  pack.safetyBoundary?.sendsApplications ||
  pack.safetyBoundary?.sendsEmail ||
  pack.safetyBoundary?.sendsWhatsApp ||
  pack.safetyBoundary?.sendsSms ||
  pack.safetyBoundary?.contactsEmployers ||
  pack.safetyBoundary?.touchesPayments ||
  pack.safetyBoundary?.bypassesLoginOtpCaptcha
);

if (unsafe.length > 0) failed.push({ name: "unsafe_document_packs", detail: `${unsafe.length}` });
if (!output?.exportIndex?.body) failed.push({ name: "export_index_exists", detail: "missing export index body" });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-33 - Candidate Document Pack Index / Application Evidence Attachment Map",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-33-document-pack-index-proof.json",
  output: "data/personal-job-desk/document-pack-index.local.json",
  summary: output ? output.summary : null,
  failed_checks: failed,
  warnings: [
    "PJ33 does not create, invent, or alter official/candidate documents.",
    "PJ33 does not expose sensitive proof.",
    "PJ33 does not submit applications or contact employers.",
    "PJ33 only indexes document readiness and evidence attachment mapping."
  ],
  next_action: failed.length === 0
    ? "Commit PJ33 tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);