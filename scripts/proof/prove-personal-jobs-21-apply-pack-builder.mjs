import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-21-apply-pack-builder-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/application-packs.local.json");

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(root, p), "utf8").replace(/^\uFEFF/, ""));
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
  "scripts/agents/personal-job-apply-pack-builder.mjs",
  "apps/web/src/app/api/personal-jobs/apply-pack-builder/build/route.ts",
  "apps/web/src/app/personal-job-desk/apply-pack-builder/page.tsx",
  "apps/web/src/app/personal-job-desk/apply-pack-builder/ApplyPackBuilderClient.tsx",
  "packages/contracts/src/personal-jobs-21-apply-pack-builder.ts",
  "docs/personal-jobs/personal-jobs-21-apply-pack-builder.md",
  "manifests/personal-jobs/personal-jobs-21-apply-pack-builder.json",
  "scripts/proof/prove-personal-jobs-21-apply-pack-builder.mjs",
  "scripts/validators/validate-personal-jobs-21-apply-pack-builder.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj20b_input_exists", exists("data/personal-job-desk/opportunity-quality-gate.local.json"), "PJ20B output must exist before PJ21.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-apply-pack-builder.mjs"], {
  cwd: root,
  encoding: "utf8",
  timeout: 90000,
  maxBuffer: 1024 * 1024 * 30
});

check("agent_exit_zero", run.status === 0, run.stderr || run.stdout);
check("output_written", fs.existsSync(outputPath), outputPath);

let output = null;
try {
  output = JSON.parse(fs.readFileSync(outputPath, "utf8"));
} catch {}

check("output_completed", output?.status === "COMPLETED", output?.status);
check("packs_created", Number(output?.applicationPackCount ?? 0) > 0, output?.applicationPackCount);
check("packs_match_ready_leads", output?.applicationPackCount === output?.totalReadyLeadsFromPJ20B, `${output?.applicationPackCount} vs ${output?.totalReadyLeadsFromPJ20B}`);

const packs = Array.isArray(output?.packs) ? output.packs : [];

const unsafe = packs.filter((pack) =>
  pack.safetyBoundary?.sendsApplications ||
  pack.safetyBoundary?.sendsEmail ||
  pack.safetyBoundary?.sendsWhatsApp ||
  pack.safetyBoundary?.contactsEmployers ||
  pack.safetyBoundary?.touchesPayments ||
  pack.safetyBoundary?.bypassesLoginOrCaptcha
);

check("no_unsafe_pack_actions", unsafe.length === 0, `${unsafe.length} unsafe packs`);

const incomplete = packs.filter((pack) =>
  !pack.motivationDraft ||
  !Array.isArray(pack.cvFocus) ||
  pack.cvFocus.length === 0 ||
  !Array.isArray(pack.manualApplySteps) ||
  pack.manualApplySteps.length === 0 ||
  !Array.isArray(pack.proofToCapture) ||
  pack.proofToCapture.length === 0
);

check("all_packs_have_required_sections", incomplete.length === 0, `${incomplete.length} incomplete packs`);

const badLeadStates = packs.filter((pack) => pack.lead?.pj20bGateType && pack.lead.pj20bGateType !== "SPECIFIC_VACANCY");
check("only_specific_vacancy_ready_packs", badLeadStates.length === 0, `${badLeadStates.length} non-specific vacancy packs`);

const failed = checks.filter((c) => !c.passed);

const proof = {
  schema: "kingsmen.personal-jobs-21-proof.v1",
  module: "PERSONAL-JOBS-21 - One Profile Apply Pack Builder / CV + Motivation Drafts / Manual Submission Packet",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  output: "data/personal-job-desk/application-packs.local.json",
  summary: output ? {
    totalReadyLeadsFromPJ20B: output.totalReadyLeadsFromPJ20B,
    applicationPackCount: output.applicationPackCount,
    readyForHumanReviewCount: output.readyForHumanReviewCount,
    needsProfileCompletionCount: output.needsProfileCompletionCount
  } : null,
  boundaries: {
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOrCaptcha: false,
    productionReady: false,
    deployedToOracle: false
  },
  checks,
  failed,
  next_action: failed.length === 0
    ? "Commit PJ21, then test /personal-job-desk/apply-pack-builder."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);