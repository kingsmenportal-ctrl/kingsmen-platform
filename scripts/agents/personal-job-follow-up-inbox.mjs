import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/application-tracker.local.json";
const OUTPUT = "data/personal-job-desk/follow-up-inbox.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-25-follow-up-inbox-latest.json";

export const THREAD_STATUSES = [
  "NO_QUESTION",
  "CANDIDATE_QUESTION_PENDING",
  "OPERATOR_RESPONSE_DRAFTED",
  "RESPONSE_APPROVED_FOR_MANUAL_SEND",
  "RESPONSE_MARKED_SENT_WITH_PROOF",
  "CLOSED"
];

export const QUESTION_CATEGORIES = [
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

function readExistingInbox() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByTrackerId(existing) {
  const map = new Map();
  const threads = Array.isArray(existing?.threads) ? existing.threads : [];
  for (const thread of threads) {
    if (thread?.trackerId) map.set(thread.trackerId, thread);
  }
  return map;
}

function categorizeQuestion(question) {
  const text = s(question).toLowerCase();

  if (!text) return "GENERAL";
  if (text.includes("status") || text.includes("update") || text.includes("progress")) return "STATUS_QUESTION";
  if (text.includes("proof") || text.includes("reference") || text.includes("submitted") || text.includes("screenshot")) return "PROOF_REQUEST";
  if (text.includes("deadline") || text.includes("closing") || text.includes("date")) return "DEADLINE_QUESTION";
  if (text.includes("document") || text.includes("cv") || text.includes("id") || text.includes("certificate")) return "DOCUMENT_QUESTION";
  if (text.includes("interview") || text.includes("offer") || text.includes("rejected") || text.includes("outcome") || text.includes("response")) return "OUTCOME_QUESTION";

  return "GENERAL";
}

function defaultDraft(item, category) {
  const title = s(item.opportunity?.title || "this application");
  const company = s(item.opportunity?.company || "the employer");
  const status = s(item.candidateStatus || "REVIEW_REQUIRED");

  if (category === "STATUS_QUESTION") {
    return `Hi, your current tracked status for ${title} at ${company} is ${status}. Kingsmen will only mark it submitted, followed up, or outcome-complete when proof or a verified update exists.`;
  }

  if (category === "PROOF_REQUEST") {
    return `Hi, proof for ${title} at ${company} will be shown once it is captured from the official channel, such as a reference number, confirmation email, screenshot, or sent-email copy.`;
  }

  if (category === "DEADLINE_QUESTION") {
    return `Hi, we must check the official source again before confirming any deadline for ${title} at ${company}. Kingsmen will not rely on unverified dates.`;
  }

  if (category === "DOCUMENT_QUESTION") {
    return `Hi, for ${title} at ${company}, we will only use truthful documents and details already provided or verified by you. No fake qualifications, references, or experience will be added.`;
  }

  if (category === "OUTCOME_QUESTION") {
    return `Hi, no outcome is guaranteed for ${title} at ${company}. Kingsmen will update the tracker only when there is proof, employer response, interview notice, rejection, offer, or verified no-response follow-up.`;
  }

  return `Hi, your question about ${title} at ${company} has been queued for operator review. Kingsmen will respond using proof-backed information only.`;
}

function deriveThreadStatus(item, existing) {
  const saved = s(existing?.threadStatus);
  if (THREAD_STATUSES.includes(saved) && saved !== "NO_QUESTION") return saved;

  const question = s(item.candidateControls?.candidateQuestion);
  if (question) return "CANDIDATE_QUESTION_PENDING";

  return "NO_QUESTION";
}

function makeThread(item, existing, index) {
  const candidateQuestion = s(item.candidateControls?.candidateQuestion || existing?.candidateQuestion);
  const category = QUESTION_CATEGORIES.includes(existing?.questionCategory)
    ? existing.questionCategory
    : categorizeQuestion(candidateQuestion);

  const threadStatus = deriveThreadStatus(item, existing);
  const operatorDraft = s(existing?.operatorResponseDraft) || (candidateQuestion ? defaultDraft(item, category) : "");

  return {
    threadId: existing?.threadId || `pj25-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-25",
    trackerId: item.trackerId,
    workbenchId: item.workbenchId,
    packId: item.packId,
    threadStatus,
    questionCategory: category,
    priority: candidateQuestion ? "NORMAL" : "NONE",
    candidate: {
      candidateAcknowledged: b(item.candidateControls?.candidateAcknowledged),
      candidateQuestion,
      lastCandidateNoteAt: s(item.candidateControls?.lastCandidateNoteAt)
    },
    context: {
      candidateStatus: s(item.candidateStatus),
      candidateMessage: s(item.candidateMessage),
      opportunity: item.opportunity || {},
      proof: item.proof || {},
      outcome: item.outcome || {},
      timeline: item.timeline || {}
    },
    operator: {
      operatorResponseDraft: operatorDraft,
      operatorResponseFinal: s(existing?.operator?.operatorResponseFinal || existing?.operatorResponseFinal),
      approvedForManualSend: b(existing?.operator?.approvedForManualSend),
      manualSendChannel: s(existing?.operator?.manualSendChannel),
      manualSentAt: s(existing?.operator?.manualSentAt),
      manualSendProof: s(existing?.operator?.manualSendProof),
      internalNotes: s(existing?.operator?.internalNotes)
    },
    responseRules: [
      "Do not promise employment, interview, offer, funding, or response.",
      "Do not claim submitted, followed-up, or outcome-complete without proof.",
      "Do not expose sensitive internal notes to the candidate.",
      "Do not send email, WhatsApp, SMS, or employer messages automatically from PJ25.",
      "Operator may copy the approved response and send manually through an allowed channel."
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

function summarize(threads) {
  const byThreadStatus = {};
  const byQuestionCategory = {};

  for (const thread of threads) {
    byThreadStatus[thread.threadStatus] = (byThreadStatus[thread.threadStatus] || 0) + 1;
    byQuestionCategory[thread.questionCategory] = (byQuestionCategory[thread.questionCategory] || 0) + 1;
  }

  return {
    totalThreads: threads.length,
    candidateQuestionsPending: threads.filter((x) => x.threadStatus === "CANDIDATE_QUESTION_PENDING").length,
    operatorDrafted: threads.filter((x) => x.threadStatus === "OPERATOR_RESPONSE_DRAFTED").length,
    approvedForManualSend: threads.filter((x) => x.threadStatus === "RESPONSE_APPROVED_FOR_MANUAL_SEND").length,
    markedSentWithProof: threads.filter((x) => x.threadStatus === "RESPONSE_MARKED_SENT_WITH_PROOF").length,
    noQuestion: threads.filter((x) => x.threadStatus === "NO_QUESTION").length,
    closed: threads.filter((x) => x.threadStatus === "CLOSED").length,
    byThreadStatus,
    byQuestionCategory
  };
}

export function runFollowUpInbox() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ24 input: ${INPUT}. Run PJ24 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.items)) {
    throw new Error("PJ25 requires PJ24 completed application-tracker.local.json with items array.");
  }

  const existing = readExistingInbox();
  const existingMap = existingByTrackerId(existing);

  const threads = input.items.map((item, index) => makeThread(item, existingMap.get(item.trackerId), index));
  const summary = summarize(threads);

  const output = {
    schema: "kingsmen.personal-jobs-25.follow-up-inbox.v1",
    module: "PERSONAL-JOBS-25",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj24ItemCount: input.items.length,
    threadCount: threads.length,
    allowedThreadStatuses: THREAD_STATUSES,
    allowedQuestionCategories: QUESTION_CATEGORIES,
    summary,
    threads,
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
      nextModule: "PERSONAL-JOBS-26",
      nextPurpose: "Operator response library, reusable templates, and manual-send proof workflow.",
      onlyAfter: "PJ25 follow-up threads exist and response safety rules pass validation."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-25.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    threadCount: output.threadCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/follow-up-inbox and process candidate questions manually."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runFollowUpInbox();
  console.log(JSON.stringify({
    status: output.status,
    pj24ItemCount: output.pj24ItemCount,
    threadCount: output.threadCount,
    summary: output.summary
  }, null, 2));
}