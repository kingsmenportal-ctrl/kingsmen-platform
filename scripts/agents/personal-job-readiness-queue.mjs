import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/response-library.local.json";
const OUTPUT = "data/personal-job-desk/readiness-priority-queue.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-27-readiness-queue-latest.json";

export const QUEUE_STATUSES = [
  "BLOCKED_REVIEW_REQUIRED",
  "READY_FOR_MANUAL_SUBMISSION",
  "MANUAL_SUBMISSION_IN_PROGRESS",
  "PROOF_CAPTURE_REQUIRED",
  "FOLLOW_UP_DUE",
  "OUTCOME_REVIEW_REQUIRED",
  "CANDIDATE_RESPONSE_REQUIRED",
  "CLOSED"
];

export const PRIORITY_BANDS = [
  "P0_URGENT",
  "P1_HIGH",
  "P2_NORMAL",
  "P3_LOW",
  "P4_WAIT"
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

function readExistingQueue() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByWorkflowId(existing) {
  const map = new Map();
  const items = Array.isArray(existing?.queueItems) ? existing.queueItems : [];
  for (const item of items) {
    if (item?.workflowId) map.set(item.workflowId, item);
  }
  return map;
}

function parseDate(value) {
  const text = s(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function deriveQueueStatus(workflow) {
  const candidateStatus = s(workflow.context?.candidateStatus);
  const responseStatus = s(workflow.responseStatus);
  const proofCaptured = b(workflow.context?.proof?.proofCaptured);
  const followUpDate = s(workflow.context?.timeline?.followUpDate);
  const outcomeStatus = s(workflow.context?.outcome?.outcomeStatus);

  if (responseStatus === "MANUAL_SEND_PROOF_CAPTURED" || responseStatus === "CLOSED") return "CLOSED";
  if (responseStatus === "DRAFT_AVAILABLE" || responseStatus === "FINAL_READY_FOR_APPROVAL" || responseStatus === "APPROVED_FOR_MANUAL_SEND") return "CANDIDATE_RESPONSE_REQUIRED";

  if (candidateStatus === "READY_FOR_MANUAL_SUBMISSION") return "READY_FOR_MANUAL_SUBMISSION";
  if (candidateStatus === "MANUAL_SUBMISSION_IN_PROGRESS") return proofCaptured ? "MANUAL_SUBMISSION_IN_PROGRESS" : "PROOF_CAPTURE_REQUIRED";
  if (candidateStatus === "SUBMITTED_PROOF_CAPTURED") return followUpDate ? "FOLLOW_UP_DUE" : "OUTCOME_REVIEW_REQUIRED";
  if (candidateStatus === "FOLLOW_UP_SCHEDULED") return "FOLLOW_UP_DUE";
  if (["INTERVIEW_STAGE", "REJECTED", "OFFER_RECEIVED", "NO_RESPONSE_FOLLOWUP"].includes(candidateStatus)) return "OUTCOME_REVIEW_REQUIRED";
  if (outcomeStatus && outcomeStatus !== "NONE") return "OUTCOME_REVIEW_REQUIRED";
  if (candidateStatus === "CLOSED_NOT_APPLYING") return "CLOSED";

  return "BLOCKED_REVIEW_REQUIRED";
}

function scoreQueueItem(status, workflow) {
  let score = 0;
  const candidateStatus = s(workflow.context?.candidateStatus);
  const responseStatus = s(workflow.responseStatus);
  const followUpDays = daysUntil(workflow.context?.timeline?.followUpDate);

  if (status === "FOLLOW_UP_DUE") score += 90;
  if (status === "READY_FOR_MANUAL_SUBMISSION") score += 80;
  if (status === "PROOF_CAPTURE_REQUIRED") score += 75;
  if (status === "CANDIDATE_RESPONSE_REQUIRED") score += 70;
  if (status === "OUTCOME_REVIEW_REQUIRED") score += 60;
  if (status === "MANUAL_SUBMISSION_IN_PROGRESS") score += 55;
  if (status === "BLOCKED_REVIEW_REQUIRED") score += 25;
  if (status === "CLOSED") score -= 100;

  if (responseStatus === "FINAL_READY_FOR_APPROVAL") score += 20;
  if (responseStatus === "APPROVED_FOR_MANUAL_SEND") score += 25;
  if (candidateStatus === "OFFER_RECEIVED") score += 30;
  if (candidateStatus === "INTERVIEW_STAGE") score += 25;

  if (followUpDays !== null) {
    if (followUpDays <= 0) score += 35;
    else if (followUpDays <= 2) score += 20;
    else if (followUpDays <= 7) score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function priorityBand(score, status) {
  if (status === "CLOSED") return "P4_WAIT";
  if (score >= 90) return "P0_URGENT";
  if (score >= 75) return "P1_HIGH";
  if (score >= 45) return "P2_NORMAL";
  if (score >= 20) return "P3_LOW";
  return "P4_WAIT";
}

function actionPacket(status, workflow) {
  const title = s(workflow.context?.opportunity?.title || "this opportunity");
  const company = s(workflow.context?.opportunity?.company || "the employer");

  if (status === "READY_FOR_MANUAL_SUBMISSION") {
    return {
      actionTitle: "Execute manual submission",
      operatorAction: `Open the official source for ${title} at ${company}, verify the role is still valid, submit manually only through the official channel, then capture proof.`,
      requiredProof: "Submission screenshot, reference number, confirmation email, sent-email copy, or portal confirmation.",
      blockedReason: ""
    };
  }

  if (status === "PROOF_CAPTURE_REQUIRED") {
    return {
      actionTitle: "Capture missing submission proof",
      operatorAction: `Find or upload proof for ${title} at ${company}. Do not mark submitted without proof.`,
      requiredProof: "Proof of submission or clear evidence that submission did not happen.",
      blockedReason: "Submission progress exists but proof is not captured."
    };
  }

  if (status === "FOLLOW_UP_DUE") {
    return {
      actionTitle: "Check follow-up",
      operatorAction: `Review follow-up for ${title} at ${company}. Verify official/source response before updating the candidate tracker.`,
      requiredProof: "Employer response, email reply, portal update, call note, or no-response follow-up note.",
      blockedReason: ""
    };
  }

  if (status === "OUTCOME_REVIEW_REQUIRED") {
    return {
      actionTitle: "Review outcome",
      operatorAction: `Review outcome state for ${title} at ${company}. Record only proof-backed interview, rejection, offer, or no-response outcome.`,
      requiredProof: "Employer message, interview invite, rejection notice, offer proof, or verified no-response note.",
      blockedReason: ""
    };
  }

  if (status === "CANDIDATE_RESPONSE_REQUIRED") {
    return {
      actionTitle: "Handle candidate response",
      operatorAction: `Review prepared response for ${title} at ${company}, approve it, send manually through allowed channel, and capture send proof.`,
      requiredProof: "Manual-send proof, sent message copy, email sent record, or in-app note.",
      blockedReason: ""
    };
  }

  if (status === "MANUAL_SUBMISSION_IN_PROGRESS") {
    return {
      actionTitle: "Continue manual submission",
      operatorAction: `Continue manual submission workflow for ${title} at ${company}, then capture proof before marking submitted.`,
      requiredProof: "Final submission proof.",
      blockedReason: ""
    };
  }

  if (status === "CLOSED") {
    return {
      actionTitle: "Closed",
      operatorAction: "No active action required.",
      requiredProof: "Closure reason or outcome proof if applicable.",
      blockedReason: "Closed or no longer active."
    };
  }

  return {
    actionTitle: "Review required before work can continue",
    operatorAction: `Review ${title} at ${company}. Candidate and founder/operator approval may still be missing upstream.`,
    requiredProof: "Review decision, candidate approval, founder/operator approval, or closure reason.",
    blockedReason: "Not ready for manual execution."
  };
}

function makeQueueItem(workflow, existing, index) {
  const queueStatus = deriveQueueStatus(workflow);
  const priorityScore = scoreQueueItem(queueStatus, workflow);
  const band = priorityBand(priorityScore, queueStatus);
  const packet = actionPacket(queueStatus, workflow);

  return {
    queueId: existing?.queueId || `pj27-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-27",
    workflowId: workflow.workflowId,
    threadId: workflow.threadId,
    trackerId: workflow.trackerId,
    packId: workflow.packId,
    queueStatus,
    priorityBand: band,
    priorityScore,
    assignedTo: s(existing?.assignedTo),
    operatorDecision: s(existing?.operatorDecision),
    operatorNotes: s(existing?.operatorNotes),
    context: {
      responseStatus: s(workflow.responseStatus),
      questionCategory: s(workflow.questionCategory),
      candidateStatus: s(workflow.context?.candidateStatus),
      opportunity: workflow.context?.opportunity || {},
      proof: workflow.context?.proof || {},
      outcome: workflow.context?.outcome || {},
      timeline: workflow.context?.timeline || {}
    },
    actionPacket: packet,
    readinessGate: {
      canAutoExecute: false,
      canAutoContactEmployer: false,
      canAutoSendCandidateMessage: false,
      canTouchPayments: false,
      canBypassLoginOtpCaptcha: false,
      humanApprovalRequired: true,
      proofRequiredForStatusAdvance: true
    },
    nextAllowedActions: [
      "review",
      "assign",
      "mark blocked",
      "mark ready",
      "record proof",
      "record follow-up",
      "record outcome",
      "close"
    ],
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
}

function summarize(items) {
  const byQueueStatus = {};
  const byPriorityBand = {};

  for (const item of items) {
    byQueueStatus[item.queueStatus] = (byQueueStatus[item.queueStatus] || 0) + 1;
    byPriorityBand[item.priorityBand] = (byPriorityBand[item.priorityBand] || 0) + 1;
  }

  return {
    totalItems: items.length,
    urgent: items.filter((x) => x.priorityBand === "P0_URGENT").length,
    high: items.filter((x) => x.priorityBand === "P1_HIGH").length,
    normal: items.filter((x) => x.priorityBand === "P2_NORMAL").length,
    low: items.filter((x) => x.priorityBand === "P3_LOW").length,
    wait: items.filter((x) => x.priorityBand === "P4_WAIT").length,
    blockedReviewRequired: items.filter((x) => x.queueStatus === "BLOCKED_REVIEW_REQUIRED").length,
    readyForManualSubmission: items.filter((x) => x.queueStatus === "READY_FOR_MANUAL_SUBMISSION").length,
    proofCaptureRequired: items.filter((x) => x.queueStatus === "PROOF_CAPTURE_REQUIRED").length,
    followUpDue: items.filter((x) => x.queueStatus === "FOLLOW_UP_DUE").length,
    outcomeReviewRequired: items.filter((x) => x.queueStatus === "OUTCOME_REVIEW_REQUIRED").length,
    candidateResponseRequired: items.filter((x) => x.queueStatus === "CANDIDATE_RESPONSE_REQUIRED").length,
    closed: items.filter((x) => x.queueStatus === "CLOSED").length,
    byQueueStatus,
    byPriorityBand
  };
}

export function runReadinessQueue() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ26 input: ${INPUT}. Run PJ26 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.responseWorkflows)) {
    throw new Error("PJ27 requires PJ26 completed response-library.local.json with responseWorkflows array.");
  }

  const existing = readExistingQueue();
  const existingMap = existingByWorkflowId(existing);

  const queueItems = input.responseWorkflows
    .map((workflow, index) => makeQueueItem(workflow, existingMap.get(workflow.workflowId), index))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.queueId.localeCompare(b.queueId));

  const summary = summarize(queueItems);

  const output = {
    schema: "kingsmen.personal-jobs-27.readiness-priority-queue.v1",
    module: "PERSONAL-JOBS-27",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj26WorkflowCount: input.responseWorkflows.length,
    queueItemCount: queueItems.length,
    allowedQueueStatuses: QUEUE_STATUSES,
    allowedPriorityBands: PRIORITY_BANDS,
    summary,
    queueItems,
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
      nextModule: "PERSONAL-JOBS-28",
      nextPurpose: "Operator daily worklist and founder action packet digest.",
      onlyAfter: "PJ27 readiness queue is proven, validated, committed, and clean."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-27.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    queueItemCount: output.queueItemCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/readiness-queue and process priority queue items manually."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runReadinessQueue();
  console.log(JSON.stringify({
    status: output.status,
    pj26WorkflowCount: output.pj26WorkflowCount,
    queueItemCount: output.queueItemCount,
    summary: output.summary
  }, null, 2));
}