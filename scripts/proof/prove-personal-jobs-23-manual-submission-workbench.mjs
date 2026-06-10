import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-23-manual-submission-workbench-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/manual-submission-workbench.local.json");
const inputPath = path.join(root, "data/personal-job-desk/application-review-ledger.local.json");

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
  "scripts/agents/personal-job-manual-submission-workbench.mjs",
  "apps/web/src/app/api/personal-jobs/manual-submission-workbench/route.ts",
  "apps/web/src/app/personal-job-desk/manual-submission-workbench/page.tsx",
  "apps/web/src/app/personal-job-desk/manual-submission-workbench/ManualSubmissionWorkbenchClient.tsx",
  "packages/contracts/src/personal-jobs-23-manual-submission-workbench.ts",
  "docs/personal-jobs/personal-jobs-23-manual-submission-workbench.md",
  "manifests/personal-jobs/personal-jobs-23-manual-submission-workbench.json",
  "scripts/proof/prove-personal-jobs-23-manual-submission-workbench.mjs",
  "scripts/validators/validate-personal-jobs-23-manual-submission-workbench.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj22_input_exists", fs.existsSync(inputPath), "PJ22 application-review-ledger.local.json must exist before PJ23.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-manual-submission-workbench.mjs"], {
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
check("records_created", Number(output?.workbenchRecordCount ?? 0) > 0, output?.workbenchRecordCount);
check("records_match_pj22_records", output?.workbenchRecordCount === input?.reviewRecordCount, `${output?.workbenchRecordCount} vs ${input?.reviewRecordCount}`);

const records = Array.isArray(output?.records) ? output.records : [];

const missingSections = records.filter((record) =>
  !record.workbenchId ||
  !record.ledgerId ||
  !record.packId ||
  !record.execution ||
  !Array.isArray(record.checklist) ||
  record.checklist.length === 0 ||
  !Array.isArray(record.proofRules) ||
  record.proofRules.length === 0
);

check("all_records_have_required_sections", missingSections.length === 0, `${missingSections.length} records missing required sections`);

const unsafe = records.filter((record) =>
  record.safetyBoundary?.sendsApplications ||
  record.safetyBoundary?.sendsEmail ||
  record.safetyBoundary?.sendsWhatsApp ||
  record.safetyBoundary?.contactsEmployers ||
  record.safetyBoundary?.touchesPayments ||
  record.safetyBoundary?.bypassesLoginOtpCaptcha
);

check("no_unsafe_actions", unsafe.length === 0, `${unsafe.length} unsafe records`);

const badReady = records.filter((record) =>
  record.execution.executionStatus === "READY_TO_EXECUTE_MANUALLY" &&
  (!record.readiness?.candidateApproved || !record.readiness?.founderReviewed)
);

check("manual_ready_requires_approval", badReady.length === 0, `${badReady.length} bad ready records`);

const badSafety = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha;

check("global_safety_boundary_no_send", !badSafety, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-23-proof.v1",
  module: "PERSONAL-JOBS-23 - Manual Submission Execution Checklist / Follow-Up Calendar / Outcome Reporting",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/application-review-ledger.local.json",
  output: "data/personal-job-desk/manual-submission-workbench.local.json",
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
    ? "Commit PJ23, then test /personal-job-desk/manual-submission-workbench."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);