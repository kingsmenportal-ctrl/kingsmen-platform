import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const proofPath = path.join(root, "reports/personal-jobs/personal-jobs-26-response-library-proof.json");
const outputPath = path.join(root, "data/personal-job-desk/response-library.local.json");
const inputPath = path.join(root, "data/personal-job-desk/follow-up-inbox.local.json");

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
  "scripts/agents/personal-job-response-library.mjs",
  "apps/web/src/app/api/personal-jobs/response-library/route.ts",
  "apps/web/src/app/personal-job-desk/response-library/page.tsx",
  "apps/web/src/app/personal-job-desk/response-library/ResponseLibraryClient.tsx",
  "packages/contracts/src/personal-jobs-26-response-library.ts",
  "docs/personal-jobs/personal-jobs-26-response-library.md",
  "manifests/personal-jobs/personal-jobs-26-response-library.json",
  "scripts/proof/prove-personal-jobs-26-response-library.mjs",
  "scripts/validators/validate-personal-jobs-26-response-library.mjs"
];

for (const file of files) check(`file:${file}`, exists(file), file);
check("pj25_input_exists", fs.existsSync(inputPath), "PJ25 follow-up-inbox.local.json must exist before PJ26.");

const run = spawnSync(process.execPath, ["scripts/agents/personal-job-response-library.mjs"], {
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
check("templates_created", Number(output?.templates?.length ?? 0) >= 6, output?.templates?.length);
check("workflows_created", Number(output?.responseWorkflowCount ?? 0) > 0, output?.responseWorkflowCount);
check("workflows_match_pj25_threads", output?.responseWorkflowCount === input?.threadCount, `${output?.responseWorkflowCount} vs ${input?.threadCount}`);

const workflows = Array.isArray(output?.responseWorkflows) ? output.responseWorkflows : [];
const templates = Array.isArray(output?.templates) ? output.templates : [];

const missingTemplates = templates.filter((template) =>
  !template.templateKey ||
  !template.category ||
  !template.title ||
  !template.body ||
  !template.requiredProofRule ||
  !Array.isArray(template.allowedChannels)
);

check("all_templates_have_required_sections", missingTemplates.length === 0, `${missingTemplates.length} templates missing required sections`);

const missingWorkflows = workflows.filter((workflow) =>
  !workflow.workflowId ||
  !workflow.threadId ||
  !workflow.packId ||
  !workflow.responseStatus ||
  !workflow.selectedTemplateKey ||
  !workflow.context ||
  !workflow.approval ||
  !workflow.manualSend ||
  !Array.isArray(workflow.responseChecklist)
);

check("all_workflows_have_required_sections", missingWorkflows.length === 0, `${missingWorkflows.length} workflows missing required sections`);

const unsafe = workflows.filter((workflow) =>
  workflow.safetyBoundary?.sendsApplications ||
  workflow.safetyBoundary?.sendsEmail ||
  workflow.safetyBoundary?.sendsWhatsApp ||
  workflow.safetyBoundary?.sendsSms ||
  workflow.safetyBoundary?.contactsEmployers ||
  workflow.safetyBoundary?.touchesPayments ||
  workflow.safetyBoundary?.bypassesLoginOtpCaptcha
);

check("no_unsafe_actions", unsafe.length === 0, `${unsafe.length} unsafe workflows`);

const sentWithoutProof = workflows.filter((workflow) =>
  workflow.responseStatus === "MANUAL_SEND_PROOF_CAPTURED" &&
  !workflow.manualSend?.manualSendProof
);

check("manual_sent_requires_proof", sentWithoutProof.length === 0, `${sentWithoutProof.length} sent workflows without proof`);

const guaranteeText = workflows.filter((workflow) => {
  const text = `${workflow.operatorDraft || ""} ${workflow.finalResponse || ""}`.toLowerCase();
  return text.includes("guaranteed job") || text.includes("guaranteed employment") || text.includes("guaranteed offer");
});

check("no_success_guarantees", guaranteeText.length === 0, `${guaranteeText.length} guarantee-like workflows`);

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
  schema: "kingsmen.personal-jobs-26-proof.v1",
  module: "PERSONAL-JOBS-26 - Operator Response Library / Reusable Templates / Manual-Send Proof Workflow",
  status: failed.length === 0 ? "PROVEN" : "FAILED",
  passed: failed.length === 0,
  generated_at: new Date().toISOString(),
  input: "data/personal-job-desk/follow-up-inbox.local.json",
  output: "data/personal-job-desk/response-library.local.json",
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
    ? "Commit PJ26, then test /personal-job-desk/response-library."
    : "Repair failed checks."
};

writeProof(proof);
console.log(JSON.stringify(proof, null, 2));
if (failed.length > 0) process.exit(1);