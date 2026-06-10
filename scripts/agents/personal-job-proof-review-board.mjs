import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/daily-worklist.local.json";
const OUTPUT = "data/personal-job-desk/proof-review-board.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-29-proof-review-board-latest.json";

export const REVIEW_STATUSES = [
  "WAITING_FOUNDER_DECISION",
  "NEEDS_PROOF",
  "READY_FOR_REVIEW",
  "APPROVED_FOR_STATUS_ADVANCE",
  "REJECTED_PROOF",
  "STATUS_ADVANCE_RECORDED",
  "CLOSED"
];

export const ADVANCEMENT_TARGETS = [
  "NONE",
  "REVIEW_REQUIRED",
  "READY_FOR_MANUAL_SUBMISSION",
  "MANUAL_SUBMISSION_IN_PROGRESS",
  "SUBMITTED_PROOF_CAPTURED",
  "FOLLOW_UP_SCHEDULED",
  "INTERVIEW_STAGE",
  "REJECTED",
  "OFFER_RECEIVED",
  "NO_RESPONSE_FOLLOWUP",
  "CLOSED_NOT_APPLYING"
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

function readExisting() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByWorklistId(existing) {
  const map = new Map();
  const items = Array.isArray(existing?.reviewItems) ? existing.reviewItems : [];
  for (const item of items) {
    if (item?.worklistId) map.set(item.worklistId, item);
  }
  return map;
}

function proofReference(item, existing) {
  return s(existing?.proof?.proofReference || item.operatorProgress?.proofReference);
}

function founderDecision(item, existing) {
  return s(existing?.reviewDecision?.decision || item.founderDecision?.decision);
}

function deriveTarget(item) {
  const status = s(item.worklistStatus);
  const queueStatus = s(item.context?.candidateStatus);
  const actionTitle = s(item.actionPacket?.actionTitle).toLowerCase();

  if (status === "CLOSED" || status === "DONE") return "CLOSED_NOT_APPLYING";
  if (actionTitle.includes("submit") || queueStatus === "READY_FOR_MANUAL_SUBMISSION") return "SUBMITTED_PROOF_CAPTURED";
  if (actionTitle.includes("follow")) return "FOLLOW_UP_SCHEDULED";
  if (actionTitle.includes("outcome")) return queueStatus || "REVIEW_REQUIRED";
  if (status === "WAITING_PROOF") return "SUBMITTED_PROOF_CAPTURED";
  if (status === "WAITING_CANDIDATE") return "REVIEW_REQUIRED";
  if (status === "WAITING_FOUNDER") return "REVIEW_REQUIRED";

  return "NONE";
}

function deriveReviewStatus(item, existing) {
  const saved = s(existing?.reviewStatus);
  if (REVIEW_STATUSES.includes(saved) && saved !== "WAITING_FOUNDER_DECISION") return saved;

  if (item.worklistStatus === "CLOSED" || item.worklistStatus === "DONE") return "CLOSED";

  const proof = proofReference(item, existing);
  const decision = founderDecision(item, existing).toLowerCase();

  if (decision.includes("reject") || decision.includes("block")) return "REJECTED_PROOF";
  if (decision.includes("approve") && proof) return "APPROVED_FOR_STATUS_ADVANCE";
  if (proof) return "READY_FOR_REVIEW";
  if (item.founderAttentionRequired) return "WAITING_FOUNDER_DECISION";

  return "NEEDS_PROOF";
}

function makeReviewItem(item, existing, index) {
  const proof = proofReference(item, existing);
  const decision = founderDecision(item, existing);
  const targetStatus = s(existing?.statusAdvance?.targetStatus) || deriveTarget(item);
  const reviewStatus = deriveReviewStatus(item, existing);

  return {
    reviewId: existing?.reviewId || `pj29-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-29",
    worklistId: item.worklistId,
    queueId: item.queueId,
    workflowId: item.workflowId,
    threadId: item.threadId,
    trackerId: item.trackerId,
    packId: item.packId,
    reviewStatus,
    priorityBand: item.priorityBand,
    priorityScore: item.priorityScore,
    context: {
      worklistStatus: item.worklistStatus,
      workSlot: item.workSlot,
      candidateStatus: s(item.context?.candidateStatus),
      responseStatus: s(item.context?.responseStatus),
      opportunity: item.context?.opportunity || {},
      proofFromContext: item.context?.proof || {},
      outcome: item.context?.outcome || {},
      actionPacket: item.actionPacket || {}
    },
    proof: {
      proofReference: proof,
      proofType: s(existing?.proof?.proofType),
      proofLocation: s(existing?.proof?.proofLocation),
      proofCapturedAt: s(existing?.proof?.proofCapturedAt),
      proofNotes: s(existing?.proof?.proofNotes || item.operatorProgress?.completionNote),
      proofIsSensitive: b(existing?.proof?.proofIsSensitive),
      proofVisibleToCandidate: b(existing?.proof?.proofVisibleToCandidate)
    },
    reviewDecision: {
      decision,
      decidedBy: s(existing?.reviewDecision?.decidedBy || item.founderDecision?.decidedBy),
      decidedAt: s(existing?.reviewDecision?.decidedAt || item.founderDecision?.decidedAt),
      decisionNote: s(existing?.reviewDecision?.decisionNote || item.founderDecision?.decisionNote),
      rejectionReason: s(existing?.reviewDecision?.rejectionReason)
    },
    statusAdvance: {
      targetStatus,
      advanceApproved: reviewStatus === "APPROVED_FOR_STATUS_ADVANCE" || b(existing?.statusAdvance?.advanceApproved),
      advancedAt: s(existing?.statusAdvance?.advancedAt),
      advancedBy: s(existing?.statusAdvance?.advancedBy),
      advancementProof: s(existing?.statusAdvance?.advancementProof),
      advancementNote: s(existing?.statusAdvance?.advancementNote)
    },
    controls: {
      canAdvanceStatus: Boolean(
        proof &&
        ["APPROVED_FOR_STATUS_ADVANCE", "STATUS_ADVANCE_RECORDED"].includes(reviewStatus) &&
        targetStatus !== "NONE"
      ),
      requiresProof: true,
      requiresFounderDecision: true,
      requiresHumanAction: true,
      autoMutatesTracker: false,
      autoMutatesWorklist: false,
      autoSendsCandidateMessage: false,
      autoContactsEmployer: false
    },
    auditRules: [
      "No status advancement without proof.",
      "No status advancement without founder/operator decision.",
      "No candidate-facing success claim without proof.",
      "No automatic application, email, WhatsApp, SMS, or employer contact.",
      "Status advancement is recorded here only; upstream mutation must be a separate explicit module."
    ],
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      autoMutatesTracker: false,
      autoMutatesWorklist: false,
      productionClaim: false,
      deployedToOracle: false
    },
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
}

function summarize(items) {
  const byReviewStatus = {};
  const byTargetStatus = {};
  const byPriorityBand = {};

  for (const item of items) {
    byReviewStatus[item.reviewStatus] = (byReviewStatus[item.reviewStatus] || 0) + 1;
    byTargetStatus[item.statusAdvance.targetStatus] = (byTargetStatus[item.statusAdvance.targetStatus] || 0) + 1;
    byPriorityBand[item.priorityBand] = (byPriorityBand[item.priorityBand] || 0) + 1;
  }

  return {
    totalItems: items.length,
    waitingFounderDecision: items.filter((x) => x.reviewStatus === "WAITING_FOUNDER_DECISION").length,
    needsProof: items.filter((x) => x.reviewStatus === "NEEDS_PROOF").length,
    readyForReview: items.filter((x) => x.reviewStatus === "READY_FOR_REVIEW").length,
    approvedForStatusAdvance: items.filter((x) => x.reviewStatus === "APPROVED_FOR_STATUS_ADVANCE").length,
    rejectedProof: items.filter((x) => x.reviewStatus === "REJECTED_PROOF").length,
    statusAdvanceRecorded: items.filter((x) => x.reviewStatus === "STATUS_ADVANCE_RECORDED").length,
    closed: items.filter((x) => x.reviewStatus === "CLOSED").length,
    canAdvanceStatus: items.filter((x) => x.controls?.canAdvanceStatus).length,
    proofCaptured: items.filter((x) => Boolean(x.proof?.proofReference)).length,
    byReviewStatus,
    byTargetStatus,
    byPriorityBand
  };
}

export function runProofReviewBoard() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ28 input: ${INPUT}. Run PJ28 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.worklistItems)) {
    throw new Error("PJ29 requires PJ28 completed daily-worklist.local.json with worklistItems array.");
  }

  const existing = readExisting();
  const existingMap = existingByWorklistId(existing);

  const reviewItems = input.worklistItems.map((item, index) => makeReviewItem(item, existingMap.get(item.worklistId), index));
  const summary = summarize(reviewItems);

  const output = {
    schema: "kingsmen.personal-jobs-29.proof-review-board.v1",
    module: "PERSONAL-JOBS-29",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj28WorklistItemCount: input.worklistItems.length,
    reviewItemCount: reviewItems.length,
    allowedReviewStatuses: REVIEW_STATUSES,
    allowedAdvancementTargets: ADVANCEMENT_TARGETS,
    summary,
    reviewItems,
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      autoMutatesTracker: false,
      autoMutatesWorklist: false,
      productionClaim: false,
      deployedToOracle: false
    },
    handoff: {
      nextModule: "PERSONAL-JOBS-30",
      nextPurpose: "Status advancement writer and audit mirror for approved proof decisions.",
      onlyAfter: "PJ29 proof review board is proven, validated, committed, and clean."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-29.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    reviewItemCount: output.reviewItemCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/proof-review-board and review proof before any status advancement."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runProofReviewBoard();
  console.log(JSON.stringify({
    status: output.status,
    pj28WorklistItemCount: output.pj28WorklistItemCount,
    reviewItemCount: output.reviewItemCount,
    summary: output.summary
  }, null, 2));
}