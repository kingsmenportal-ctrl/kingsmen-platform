import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/application-packs.local.json";
const OUTPUT = "data/personal-job-desk/application-review-ledger.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-22-review-ledger-latest.json";

export const REVIEW_STATUSES = [
  "PENDING_REVIEW",
  "NEEDS_PROFILE_FIX",
  "APPROVED_TO_APPLY_MANUALLY",
  "SUBMITTED_PROOF_CAPTURED",
  "REJECTED_NOT_APPLYING",
  "OUTCOME_INTERVIEW",
  "OUTCOME_REJECTED",
  "OUTCOME_OFFER",
  "NO_RESPONSE_FOLLOWUP"
];

export const OUTCOME_STATUSES = [
  "NONE",
  "SUBMITTED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "NO_RESPONSE",
  "WITHDRAWN"
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

function safeId(v) {
  return s(v).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "item";
}

function now() {
  return new Date().toISOString();
}

function readExistingLedger() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByPackId(existing) {
  const map = new Map();
  const records = Array.isArray(existing?.records) ? existing.records : [];
  for (const record of records) {
    if (record?.packId) map.set(record.packId, record);
  }
  return map;
}

function packSummary(pack) {
  return {
    packId: s(pack.packId),
    packStatus: s(pack.status),
    candidateDataStatus: s(pack.candidateDataStatus),
    title: s(pack.lead?.title),
    company: s(pack.lead?.company),
    location: s(pack.lead?.location),
    sourceUrl: s(pack.lead?.sourceUrl),
    applyUrl: s(pack.lead?.applyUrl),
    pj20bGateType: s(pack.lead?.pj20bGateType),
    pj20bQualityScore: Number(pack.lead?.pj20bQualityScore ?? 0),
    fitScore: Number(pack.fit?.score ?? 0),
    matchedTerms: Array.isArray(pack.fit?.matchedTerms) ? pack.fit.matchedTerms.map(s).filter(Boolean) : [],
    cvFocus: Array.isArray(pack.cvFocus) ? pack.cvFocus.map(s).filter(Boolean) : [],
    motivationDraft: s(pack.motivationDraft),
    manualApplySteps: Array.isArray(pack.manualApplySteps) ? pack.manualApplySteps.map(s).filter(Boolean) : [],
    proofToCapture: Array.isArray(pack.proofToCapture) ? pack.proofToCapture.map(s).filter(Boolean) : [],
    reviewWarnings: Array.isArray(pack.reviewWarnings) ? pack.reviewWarnings.map(s).filter(Boolean) : []
  };
}

function cleanReview(existingReview = {}) {
  const reviewStatus = REVIEW_STATUSES.includes(existingReview.reviewStatus)
    ? existingReview.reviewStatus
    : "PENDING_REVIEW";

  const outcomeStatus = OUTCOME_STATUSES.includes(existingReview.outcomeStatus)
    ? existingReview.outcomeStatus
    : "NONE";

  return {
    reviewStatus,
    candidateApproved: b(existingReview.candidateApproved),
    founderReviewed: b(existingReview.founderReviewed),
    applicationMethod: s(existingReview.applicationMethod),
    submittedAt: s(existingReview.submittedAt),
    proofType: s(existingReview.proofType),
    proofReference: s(existingReview.proofReference),
    proofNotes: s(existingReview.proofNotes),
    outcomeStatus,
    outcomeNotes: s(existingReview.outcomeNotes),
    followUpDate: s(existingReview.followUpDate),
    interviewAt: s(existingReview.interviewAt),
    nextAction: s(existingReview.nextAction),
    responseHistory: s(existingReview.responseHistory),
    reviewerNotes: s(existingReview.reviewerNotes)
  };
}

function deriveActionState(review) {
  if (review.reviewStatus === "SUBMITTED_PROOF_CAPTURED") return "PROOF_CAPTURED";
  if (String(review.reviewStatus || "").startsWith("OUTCOME_")) return "OUTCOME_RECORDED";
  if (review.reviewStatus === "APPROVED_TO_APPLY_MANUALLY" && review.candidateApproved && review.founderReviewed) {
    return "READY_FOR_MANUAL_SUBMISSION";
  }
  if (review.reviewStatus === "NEEDS_PROFILE_FIX") return "BLOCKED_PROFILE_FIX";
  if (review.reviewStatus === "REJECTED_NOT_APPLYING") return "CLOSED_NOT_APPLYING";
  return "WAITING_HUMAN_REVIEW";
}

function makeRecord(pack, existing, index) {
  const summary = packSummary(pack);
  const review = cleanReview(existing?.review ?? {});
  const actionState = deriveActionState(review);

  return {
    ledgerId: existing?.ledgerId || `pj22-${String(index + 1).padStart(4, "0")}-${safeId(summary.company)}-${safeId(summary.title)}`,
    module: "PERSONAL-JOBS-22",
    packId: summary.packId,
    actionState,
    pack: summary,
    review,
    submissionBoundary: {
      canSendAutomatically: false,
      canEmailEmployer: false,
      canWhatsAppEmployer: false,
      canTouchPayments: false,
      canBypassLoginOtpCaptcha: false,
      manualSubmissionOnlyAfterApproval: true,
      proofRequiredBeforeSubmittedStatus: true
    },
    requiredBeforeManualSubmission: [
      "Candidate approves this exact pack",
      "Founder/operator review is marked complete",
      "Official source is opened and checked again",
      "Application method is recorded",
      "No fake skills, certificates, references, salary history, or qualifications are added"
    ],
    proofLedgerRequirements: [
      "Official source URL",
      "Vacancy title and company",
      "Application method",
      "Submission confirmation or sent-email copy",
      "Reference number if issued",
      "Screenshot/PDF/email evidence",
      "Outcome update when employer responds"
    ],
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
}

function summarize(records) {
  const byReviewStatus = {};
  const byActionState = {};
  const byOutcomeStatus = {};

  for (const record of records) {
    byReviewStatus[record.review.reviewStatus] = (byReviewStatus[record.review.reviewStatus] || 0) + 1;
    byActionState[record.actionState] = (byActionState[record.actionState] || 0) + 1;
    byOutcomeStatus[record.review.outcomeStatus] = (byOutcomeStatus[record.review.outcomeStatus] || 0) + 1;
  }

  return {
    totalRecords: records.length,
    waitingHumanReview: records.filter((r) => r.actionState === "WAITING_HUMAN_REVIEW").length,
    readyForManualSubmission: records.filter((r) => r.actionState === "READY_FOR_MANUAL_SUBMISSION").length,
    proofCaptured: records.filter((r) => r.actionState === "PROOF_CAPTURED").length,
    outcomesRecorded: records.filter((r) => r.actionState === "OUTCOME_RECORDED").length,
    blockedProfileFix: records.filter((r) => r.actionState === "BLOCKED_PROFILE_FIX").length,
    closedNotApplying: records.filter((r) => r.actionState === "CLOSED_NOT_APPLYING").length,
    byReviewStatus,
    byActionState,
    byOutcomeStatus
  };
}

export function runReviewLedgerSync() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ21 input: ${INPUT}. Run PJ21 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.packs)) {
    throw new Error("PJ22 requires PJ21 completed application-packs.local.json with packs array.");
  }

  const existing = readExistingLedger();
  const map = existingByPackId(existing);

  const records = input.packs.map((pack, index) => makeRecord(pack, map.get(pack.packId), index));
  const summary = summarize(records);

  const output = {
    schema: "kingsmen.personal-jobs-22.review-ledger.v1",
    module: "PERSONAL-JOBS-22",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj21PackCount: input.packs.length,
    reviewRecordCount: records.length,
    allowedReviewStatuses: REVIEW_STATUSES,
    allowedOutcomeStatuses: OUTCOME_STATUSES,
    summary,
    records,
    safetyBoundary: {
      sendsApplications: false,
      sendsEmail: false,
      sendsWhatsApp: false,
      contactsEmployers: false,
      touchesPayments: false,
      bypassesLoginOtpCaptcha: false,
      productionClaim: false,
      deployedToOracle: false
    },
    handoff: {
      nextModule: "PERSONAL-JOBS-23",
      nextPurpose: "Manual submission execution checklist, follow-up calendar, and outcome reporting.",
      onlyAfter: "A specific PJ22 ledger record is approved and proof rules are satisfied."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-22.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    reviewRecordCount: output.reviewRecordCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/review-ledger, review packs, record approval/proof/outcome."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runReviewLedgerSync();
  console.log(JSON.stringify({
    status: output.status,
    pj21PackCount: output.pj21PackCount,
    reviewRecordCount: output.reviewRecordCount,
    summary: output.summary
  }, null, 2));
}