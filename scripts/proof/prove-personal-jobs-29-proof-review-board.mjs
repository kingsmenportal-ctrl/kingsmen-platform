import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-29-proof-review-board-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/proof-review-board.local.json");
const inputPath = path.join(root, "data/personal-job-desk/daily-worklist.local.json");

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
  "scripts/agents/personal-job-proof-review-board.mjs",
  "apps/web/src/app/api/personal-jobs/proof-review-board/route.ts",
  "apps/web/src/app/personal-job-desk/proof-review-board/page.tsx",
  "apps/web/src/app/personal-job-desk/proof-review-board/ProofReviewBoardClient.tsx",
  "packages/contracts/src/personal-jobs-29-proof-review-board.ts",
  "docs/personal-jobs/personal-jobs-29-proof-review-board.md",
  "manifests/personal-jobs/personal-jobs-29-proof-review-board.json",
  "scripts/proof/prove-personal-jobs-29-proof-review-board.mjs",
  "scripts/validators/validate-personal-jobs-29-proof-review-board.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj28_input_exists", fs.existsSync(inputPath), "PJ28 daily-worklist.local.json must exist before PJ29.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-proof-review-board.mjs"], {
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
check("review_items_created", Number(output?.reviewItemCount ?? 0) > 0, output?.reviewItemCount);
check("review_items_match_pj28_worklist", output?.reviewItemCount === input?.worklistItemCount, `${output?.reviewItemCount} vs ${input?.worklistItemCount}`);

const items = Array.isArray(output?.reviewItems) ? output.reviewItems : [];

const missingSections = items.filter((item) =>
  !item.reviewId ||
  !item.worklistId ||
  !item.packId ||
  !item.reviewStatus ||
  !item.context ||
  !item.proof ||
  !item.reviewDecision ||
  !item.statusAdvance ||
  !item.controls ||
  !Array.isArray(item.auditRules)
);

check("all_items_have_required_sections", missingSections.length === 0, `${missingSections.length} review items missing required sections`);

const unsafe = items.filter((item) =>
  item.safetyBoundary?.sendsApplications ||
  item.safetyBoundary?.sendsEmail ||
  item.safetyBoundary?.sendsWhatsApp ||
  item.safetyBoundary?.sendsSms ||
  item.safetyBoundary?.contactsEmployers ||
  item.safetyBoundary?.touchesPayments ||
  item.safetyBoundary?.bypassesLoginOtpCaptcha ||
  item.safetyBoundary?.autoMutatesTracker ||
  item.safetyBoundary?.autoMutatesWorklist
);

check("no_unsafe_item_actions", unsafe.length === 0, `${unsafe.length} unsafe review items`);

const badAdvance = items.filter((item) =>
  item.controls?.canAdvanceStatus &&
  (!item.proof?.proofReference || !item.statusAdvance?.advanceApproved || item.statusAdvance?.targetStatus === "NONE")
);

check("status_advance_requires_proof_and_approval", badAdvance.length === 0, `${badAdvance.length} bad advancement items`);

const badSafety = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.sendsSms ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha ||
  output?.safetyBoundary?.autoMutatesTracker ||
  output?.safetyBoundary?.autoMutatesWorklist;

check("global_safety_boundary_no_send_no_mutation", !badSafety, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-29-proof.v1",
  module: "PERSONAL-JOBS-29 - Proof Review Board / Status Advancement Control",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/daily-worklist.local.json",
  output: "data/personal-job-desk/proof-review-board.local.json",
  summary: output ? output.summary : null,
  boundaries: {
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    sendsSms: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    autoMutatesTracker: false,
    autoMutatesWorklist: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ29, then test /personal-job-desk/proof-review-board."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);