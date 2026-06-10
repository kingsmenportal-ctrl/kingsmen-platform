import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/follow-up-inbox.local.json";
const OUTPUT = "data/personal-job-desk/response-library.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-26-response-library-latest.json";

export const RESPONSE_STATUSES = [
  "NO_RESPONSE_NEEDED",
  "DRAFT_AVAILABLE",
  "FINAL_READY_FOR_APPROVAL",
  "APPROVED_FOR_MANUAL_SEND",
  "MANUAL_SEND_PROOF_CAPTURED",
  "CLOSED"
];

export const TEMPLATE_CATEGORIES = [
  "STATUS_QUESTION",
  "PROOF_REQUEST",
  "DEADLINE_QUESTION",
  "DOCUMENT_QUESTION",
  "OUTCOME_QUESTION",
  "GENERAL"
];

function abs(p) {
  return path.join(process.cwd(), p);
}

function exists(p) {
  return fs.existsSync(abs(p));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(abs(p), "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(abs(p)), { recursive: true });
  fs.writeFileSync(abs(p), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function s(v) {
  return String(v ?? "").trim();
}

function b(v) {
  return Boolean(v);
}

function now() {
  return new Date().toISOString();
}

function readExistingLibrary() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByThreadId(existing) {
  const map = new Map();
  const workflows = Array.isArray(existing?.responseWorkflows) ? existing.responseWorkflows : [];
  for (const workflow of workflows) {
    if (workflow?.threadId) map.set(workflow.threadId, workflow);
  }
  return map;
}

function defaultTemplates() {
  return [
    {
      templateKey: "status_question_safe",
      category: "STATUS_QUESTION",
      title: "Status update response",
      body: "Hi, your tracked application status is currently {{candidateStatus}}. Kingsmen will only mark it submitted, followed up, or outcome-complete when proof or a verified update exists.",
      requiredProofRule: "Do not claim new status without proof from the tracker or official source.",
      allowedChannels: ["in-app manual", "email manual", "WhatsApp manual urgent-only"]
    },
    {
      templateKey: "proof_request_safe",
      category: "PROOF_REQUEST",
      title: "Proof request response",
      body: "Hi, submission proof will be shown once it is captured from the official channel, such as a reference number, confirmation email, screenshot, or sent-email copy.",
      requiredProofRule: "Do not invent proof. Only reference captured proof.",
      allowedChannels: ["in-app manual", "email manual"]
    },
    {
      templateKey: "deadline_question_safe",
      category: "DEADLINE_QUESTION",
      title: "Deadline verification response",
      body: "Hi, we must check the official source again before confirming any deadline. Kingsmen will not rely on unverified dates.",
      requiredProofRule: "Verify deadline on official source before giving a specific date.",
      allowedChannels: ["in-app manual", "email manual"]
    },
    {
      templateKey: "document_question_safe",
      category: "DOCUMENT_QUESTION",
      title: "Document truth boundary response",
      body: "Hi, Kingsmen will only use truthful documents and details already provided or verified by you. No fake qualifications, references, work history, certificates, or experience will be added.",
      requiredProofRule: "Candidate documents must remain truthful and evidence-backed.",
      allowedChannels: ["in-app manual", "email manual"]
    },
    {
      templateKey: "outcome_question_safe",
      category: "OUTCOME_QUESTION",
      title: "Outcome boundary response",
      body: "Hi, no outcome is guaranteed. Kingsmen will update the tracker only when there is proof, employer response, interview notice, rejection, offer, or verified no-response follow-up.",
      requiredProofRule: "Never guarantee employment, interview, offer, funding, or response.",
      allowedChannels: ["in-app manual", "email manual", "WhatsApp manual urgent-only"]
    },
    {
      templateKey: "general_safe",
      category: "GENERAL",
      title: "General safe response",
      body: "Hi, your question has been queued for operator review. Kingsmen will respond using proof-backed information only.",
      requiredProofRule: "Use only proof-backed or clearly provisional information.",
      allowedChannels: ["in-app manual", "email manual"]
    }
  ];
}

function templateForCategory(category) {
  const templates = defaultTemplates();
  return templates.find((template) => template.category === category) || templates.find((template) => template.category === "GENERAL");
}

function fillTemplate(body, thread) {
  return s(body)
    .replaceAll("{{candidateStatus}}", s(thread.context?.candidateStatus || "REVIEW_REQUIRED"))
    .replaceAll("{{title}}", s(thread.context?.opportunity?.title || "this opportunity"))
    .replaceAll("{{company}}", s(thread.context?.opportunity?.company || "the employer"));
}

function deriveResponseStatus(thread, existing) {
  const saved = s(existing?.responseStatus);
  if (RESPONSE_STATUSES.includes(saved) && saved !== "NO_RESPONSE_NEEDED") return saved;

  if (thread.threadStatus === "NO_QUESTION") return "NO_RESPONSE_NEEDED";
  if (thread.threadStatus === "RESPONSE_MARKED_SENT_WITH_PROOF") return "MANUAL_SEND_PROOF_CAPTURED";
  if (thread.threadStatus === "RESPONSE_APPROVED_FOR_MANUAL_SEND") return "APPROVED_FOR_MANUAL_SEND";
  if (thread.threadStatus === "OPERATOR_RESPONSE_DRAFTED") return "DRAFT_AVAILABLE";
  if (thread.candidate?.candidateQuestion) return "DRAFT_AVAILABLE";

  return "NO_RESPONSE_NEEDED";
}

function makeWorkflow(thread, existing, index) {
  const category = TEMPLATE_CATEGORIES.includes(thread.questionCategory) ? thread.questionCategory : "GENERAL";
  const template = templateForCategory(category);
  const responseStatus = deriveResponseStatus(thread, existing);

  const operatorDraft =
    s(existing?.operatorDraft) ||
    s(thread.operator?.operatorResponseDraft) ||
    (thread.candidate?.candidateQuestion ? fillTemplate(template.body, thread) : "");

  const finalResponse =
    s(existing?.finalResponse) ||
    s(thread.operator?.operatorResponseFinal);

  const manualSendProof =
    s(existing?.manualSendProof) ||
    s(thread.operator?.manualSendProof);

  return {
    workflowId: existing?.workflowId || `pj26-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-26",
    threadId: thread.threadId,
    trackerId: thread.trackerId,
    packId: thread.packId,
    questionCategory: category,
    responseStatus,
    selectedTemplateKey: s(existing?.selectedTemplateKey) || template.templateKey,
    candidateQuestion: s(thread.candidate?.candidateQuestion),
    context: {
      candidateStatus: s(thread.context?.candidateStatus),
      opportunity: thread.context?.opportunity || {},
      proof: thread.context?.proof || {},
      outcome: thread.context?.outcome || {},
      timeline: thread.context?.timeline || {}
    },
    operatorDraft,
    finalResponse,
    approval: {
      approvedForManualSend: b(existing?.approval?.approvedForManualSend || thread.operator?.approvedForManualSend),
      approvedBy: s(existing?.approval?.approvedBy),
      approvedAt: s(existing?.approval?.approvedAt)
    },
    manualSend: {
      channel: s(existing?.manualSend?.channel || thread.operator?.manualSendChannel),
      sentAt: s(existing?.manualSend?.sentAt || thread.operator?.manualSentAt),
      manualSendProof,
      sentBy: s(existing?.manualSend?.sentBy),
      proofCaptured: Boolean(manualSendProof || thread.threadStatus === "RESPONSE_MARKED_SENT_WITH_PROOF")
    },
    responseChecklist: [
      {
        key: "no_guarantee",
        label: "Response does not guarantee employment, interview, offer, funding, or response",
        required: true,
        completed: true
      },
      {
        key: "proof_backed",
        label: "Response uses proof-backed information only or clearly says verification is needed",
        required: true,
        completed: true
      },
      {
        key: "no_sensitive_notes",
        label: "Response does not expose internal notes or private operator reasoning",
        required: true,
        completed: true
      },
      {
        key: "manual_send_only",
        label: "Response is prepared for manual send only",
        required: true,
        completed: true
      },
      {
        key: "send_proof_required",
        label: "If marked sent, manual-send proof is captured",
        required: true,
        completed: Boolean(manualSendProof) || responseStatus !== "MANUAL_SEND_PROOF_CAPTURED"
      }
    ],
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      productionClaim: false,
      deployedToOracle: false
    },
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
}

function summarize(workflows, templates) {
  const byResponseStatus = {};
  const byQuestionCategory = {};

  for (const workflow of workflows) {
    byResponseStatus[workflow.responseStatus] = (byResponseStatus[workflow.responseStatus] || 0) + 1;
    byQuestionCategory[workflow.questionCategory] = (byQuestionCategory[workflow.questionCategory] || 0) + 1;
  }

  return {
    totalWorkflows: workflows.length,
    templateCount: templates.length,
    noResponseNeeded: workflows.filter((x) => x.responseStatus === "NO_RESPONSE_NEEDED").length,
    draftAvailable: workflows.filter((x) => x.responseStatus === "DRAFT_AVAILABLE").length,
    finalReadyForApproval: workflows.filter((x) => x.responseStatus === "FINAL_READY_FOR_APPROVAL").length,
    approvedForManualSend: workflows.filter((x) => x.responseStatus === "APPROVED_FOR_MANUAL_SEND").length,
    manualSendProofCaptured: workflows.filter((x) => x.responseStatus === "MANUAL_SEND_PROOF_CAPTURED").length,
    closed: workflows.filter((x) => x.responseStatus === "CLOSED").length,
    byResponseStatus,
    byQuestionCategory
  };
}

export function runResponseLibrary() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ25 input: ${INPUT}. Run PJ25 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.threads)) {
    throw new Error("PJ26 requires PJ25 completed follow-up-inbox.local.json with threads array.");
  }

  const existing = readExistingLibrary();
  const existingMap = existingByThreadId(existing);

  const templates = defaultTemplates();
  const responseWorkflows = input.threads.map((thread, index) => makeWorkflow(thread, existingMap.get(thread.threadId), index));
  const summary = summarize(responseWorkflows, templates);

  const output = {
    schema: "kingsmen.personal-jobs-26.response-library.v1",
    module: "PERSONAL-JOBS-26",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj25ThreadCount: input.threads.length,
    responseWorkflowCount: responseWorkflows.length,
    allowedResponseStatuses: RESPONSE_STATUSES,
    allowedTemplateCategories: TEMPLATE_CATEGORIES,
    templates,
    summary,
    responseWorkflows,
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      productionClaim: false,
      deployedToOracle: false
    },
    handoff: {
      nextModule: "PERSONAL-JOBS-27",
      nextPurpose: "Application readiness governor and priority queue for manual execution.",
      onlyAfter: "PJ26 templates and manual-send proof workflow pass validation."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-26.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    responseWorkflowCount: output.responseWorkflowCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/response-library and manage manual response templates/proof."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runResponseLibrary();
  console.log(JSON.stringify({
    status: output.status,
    pj25ThreadCount: output.pj25ThreadCount,
    responseWorkflowCount: output.responseWorkflowCount,
    summary: output.summary
  }, null, 2));
}