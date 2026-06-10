import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/status-advancement-audit.local.json";
const OUTPUT = "data/personal-job-desk/status-timeline.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-31-status-timeline-latest.json";

export const TIMELINE_STATUSES = [
  "AWAITING_PROOF",
  "AWAITING_APPROVAL",
  "READY_FOR_AUDIT_RECORD",
  "AUDIT_RECORDED",
  "REJECTED",
  "BLOCKED",
  "CLOSED"
];

export const EVIDENCE_LEVELS = [
  "NO_EVIDENCE",
  "INTERNAL_ONLY",
  "CANDIDATE_VISIBLE_SUMMARY",
  "PROOF_BACKED",
  "AUDIT_RECORDED"
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

function deriveTimelineStatus(record) {
  if (record.recordStatus === "RECORDED_IN_AUDIT_MIRROR") return "AUDIT_RECORDED";
  if (record.recordStatus === "REJECTED") return "REJECTED";
  if (record.recordStatus === "BLOCKED") return "BLOCKED";
  if (record.recordStatus === "CLOSED") return "CLOSED";
  if (!record.proofReference) return "AWAITING_PROOF";
  if (!record.advanceApproved) return "AWAITING_APPROVAL";
  if (record.controls?.canRecordAuditMirror) return "READY_FOR_AUDIT_RECORD";
  return "AWAITING_PROOF";
}

function deriveEvidenceLevel(record) {
  if (record.auditMirror?.recordedInAuditMirror) return "AUDIT_RECORDED";
  if (record.proofReference && record.proofVisibleToCandidate) return "CANDIDATE_VISIBLE_SUMMARY";
  if (record.proofReference) return "PROOF_BACKED";
  if (record.proofIsSensitive) return "INTERNAL_ONLY";
  return "NO_EVIDENCE";
}

function makeProgressSteps(record, timelineStatus) {
  return [
    {
      key: "application_tracked",
      label: "Application tracked",
      state: "DONE",
      evidenceBacked: true
    },
    {
      key: "proof_available",
      label: "Proof available",
      state: record.proofReference ? "DONE" : "WAITING",
      evidenceBacked: Boolean(record.proofReference)
    },
    {
      key: "operator_approval",
      label: "Operator approval",
      state: record.advanceApproved ? "DONE" : "WAITING",
      evidenceBacked: Boolean(record.advanceApproved)
    },
    {
      key: "audit_record",
      label: "Audit mirror record",
      state: record.auditMirror?.recordedInAuditMirror ? "DONE" : timelineStatus === "READY_FOR_AUDIT_RECORD" ? "READY" : "WAITING",
      evidenceBacked: Boolean(record.auditMirror?.recordedInAuditMirror)
    },
    {
      key: "candidate_visibility",
      label: "Candidate-safe visibility",
      state: record.candidateFacing?.candidateMessageApproved ? "READY" : "WAITING",
      evidenceBacked: Boolean(record.candidateFacing?.manualSendProof)
    }
  ];
}

function makeCandidateSummary(record, timelineStatus, evidenceLevel) {
  const title = s(record.context?.opportunity?.title || "your application");
  const company = s(record.context?.opportunity?.company || "the employer");

  if (timelineStatus === "AUDIT_RECORDED") {
    return `${title} at ${company} has a proof-backed status update recorded in the audit mirror.`;
  }

  if (timelineStatus === "READY_FOR_AUDIT_RECORD") {
    return `${title} at ${company} has proof and approval ready for audit recording.`;
  }

  if (timelineStatus === "AWAITING_APPROVAL") {
    return `${title} at ${company} has proof but is still waiting for operator approval before status advancement.`;
  }

  if (timelineStatus === "AWAITING_PROOF") {
    return `${title} at ${company} is still awaiting proof before any status advancement can be shown.`;
  }

  if (timelineStatus === "REJECTED") {
    return `${title} at ${company} has a rejected proof/status advancement decision.`;
  }

  if (timelineStatus === "BLOCKED") {
    return `${title} at ${company} is blocked until proof, target status, or decision gaps are fixed.`;
  }

  return `${title} at ${company} is closed.`;
}

function makeTimelineItem(record, index) {
  const timelineStatus = deriveTimelineStatus(record);
  const evidenceLevel = deriveEvidenceLevel(record);

  return {
    timelineId: `pj31-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-31",
    advancementId: record.advancementId,
    reviewId: record.reviewId,
    worklistId: record.worklistId,
    queueId: record.queueId,
    workflowId: record.workflowId,
    threadId: record.threadId,
    trackerId: record.trackerId,
    packId: record.packId,
    timelineStatus,
    evidenceLevel,
    targetStatus: s(record.targetStatus || "NONE"),
    previousCandidateStatus: s(record.context?.previousCandidateStatus || "REVIEW_REQUIRED"),
    candidateSummary: makeCandidateSummary(record, timelineStatus, evidenceLevel),
    opportunity: record.context?.opportunity || {},
    evidence: {
      proofReference: s(record.proofReference),
      proofType: s(record.proofType),
      proofLocation: s(record.proofLocation),
      proofVisibleToCandidate: b(record.proofVisibleToCandidate),
      proofIsSensitive: b(record.proofIsSensitive),
      auditReference: s(record.auditMirror?.auditReference),
      auditRecordedAt: s(record.auditMirror?.recordedAt),
      auditRecordedBy: s(record.auditMirror?.recordedBy)
    },
    candidateMessage: {
      draft: s(record.candidateFacing?.candidateMessageDraft),
      approved: b(record.candidateFacing?.candidateMessageApproved),
      sentManually: b(record.candidateFacing?.candidateMessageSentManually),
      manualSendProof: s(record.candidateFacing?.manualSendProof)
    },
    progressSteps: makeProgressSteps(record, timelineStatus),
    visibleRules: [
      "Candidate may see status summary only.",
      "Sensitive proof is never exposed directly.",
      "No success, interview, offer, response, or employment guarantee is shown.",
      "No status is final unless proof and audit mirror record exist."
    ],
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
    createdAt: now(),
    updatedAt: now()
  };
}

function summarize(items) {
  const byTimelineStatus = {};
  const byEvidenceLevel = {};
  const byTargetStatus = {};

  for (const item of items) {
    byTimelineStatus[item.timelineStatus] = (byTimelineStatus[item.timelineStatus] || 0) + 1;
    byEvidenceLevel[item.evidenceLevel] = (byEvidenceLevel[item.evidenceLevel] || 0) + 1;
    byTargetStatus[item.targetStatus] = (byTargetStatus[item.targetStatus] || 0) + 1;
  }

  return {
    totalItems: items.length,
    awaitingProof: items.filter((x) => x.timelineStatus === "AWAITING_PROOF").length,
    awaitingApproval: items.filter((x) => x.timelineStatus === "AWAITING_APPROVAL").length,
    readyForAuditRecord: items.filter((x) => x.timelineStatus === "READY_FOR_AUDIT_RECORD").length,
    auditRecorded: items.filter((x) => x.timelineStatus === "AUDIT_RECORDED").length,
    rejected: items.filter((x) => x.timelineStatus === "REJECTED").length,
    blocked: items.filter((x) => x.timelineStatus === "BLOCKED").length,
    closed: items.filter((x) => x.timelineStatus === "CLOSED").length,
    candidateVisibleMessages: items.filter((x) => x.candidateMessage?.approved).length,
    proofBacked: items.filter((x) => ["PROOF_BACKED", "CANDIDATE_VISIBLE_SUMMARY", "AUDIT_RECORDED"].includes(x.evidenceLevel)).length,
    byTimelineStatus,
    byEvidenceLevel,
    byTargetStatus
  };
}

export function runStatusTimeline() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ30 input: ${INPUT}. Run PJ30 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.advancementRecords)) {
    throw new Error("PJ31 requires PJ30 completed status-advancement-audit.local.json with advancementRecords array.");
  }

  const timelineItems = input.advancementRecords.map((record, index) => makeTimelineItem(record, index));
  const summary = summarize(timelineItems);

  const output = {
    schema: "kingsmen.personal-jobs-31.status-timeline.v1",
    module: "PERSONAL-JOBS-31",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj30AdvancementRecordCount: input.advancementRecords.length,
    timelineItemCount: timelineItems.length,
    allowedTimelineStatuses: TIMELINE_STATUSES,
    allowedEvidenceLevels: EVIDENCE_LEVELS,
    summary,
    timelineItems,
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
      nextModule: "PERSONAL-JOBS-32",
      nextPurpose: "Candidate-safe public job desk snapshot and exportable progress report.",
      onlyAfter: "PJ31 timeline dashboard is proven, validated, committed, and clean."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-31.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    timelineItemCount: output.timelineItemCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/status-timeline and inspect candidate-readable evidence timeline."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runStatusTimeline();
  console.log(JSON.stringify({
    status: output.status,
    pj30AdvancementRecordCount: output.pj30AdvancementRecordCount,
    timelineItemCount: output.timelineItemCount,
    summary: output.summary
  }, null, 2));
}