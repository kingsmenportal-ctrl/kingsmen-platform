import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-31-status-timeline-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/status-timeline.local.json");
const inputPath = path.join(root, "data/personal-job-desk/status-advancement-audit.local.json");

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
  "scripts/agents/personal-job-status-timeline.mjs",
  "apps/web/src/app/api/personal-jobs/status-timeline/route.ts",
  "apps/web/src/app/personal-job-desk/status-timeline/page.tsx",
  "apps/web/src/app/personal-job-desk/status-timeline/StatusTimelineClient.tsx",
  "packages/contracts/src/personal-jobs-31-status-timeline.ts",
  "docs/personal-jobs/personal-jobs-31-status-timeline.md",
  "manifests/personal-jobs/personal-jobs-31-status-timeline.json",
  "scripts/proof/prove-personal-jobs-31-status-timeline.mjs",
  "scripts/validators/validate-personal-jobs-31-status-timeline.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj30_input_exists", fs.existsSync(inputPath), "PJ30 status-advancement-audit.local.json must exist before PJ31.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-status-timeline.mjs"], {
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
check("timeline_items_created", Number(output?.timelineItemCount ?? 0) > 0, output?.timelineItemCount);
check("items_match_pj30_records", output?.timelineItemCount === input?.advancementRecordCount, `${output?.timelineItemCount} vs ${input?.advancementRecordCount}`);

const items = Array.isArray(output?.timelineItems) ? output.timelineItems : [];

const missingSections = items.filter((item) =>
  !item.timelineId ||
  !item.advancementId ||
  !item.packId ||
  !item.timelineStatus ||
  !item.evidenceLevel ||
  !item.candidateSummary ||
  !item.evidence ||
  !item.candidateMessage ||
  !Array.isArray(item.progressSteps) ||
  !Array.isArray(item.visibleRules)
);

check("all_items_have_required_sections", missingSections.length === 0, `${missingSections.length} timeline items missing required sections`);

const unsafe = items.filter((item) =>
  item.safetyBoundary?.sendsApplications ||
  item.safetyBoundary?.sendsEmail ||
  item.safetyBoundary?.sendsWhatsApp ||
  item.safetyBoundary?.sendsSms ||
  item.safetyBoundary?.contactsEmployers ||
  item.safetyBoundary?.touchesPayments ||
  item.safetyBoundary?.bypassesLoginOtpCaptcha ||
  item.safetyBoundary?.autoMutatesApplicationTracker ||
  item.safetyBoundary?.autoMutatesProofBoard
);

check("no_unsafe_timeline_actions", unsafe.length === 0, `${unsafe.length} unsafe timeline items`);

const guaranteeText = items.filter((item) => {
  const text = `${item.candidateSummary} ${item.candidateMessage?.draft || ""}`.toLowerCase();
  return text.includes("guaranteed job") || text.includes("guaranteed employment") || text.includes("guaranteed offer");
});

check("no_success_guarantees", guaranteeText.length === 0, `${guaranteeText.length} guarantee-like timeline items`);

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
  schema: "kingsmen.personal-jobs-31-proof.v1",
  module: "PERSONAL-JOBS-31 - Candidate Status Timeline / Evidence-Readable Dashboard",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/status-advancement-audit.local.json",
  output: "data/personal-job-desk/status-timeline.local.json",
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
    ? "Commit PJ31, then test /personal-job-desk/status-timeline."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);