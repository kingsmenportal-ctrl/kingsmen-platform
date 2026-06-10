import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-30-status-advancement-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/status-advancement-audit.local.json");
const inputPath = path.join(root, "data/personal-job-desk/proof-review-board.local.json");

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

function writeProof(proof) {
  fs.mkdirSync(path.dirname(proofPath), { recursive: true });
  fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
}

const checks = [];
function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail: String(detail ?? "") });
}

const files = [
  "scripts/agents/personal-job-status-advancement.mjs",
  "apps/web/src/app/api/personal-jobs/status-advancement/route.ts",
  "apps/web/src/app/personal-job-desk/status-advancement/page.tsx",
  "apps/web/src/app/personal-job-desk/status-advancement/StatusAdvancementClient.tsx",
  "packages/contracts/src/personal-jobs-30-status-advancement.ts",
  "docs/personal-jobs/personal-jobs-30-status-advancement.md",
  "manifests/personal-jobs/personal-jobs-30-status-advancement.json",
  "scripts/proof/prove-personal-jobs-30-status-advancement.mjs",
  "scripts/validators/validate-personal-jobs-30-status-advancement.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj29_input_exists", fs.existsSync(inputPath), "PJ29 proof-review-board.local.json must exist before PJ30.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-status-advancement.mjs"], {
  cwd: root,
  encoding: "utf8",
  timeout: 90000,
  maxBuffer: 1024 * 1024 * 30
});

check("agent_exit_zero", run.status === 0, run.stderr || run.stdout);
check("output_written", fs.existsSync(outputPath), outputPath);

let input = null;
let output = null;

try { input = JSON.parse(fs.readFileSync(inputPath, "utf8")); } catch {}
try { output = JSON.parse(fs.readFileSync(outputPath, "utf8")); } catch {}

check("input_completed", input?.status === "COMPLETED", input?.status);
check("output_completed", output?.status === "COMPLETED", output?.status);
check("advancement_records_created", Number(output?.advancementRecordCount ?? 0) > 0, output?.advancementRecordCount);
check("records_match_pj29_reviews", output?.advancementRecordCount === input?.reviewItemCount, `${output?.advancementRecordCount} vs ${input?.reviewItemCount}`);

const records = Array.isArray(output?.advancementRecords) ? output.advancementRecords : [];

const missingSections = records.filter((record) =>
  !record.advancementId ||
  !record.reviewId ||
  !record.packId ||
  !record.recordStatus ||
  !record.targetStatus ||
  !record.context ||
  !record.auditMirror ||
  !record.candidateFacing ||
  !record.controls ||
  !Array.isArray(record.auditRules)
);

check("all_records_have_required_sections", missingSections.length === 0, `${missingSections.length} records missing required sections`);

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

check("no_unsafe_record_actions", unsafe.length === 0, `${unsafe.length} unsafe advancement records`);

const badRecordable = records.filter((record) =>
  record.controls?.canRecordAuditMirror &&
  (!record.proofReference || !record.advanceApproved || record.targetStatus === "NONE")
);

check("recording_requires_proof_approval_target", badRecordable.length === 0, `${badRecordable.length} bad recordable records`);

const badGlobal = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.sendsSms ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha ||
  output?.safetyBoundary?.autoMutatesApplicationTracker ||
  output?.safetyBoundary?.autoMutatesProofBoard;

check("global_safety_boundary_no_send_no_mutation", !badGlobal, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-30-proof.v1",
  module: "PERSONAL-JOBS-30 - Status Advancement Writer / Audit Mirror",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/proof-review-board.local.json",
  output: "data/personal-job-desk/status-advancement-audit.local.json",
  summary: output ? output.summary : null,
  boundaries: {
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    sendsSms: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    autoMutatesApplicationTracker: false,
    autoMutatesProofBoard: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ30, then test /personal-job-desk/status-advancement."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);