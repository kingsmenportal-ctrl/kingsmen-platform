import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-24-application-tracker-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/application-tracker.local.json");
const inputPath = path.join(root, "data/personal-job-desk/manual-submission-workbench.local.json");

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
  "scripts/agents/personal-job-application-tracker.mjs",
  "apps/web/src/app/api/personal-jobs/application-tracker/route.ts",
  "apps/web/src/app/personal-job-desk/application-tracker/page.tsx",
  "apps/web/src/app/personal-job-desk/application-tracker/ApplicationTrackerClient.tsx",
  "packages/contracts/src/personal-jobs-24-application-tracker.ts",
  "docs/personal-jobs/personal-jobs-24-application-tracker.md",
  "manifests/personal-jobs/personal-jobs-24-application-tracker.json",
  "scripts/proof/prove-personal-jobs-24-application-tracker.mjs",
  "scripts/validators/validate-personal-jobs-24-application-tracker.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj23_input_exists", fs.existsSync(inputPath), "PJ23 manual-submission-workbench.local.json must exist before PJ24.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-application-tracker.mjs"], {
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
check("items_created", Number(output?.trackerItemCount ?? 0) > 0, output?.trackerItemCount);
check("items_match_pj23_records", output?.trackerItemCount === input?.workbenchRecordCount, `${output?.trackerItemCount} vs ${input?.workbenchRecordCount}`);

const items = Array.isArray(output?.items) ? output.items : [];

const missingSections = items.filter((item) =>
  !item.trackerId ||
  !item.workbenchId ||
  !item.packId ||
  !item.candidateStatus ||
  !item.candidateMessage ||
  !item.opportunity ||
  !Array.isArray(item.progress) ||
  item.progress.length === 0 ||
  !Array.isArray(item.disclaimers) ||
  item.disclaimers.length === 0
);

check("all_items_have_required_sections", missingSections.length === 0, `${missingSections.length} items missing required sections`);

const unsafe = items.filter((item) =>
  item.safetyBoundary?.sendsApplications ||
  item.safetyBoundary?.sendsEmail ||
  item.safetyBoundary?.sendsWhatsApp ||
  item.safetyBoundary?.contactsEmployers ||
  item.safetyBoundary?.touchesPayments ||
  item.safetyBoundary?.bypassesLoginOtpCaptcha
);

check("no_unsafe_actions", unsafe.length === 0, `${unsafe.length} unsafe items`);

const guaranteeText = items.filter((item) => {
  const text = `${item.candidateMessage} ${(item.disclaimers || []).join(" ")}`.toLowerCase();
  return text.includes("guaranteed job") || text.includes("guaranteed employment") || text.includes("guaranteed offer");
});

check("no_success_guarantees", guaranteeText.length === 0, `${guaranteeText.length} guarantee-like items`);

const badSafety = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha;

check("global_safety_boundary_no_send", !badSafety, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-24-proof.v1",
  module: "PERSONAL-JOBS-24 - Candidate Application Tracker / Proof-Backed Progress View",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/manual-submission-workbench.local.json",
  output: "data/personal-job-desk/application-tracker.local.json",
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
    ? "Commit PJ24, then test /personal-job-desk/application-tracker."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);