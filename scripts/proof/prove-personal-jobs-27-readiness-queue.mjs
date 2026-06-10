import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-27-readiness-queue-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/readiness-priority-queue.local.json");
const inputPath = path.join(root, "data/personal-job-desk/response-library.local.json");

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
  "scripts/agents/personal-job-readiness-queue.mjs",
  "apps/web/src/app/api/personal-jobs/readiness-queue/route.ts",
  "apps/web/src/app/personal-job-desk/readiness-queue/page.tsx",
  "apps/web/src/app/personal-job-desk/readiness-queue/ReadinessQueueClient.tsx",
  "packages/contracts/src/personal-jobs-27-readiness-queue.ts",
  "docs/personal-jobs/personal-jobs-27-readiness-queue.md",
  "manifests/personal-jobs/personal-jobs-27-readiness-queue.json",
  "scripts/proof/prove-personal-jobs-27-readiness-queue.mjs",
  "scripts/validators/validate-personal-jobs-27-readiness-queue.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj26_input_exists", fs.existsSync(inputPath), "PJ26 response-library.local.json must exist before PJ27.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-readiness-queue.mjs"], {
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
check("queue_items_created", Number(output?.queueItemCount ?? 0) > 0, output?.queueItemCount);
check("queue_items_match_pj26_workflows", output?.queueItemCount === input?.responseWorkflowCount, `${output?.queueItemCount} vs ${input?.responseWorkflowCount}`);

const items = Array.isArray(output?.queueItems) ? output.queueItems : [];

const missingSections = items.filter((item) =>
  !item.queueId ||
  !item.workflowId ||
  !item.packId ||
  !item.queueStatus ||
  !item.priorityBand ||
  typeof item.priorityScore !== "number" ||
  !item.context ||
  !item.actionPacket ||
  !item.readinessGate ||
  !Array.isArray(item.nextAllowedActions)
);

check("all_items_have_required_sections", missingSections.length === 0, `${missingSections.length} queue items missing required sections`);

const unsafe = items.filter((item) =>
  item.readinessGate?.canAutoExecute ||
  item.readinessGate?.canAutoContactEmployer ||
  item.readinessGate?.canAutoSendCandidateMessage ||
  item.readinessGate?.canTouchPayments ||
  item.readinessGate?.canBypassLoginOtpCaptcha
);

check("readiness_gate_blocks_auto_actions", unsafe.length === 0, `${unsafe.length} unsafe readiness gates`);

const badSafety = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.sendsSms ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha;

check("global_safety_boundary_no_send", !badSafety, JSON.stringify(output?.safetyBoundary ?? null));

const badPriority = items.filter((item) => item.priorityScore < 0 || item.priorityScore > 100);
check("priority_score_range_valid", badPriority.length === 0, `${badPriority.length} bad priority scores`);

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-27-proof.v1",
  module: "PERSONAL-JOBS-27 - Application Readiness Governor / Priority Queue for Manual Execution",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/response-library.local.json",
  output: "data/personal-job-desk/readiness-priority-queue.local.json",
  summary: output ? output.summary : null,
  boundaries: {
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    sendsSms: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ27, then test /personal-job-desk/readiness-queue."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);