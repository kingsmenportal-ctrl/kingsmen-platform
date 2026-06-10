import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-28-daily-worklist-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/daily-worklist.local.json");
const inputPath = path.join(root, "data/personal-job-desk/readiness-priority-queue.local.json");

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
  "scripts/agents/personal-job-daily-worklist.mjs",
  "apps/web/src/app/api/personal-jobs/daily-worklist/route.ts",
  "apps/web/src/app/personal-job-desk/daily-worklist/page.tsx",
  "apps/web/src/app/personal-job-desk/daily-worklist/DailyWorklistClient.tsx",
  "packages/contracts/src/personal-jobs-28-daily-worklist.ts",
  "docs/personal-jobs/personal-jobs-28-daily-worklist.md",
  "manifests/personal-jobs/personal-jobs-28-daily-worklist.json",
  "scripts/proof/prove-personal-jobs-28-daily-worklist.mjs",
  "scripts/validators/validate-personal-jobs-28-daily-worklist.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj27_input_exists", fs.existsSync(inputPath), "PJ27 readiness-priority-queue.local.json must exist before PJ28.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-daily-worklist.mjs"], {
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
check("worklist_items_created", Number(output?.worklistItemCount ?? 0) > 0, output?.worklistItemCount);
check("worklist_items_match_pj27_queue", output?.worklistItemCount === input?.queueItemCount, `${output?.worklistItemCount} vs ${input?.queueItemCount}`);
check("founder_digest_created", Boolean(output?.founderDigest?.digestId), output?.founderDigest?.digestId);
check("action_packets_created", Array.isArray(output?.founderDigest?.actionPackets), output?.founderDigest?.actionPackets?.length);

const items = Array.isArray(output?.worklistItems) ? output.worklistItems : [];

const missingSections = items.filter((item) =>
  !item.worklistId ||
  !item.queueId ||
  !item.packId ||
  !item.workDate ||
  !item.workSlot ||
  !item.worklistStatus ||
  !item.actionPacket ||
  !item.operatorProgress ||
  !item.founderDecision ||
  !item.readinessGate
);

check("all_items_have_required_sections", missingSections.length === 0, `${missingSections.length} worklist items missing required sections`);

const unsafe = items.filter((item) =>
  item.safetyBoundary?.sendsApplications ||
  item.safetyBoundary?.sendsEmail ||
  item.safetyBoundary?.sendsWhatsApp ||
  item.safetyBoundary?.sendsSms ||
  item.safetyBoundary?.contactsEmployers ||
  item.safetyBoundary?.touchesPayments ||
  item.safetyBoundary?.bypassesLoginOtpCaptcha
);

check("no_unsafe_item_actions", unsafe.length === 0, `${unsafe.length} unsafe worklist items`);

const badSafety = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.sendsSms ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha ||
  output?.founderDigest?.safetyBoundary?.sendsApplications ||
  output?.founderDigest?.safetyBoundary?.sendsEmail ||
  output?.founderDigest?.safetyBoundary?.sendsWhatsApp ||
  output?.founderDigest?.safetyBoundary?.sendsSms;

check("global_safety_boundary_no_send", !badSafety, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-28-proof.v1",
  module: "PERSONAL-JOBS-28 - Operator Daily Worklist / Founder Action Packet Digest",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/readiness-priority-queue.local.json",
  output: "data/personal-job-desk/daily-worklist.local.json",
  summary: output ? output.summary : null,
  founderDigest: output ? {
    dailyLoad: output.founderDigest?.dailyLoad,
    actionPacketCount: output.founderDigest?.actionPackets?.length
  } : null,
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
    ? "Commit PJ28, then test /personal-job-desk/daily-worklist."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);