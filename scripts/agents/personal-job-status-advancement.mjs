import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/proof-review-board.local.json";
const OUTPUT = "data/personal-job-desk/status-advancement-audit.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-30-status-advancement-latest.json";

export const ADVANCEMENT_RECORD_STATUSES = [
  "NOT_READY",
  "READY_TO_RECORD",
  "RECORDED_IN_AUDIT_MIRROR",
  "REJECTED",
  "BLOCKED",
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

function existingByReviewId(existing) {
  const map = new Map();
  const records = Array.isArray(existing?.advancementRecords) ? existing.advancementRecords : [];
  for (const record of records) {
    if (record?.reviewId) map.set(record.reviewId, record);
  }
  return map;
}

function deriveRecordStatus(reviewItem, existing) {
  const saved = s(existing?.recordStatus);
  if (ADVANCEMENT_RECORD_STATUSES.includes(saved) && saved !== "NOT_READY") return saved;

  if (reviewItem.reviewStatus === "CLOSED") return "CLOSED";
  if (reviewItem.reviewStatus === "REJECTED_PROOF") return "REJECTED";
  if (!reviewItem.proof?.proofReference) return "NOT_READY";
  if (!reviewItem.statusAdvance?.advanceApproved) return "NOT_READY";
  if (!reviewItem.statusAdvance?.targetStatus || reviewItem.statusAdvance.targetStatus === "NONE") return "BLOCKED";
  if (reviewItem.controls?.canAdvanceStatus) return "READY_TO_RECORD";

  return "NOT_READY";
}

function makeCandidateMessage(recordStatus, reviewItem) {
  const title = s(reviewItem.context?.opportunity?.title || "your application");
  const company = s(reviewItem.context?.opportunity?.company || "the employer");
  const target = s(reviewItem.statusAdvance?.targetStatus || "REVIEW_REQUIRED");

  if (recordStatus === "RECORDED_IN_AUDIT_MIRROR" || recordStatus === "READY_TO_RECORD") {
    return `Your tracked application for ${title} at ${company} has a proof-backed status update ready for review: ${target}. Kingsmen will only show this as final after the operator records it with proof.`;
  }

  if (recordStatus === "REJECTED") {
    return `The submitted proof for ${title} at ${company} could not be accepted for status advancement. Kingsmen will keep the record under review until valid proof is available.`;
  }

  if (recordStatus === "BLOCKED") {
    return `The status update for ${title} at ${company} is blocked because the target status or proof decision is incomplete.`;
  }

  return `The application status for ${title} at ${company} is not ready for advancement yet because proof and approval are still required.`;
}

function makeRecord(reviewItem, existing, index) {
  const recordStatus = deriveRecordStatus(reviewItem, existing);
  const targetStatus = s(existing?.targetStatus || reviewItem.statusAdvance?.targetStatus || "NONE");
  const proofReference = s(existing?.proofReference || reviewItem.proof?.proofReference);
  const approved = b(existing?.advanceApproved || reviewItem.statusAdvance?.advanceApproved);

  return {
    advancementId: existing?.advancementId || `pj30-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-30",
    reviewId: reviewItem.reviewId,
    worklistId: reviewItem.worklistId,
    queueId: reviewItem.queueId,
    workflowId: reviewItem.workflowId,
    threadId: reviewItem.threadId,
    trackerId: reviewItem.trackerId,
    packId: reviewItem.packId,
    recordStatus,
    sourceReviewStatus: reviewItem.reviewStatus,
    sourcePriorityBand: reviewItem.priorityBand,
    targetStatus,
    advanceApproved: approved,
    proofReference,
    proofType: s(reviewItem.proof?.proofType),
    proofLocation: s(reviewItem.proof?.proofLocation),
    proofVisibleToCandidate: b(reviewItem.proof?.proofVisibleToCandidate),
    proofIsSensitive: b(reviewItem.proof?.proofIsSensitive),
    context: {
      previousCandidateStatus: s(reviewItem.context?.candidateStatus),
      responseStatus: s(reviewItem.context?.responseStatus),
      opportunity: reviewItem.context?.opportunity || {},
      outcome: reviewItem.context?.outcome || {},
      actionPacket: reviewItem.context?.actionPacket || {}
    },
    auditMirror: {
      recordedInAuditMirror: recordStatus === "RECORDED_IN_AUDIT_MIRROR" || b(existing?.auditMirror?.recordedInAuditMirror),
      recordedAt: s(existing?.auditMirror?.recordedAt),
      recordedBy: s(existing?.auditMirror?.recordedBy),
      auditReference: s(existing?.auditMirror?.auditReference),
      auditNote: s(existing?.auditMirror?.auditNote)
    },
    candidateFacing: {
      candidateMessageDraft: s(existing?.candidateFacing?.candidateMessageDraft) || makeCandidateMessage(recordStatus, reviewItem),
      candidateMessageApproved: b(existing?.candidateFacing?.candidateMessageApproved),
      candidateMessageSentManually: b(existing?.candidateFacing?.candidateMessageSentManually),
      manualSendProof: s(existing?.candidateFacing?.manualSendProof)
    },
    controls: {
      canRecordAuditMirror: Boolean(proofReference && approved && targetStatus !== "NONE"),
      canMarkRecorded: Boolean(proofReference && approved && targetStatus !== "NONE"),
      requiresProof: true,
      requiresApproval: true,
      autoMutatesApplicationTracker: false,
      autoMutatesProofBoard: false,
      autoSendsCandidateMessage: false,
      autoContactsEmployer: false,
      writesAuditMirrorOnly: true
    },
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      autoMutatesApplicationTracker: false,
      autoMutatesProofBoard: false,
      productionClaim: false,
      deployedToOracle: false
    },
    auditRules: [
      "PJ30 records a status advancement audit mirror only.",
      "PJ30 does not mutate PJ24 application tracker automatically.",
      "PJ30 does not mutate PJ29 proof review board automatically.",
      "No status advance may be recorded without proof and approval.",
      "No candidate message is sent automatically."
    ],
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
}

function summarize(records) {
  const byRecordStatus = {};
  const byTargetStatus = {};
  const byPriorityBand = {};

  for (const record of records) {
    byRecordStatus[record.recordStatus] = (byRecordStatus[record.recordStatus] || 0) + 1;
    byTargetStatus[record.targetStatus] = (byTargetStatus[record.targetStatus] || 0) + 1;
    byPriorityBand[record.sourcePriorityBand] = (byPriorityBand[record.sourcePriorityBand] || 0) + 1;
  }

  return {
    totalRecords: records.length,
    notReady: records.filter((x) => x.recordStatus === "NOT_READY").length,
    readyToRecord: records.filter((x) => x.recordStatus === "READY_TO_RECORD").length,
    recordedInAuditMirror: records.filter((x) => x.recordStatus === "RECORDED_IN_AUDIT_MIRROR").length,
    rejected: records.filter((x) => x.recordStatus === "REJECTED").length,
    blocked: records.filter((x) => x.recordStatus === "BLOCKED").length,
    closed: records.filter((x) => x.recordStatus === "CLOSED").length,
    canRecordAuditMirror: records.filter((x) => x.controls?.canRecordAuditMirror).length,
    proofBacked: records.filter((x) => Boolean(x.proofReference)).length,
    approved: records.filter((x) => x.advanceApproved).length,
    byRecordStatus,
    byTargetStatus,
    byPriorityBand
  };
}

export function runStatusAdvancement() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ29 input: ${INPUT}. Run PJ29 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.reviewItems)) {
    throw new Error("PJ30 requires PJ29 completed proof-review-board.local.json with reviewItems array.");
  }

  const existing = readExisting();
  const existingMap = existingByReviewId(existing);

  const advancementRecords = input.reviewItems.map((item, index) => makeRecord(item, existingMap.get(item.reviewId), index));
  const summary = summarize(advancementRecords);

  const output = {
    schema: "kingsmen.personal-jobs-30.status-advancement-audit.v1",
    module: "PERSONAL-JOBS-30",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj29ReviewItemCount: input.reviewItems.length,
    advancementRecordCount: advancementRecords.length,
    allowedRecordStatuses: ADVANCEMENT_RECORD_STATUSES,
    allowedAdvancementTargets: ADVANCEMENT_TARGETS,
    summary,
    advancementRecords,
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      sendsSms: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      autoMutatesApplicationTracker: false,
      autoMutatesProofBoard: false,
      productionClaim: false,
      deployedToOracle: false
    },
    handoff: {
      nextModule: "PERSONAL-JOBS-31",
      nextPurpose: "Candidate status timeline and evidence-readable dashboard.",
      onlyAfter: "PJ30 audit mirror is proven, validated, committed, and clean."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-30.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    advancementRecordCount: output.advancementRecordCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/status-advancement and record approved proof-backed status changes in the audit mirror."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runStatusAdvancement();
  console.log(JSON.stringify({
    status: output.status,
    pj29ReviewItemCount: output.pj29ReviewItemCount,
    advancementRecordCount: output.advancementRecordCount,
    summary: output.summary
  }, null, 2));
}