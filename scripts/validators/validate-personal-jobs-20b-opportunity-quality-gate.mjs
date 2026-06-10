import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-20b-opportunity-quality-gate-proof.json");
const validationPath = path.join(root, "reports/validation/personal-jobs-20b-opportunity-quality-gate-latest.json");
const outputPath = path.join(root, "data/personal-job-desk/opportunity-quality-gate.local.json");

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const proofRun = spawnSync(process.execPath, ["scripts/proof/prove-personal-jobs-20b-opportunity-quality-gate.mjs"], {
  cwd: root,
  encoding: "utf8",
  timeout: 90000,
  maxBuffer: 1024 * 1024 * 20,
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

const ready = Array.isArray(output?.readyForApplyPack) ? output.readyForApplyPack : [];
const invalid = ready.filter((lead) => {
  const blob = `${lead.title} ${lead.company} ${lead.sourceName} ${lead.sourceUrl} ${lead.notes}`.toLowerCase();
  return blob.includes("search landing") || blob.includes("z83") || blob.includes("application form") || blob.includes("/login") || blob.includes("/register") || blob.includes("captcha");
});

if (invalid.length > 0) failed.push({ name: "invalid_ready_leads", detail: `${invalid.length}` });

const result = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-20B - Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  proof: "reports/personal-jobs/personal-jobs-20b-opportunity-quality-gate-proof.json",
  output: "data/personal-job-desk/opportunity-quality-gate.local.json",
  summary: output ? {
    total: output.total,
    readyForApplyPackCount: output.readyForApplyPackCount,
    blockedFromApplyPackCount: output.blockedFromApplyPackCount,
    stateCounts: output.stateCounts,
    gateTypeCounts: output.gateTypeCounts
  } : null,
  failed_checks: failed,
  warnings: [
    "PJ20B does not apply to jobs.",
    "PJ20B does not contact employers.",
    "PJ20B only filters the PJ20 queue before apply-pack generation."
  ],
  next_action: failed.length === 0
    ? "Commit PJ20B tracked files and test the local UI."
    : "Repair failed checks."
};

writeJson(validationPath, result);
console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);