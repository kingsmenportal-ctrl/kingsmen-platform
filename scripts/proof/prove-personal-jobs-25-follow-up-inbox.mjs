import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-25-follow-up-inbox-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/follow-up-inbox.local.json");
const inputPath = path.join(root, "data/personal-job-desk/application-tracker.local.json");

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
  "scripts/agents/personal-job-follow-up-inbox.mjs",
  "apps/web/src/app/api/personal-jobs/follow-up-inbox/route.ts",
  "apps/web/src/app/personal-job-desk/follow-up-inbox/page.tsx",
  "apps/web/src/app/personal-job-desk/follow-up-inbox/FollowUpInboxClient.tsx",
  "packages/contracts/src/personal-jobs-25-follow-up-inbox.ts",
  "docs/personal-jobs/personal-jobs-25-follow-up-inbox.md",
  "manifests/personal-jobs/personal-jobs-25-follow-up-inbox.json",
  "scripts/proof/prove-personal-jobs-25-follow-up-inbox.mjs",
  "scripts/validators/validate-personal-jobs-25-follow-up-inbox.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj24_input_exists", fs.existsSync(inputPath), "PJ24 application-tracker.local.json must exist before PJ25.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-follow-up-inbox.mjs"], {
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
check("threads_created", Number(output?.threadCount ?? 0) > 0, output?.threadCount);
check("threads_match_pj24_items", output?.threadCount === input?.trackerItemCount, `${output?.threadCount} vs ${input?.trackerItemCount}`);

const threads = Array.isArray(output?.threads) ? output.threads : [];

const missingSections = threads.filter((thread) =>
  !thread.threadId ||
  !thread.trackerId ||
  !thread.packId ||
  !thread.threadStatus ||
  !thread.questionCategory ||
  !thread.candidate ||
  !thread.context ||
  !thread.operator ||
  !Array.isArray(thread.responseRules) ||
  thread.responseRules.length === 0
);

check("all_threads_have_required_sections", missingSections.length === 0, `${missingSections.length} threads missing required sections`);

const unsafe = threads.filter((thread) =>
  thread.safetyBoundary?.sendsApplications ||
  thread.safetyBoundary?.sendsEmail ||
  thread.safetyBoundary?.sendsWhatsApp ||
  thread.safetyBoundary?.sendsSms ||
  thread.safetyBoundary?.contactsEmployers ||
  thread.safetyBoundary?.touchesPayments ||
  thread.safetyBoundary?.bypassesLoginOtpCaptcha
);

check("no_unsafe_actions", unsafe.length === 0, `${unsafe.length} unsafe threads`);

const guaranteeText = threads.filter((thread) => {
  const text = `${thread.operator?.operatorResponseDraft || ""} ${thread.operator?.operatorResponseFinal || ""} ${(thread.responseRules || []).join(" ")}`.toLowerCase();
  return text.includes("guaranteed job") || text.includes("guaranteed employment") || text.includes("guaranteed offer");
});

check("no_success_guarantees", guaranteeText.length === 0, `${guaranteeText.length} guarantee-like threads`);

const badSafety = output?.safetyBoundary?.sendsApplications ||
  output?.safetyBoundary?.sendsEmail ||
  output?.safetyBoundary?.sendsWhatsApp ||
  output?.safetyBoundary?.sendsSms ||
  output?.safetyBoundary?.contactsEmployers ||
  output?.safetyBoundary?.touchesPayments ||
  output?.safetyBoundary?.bypassesLoginOtpCaptcha;

check("global_safety_boundary_no_send", !badSafety, JSON.stringify(output?.safetyBoundary ?? null));

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-25-proof.v1",
  module: "PERSONAL-JOBS-25 - Candidate Follow-Up Inbox / Questions / Operator Response Queue",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/application-tracker.local.json",
  output: "data/personal-job-desk/follow-up-inbox.local.json",
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
    ? "Commit PJ25, then test /personal-job-desk/follow-up-inbox."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);