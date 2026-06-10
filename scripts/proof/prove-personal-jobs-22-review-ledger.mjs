import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-22-review-ledger-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/application-review-ledger.local.json");
const inputPath = path.join(root, "data/personal-job-desk/application-packs.local.json");

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
  "scripts/agents/personal-job-review-ledger.mjs",
  "apps/web/src/app/api/personal-jobs/review-ledger/route.ts",
  "apps/web/src/app/personal-job-desk/review-ledger/page.tsx",
  "apps/web/src/app/personal-job-desk/review-ledger/ReviewLedgerClient.tsx",
  "packages/contracts/src/personal-jobs-22-review-ledger.ts",
  "docs/personal-jobs/personal-jobs-22-review-ledger.md",
  "manifests/personal-jobs/personal-jobs-22-review-ledger.json",
  "scripts/proof/prove-personal-jobs-22-review-ledger.mjs",
  "scripts/validators/validate-personal-jobs-22-review-ledger.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj21_input_exists", fs.existsSync(inputPath), "PJ21 application-packs.local.json must exist before PJ22.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-review-ledger.mjs"], {
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
check("records_created", Number(output?.reviewRecordCount ?? 0) > 0, output?.reviewRecordCount);
check("records_match_pj21_packs", output?.reviewRecordCount === input?.applicationPackCount, `${output?.reviewRecordCount} vs ${input?.applicationPackCount}`);

const records = Array.isArray(output?.records) ? output.records : [];

const missingSections = records.filter((record) =>
  !record.ledgerId ||
  !record.packId ||
  !record.actionState ||
  !record.review ||
  !record.pack ||
  !Array.isArray(record.requiredBeforeManualSubmission) ||
  record.requiredBeforeManualSubmission.length === 0 ||
  !Array.isArray(record.proofLedgerRequirements) ||
  record.proofLedgerRequirements.length === 0
);

check("all_records_have_required_sections", missingSections.length === 0, `${missingSections.length} records missing required sections`);

const unsafe = records.filter((record) =>
  record.submissionBoundary?.canSendAutomatically ||
  record.submissionBoundary?.canEmailEmployer ||
  record.submissionBoundary?.canWhatsAppEmployer ||
  record.submissionBoundary?.canTouchPayments ||
  record.submissionBoundary?.canBypassLoginOtpCaptcha
);

check("no_unsafe_submission_boundary", unsafe.length === 0, `${unsafe.length} unsafe records`);

const autoReadyWithoutApproval = records.filter((record) =>
  record.actionState === "READY_FOR_MANUAL_SUBMISSION" &&
  (!record.review?.candidateApproved || !record.review?.founderReviewed)
);

check("manual_ready_requires_candidate_and_founder_approval", autoReadyWithoutApproval.length === 0, `${autoReadyWithoutApproval.length} bad ready records`);

const badSafety = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha;

check("global_safety_boundary_no_send", !badSafety, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-22-proof.v1",
  module: "PERSONAL-JOBS-22 - Human Review Selector / Proof Capture / Outcome Ledger Handoff",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/application-packs.local.json",
  output: "data/personal-job-desk/application-review-ledger.local.json",
  summary: output ? output.summary : null,
  boundaries: {
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ22, then test /personal-job-desk/review-ledger."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);