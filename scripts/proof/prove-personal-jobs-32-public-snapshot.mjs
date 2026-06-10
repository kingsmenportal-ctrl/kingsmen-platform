import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-32-public-snapshot-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/public-snapshot.local.json");
const inputPath = path.join(root, "data/personal-job-desk/status-timeline.local.json");

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
  "scripts/agents/personal-job-public-snapshot.mjs",
  "apps/web/src/app/api/personal-jobs/public-snapshot/route.ts",
  "apps/web/src/app/personal-job-desk/public-snapshot/page.tsx",
  "apps/web/src/app/personal-job-desk/public-snapshot/PublicSnapshotClient.tsx",
  "packages/contracts/src/personal-jobs-32-public-snapshot.ts",
  "docs/personal-jobs/personal-jobs-32-public-snapshot.md",
  "manifests/personal-jobs/personal-jobs-32-public-snapshot.json",
  "scripts/proof/prove-personal-jobs-32-public-snapshot.mjs",
  "scripts/validators/validate-personal-jobs-32-public-snapshot.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj31_input_exists", fs.existsSync(inputPath), "PJ31 status-timeline.local.json must exist before PJ32.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-public-snapshot.mjs"], {
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
check("snapshot_items_created", Number(output?.snapshotItemCount ?? 0) > 0, output?.snapshotItemCount);
check("items_match_pj31_timeline", output?.snapshotItemCount === input?.timelineItemCount, `${output?.snapshotItemCount} vs ${input?.timelineItemCount}`);
check("export_report_created", Boolean(output?.exportReport?.body), output?.exportReport?.filename);

const items = Array.isArray(output?.snapshotItems) ? output.snapshotItems : [];

const missingSections = items.filter((item) =>
  !item.snapshotItemId ||
  !item.timelineId ||
  !item.packId ||
  !item.publicStatus ||
  !item.candidateSummary ||
  !item.opportunity ||
  !item.evidence ||
  !item.candidateMessage ||
  !Array.isArray(item.progressSteps) ||
  !Array.isArray(item.candidateSafeRules)
);

check("all_items_have_required_sections", missingSections.length === 0, `${missingSections.length} snapshot items missing required sections`);

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

check("no_unsafe_snapshot_actions", unsafe.length === 0, `${unsafe.length} unsafe snapshot items`);

const exposedSensitive = items.filter((item) =>
  item.evidence?.visibility === "INTERNAL_ONLY_REDACTED" &&
  (item.evidence?.proofReference || item.evidence?.proofLocation)
);

check("sensitive_proof_redacted", exposedSensitive.length === 0, `${exposedSensitive.length} sensitive proof leaks`);

const guaranteeText = items.filter((item) => {
  const text = `${item.candidateSummary} ${item.candidateMessage?.message || ""} ${(item.candidateSafeRules || []).join(" ")}`.toLowerCase();
  return text.includes("guaranteed job") || text.includes("guaranteed employment") || text.includes("guaranteed offer");
});

check("no_success_guarantees", guaranteeText.length === 0, `${guaranteeText.length} guarantee-like snapshot items`);

const badGlobal = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.sendsSms ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha ||
  output?.safetyBoundary?.autoMutatesApplicationTracker ||
  output?.safetyBoundary?.autoMutatesProofBoard ||
  output?.safetyBoundary?.exposesSensitiveProof;

check("global_safety_boundary_no_send_no_leak", !badGlobal, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-32-proof.v1",
  module: "PERSONAL-JOBS-32 - Candidate-Safe Public Job Desk Snapshot / Exportable Progress Report",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/status-timeline.local.json",
  output: "data/personal-job-desk/public-snapshot.local.json",
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
    exposesSensitiveProof: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ32, then test /personal-job-desk/public-snapshot."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);