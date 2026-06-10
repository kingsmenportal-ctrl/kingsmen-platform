import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/manual-submission-workbench.local.json";
const OUTPUT = "data/personal-job-desk/application-tracker.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-24-application-tracker-latest.json";

export const CANDIDATE_STATUSES = [
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

function readExistingTracker() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByWorkbenchId(existing) {
  const map = new Map();
  const items = Array.isArray(existing?.items) ? existing.items : [];
  for (const item of items) {
    if (item?.workbenchId) map.set(item.workbenchId, item);
  }
  return map;
}

function deriveCandidateStatus(record) {
  const status = s(record.execution?.executionStatus);

  if (status === "READY_TO_EXECUTE_MANUALLY") return "READY_FOR_MANUAL_SUBMISSION";
  if (status === "MANUAL_SUBMISSION_STARTED") return "MANUAL_SUBMISSION_IN_PROGRESS";
  if (status === "SUBMITTED_PROOF_CAPTURED") return "SUBMITTED_PROOF_CAPTURED";
  if (status === "FOLLOW_UP_SCHEDULED") return "FOLLOW_UP_SCHEDULED";
  if (status === "OUTCOME_INTERVIEW") return "INTERVIEW_STAGE";
  if (status === "OUTCOME_REJECTED") return "REJECTED";
  if (status === "OUTCOME_OFFER") return "OFFER_RECEIVED";
  if (status === "OUTCOME_NO_RESPONSE") return "NO_RESPONSE_FOLLOWUP";
  if (status === "CLOSED_NOT_APPLYING") return "CLOSED_NOT_APPLYING";

  return "REVIEW_REQUIRED";
}

function statusMessage(status, record) {
  const title = s(record.officialSource?.title || record.pack?.title || "this opportunity");
  const company = s(record.officialSource?.company || record.pack?.company || "the employer");

  if (status === "REVIEW_REQUIRED") {
    return `${title} at ${company} is still being reviewed. It is not ready for manual submission yet.`;
  }

  if (status === "READY_FOR_MANUAL_SUBMISSION") {
    return `${title} at ${company} is approved for manual submission. Kingsmen still requires human execution and proof capture.`;
  }

  if (status === "MANUAL_SUBMISSION_IN_PROGRESS") {
    return `${title} at ${company} is in manual submission progress. Proof must be captured before it can be marked submitted.`;
  }

  if (status === "SUBMITTED_PROOF_CAPTURED") {
    return `${title} at ${company} has submission proof captured. Outcome monitoring can continue.`;
  }

  if (status === "FOLLOW_UP_SCHEDULED") {
    return `${title} at ${company} has a follow-up scheduled.`;
  }

  if (status === "INTERVIEW_STAGE") return `${title} at ${company} has moved to interview stage.`;
  if (status === "REJECTED") return `${title} at ${company} was marked rejected.`;
  if (status === "OFFER_RECEIVED") return `${title} at ${company} has an offer recorded.`;
  if (status === "NO_RESPONSE_FOLLOWUP") return `${title} at ${company} needs no-response follow-up.`;
  if (status === "CLOSED_NOT_APPLYING") return `${title} at ${company} was closed as not applying.`;

  return `${title} at ${company} is being tracked.`;
}

function buildProgress(status, record) {
  const checklist = Array.isArray(record.checklist) ? record.checklist : [];
  const completed = new Set(checklist.filter((x) => x.completed).map((x) => x.key));

  return [
    {
      key: "pack_created",
      label: "Application pack created",
      state: "DONE",
      proofBacked: true
    },
    {
      key: "human_review",
      label: "Human review / approval",
      state: record.readiness?.candidateApproved && record.readiness?.founderReviewed ? "DONE" : "WAITING",
      proofBacked: Boolean(record.readiness?.candidateApproved && record.readiness?.founderReviewed)
    },
    {
      key: "manual_execution",
      label: "Manual submission execution",
      state: ["MANUAL_SUBMISSION_IN_PROGRESS", "SUBMITTED_PROOF_CAPTURED", "FOLLOW_UP_SCHEDULED", "INTERVIEW_STAGE", "REJECTED", "OFFER_RECEIVED", "NO_RESPONSE_FOLLOWUP"].includes(status)
        ? "DONE_OR_ACTIVE"
        : status === "READY_FOR_MANUAL_SUBMISSION" ? "READY" : "WAITING",
      proofBacked: completed.has("submit_manually") || ["SUBMITTED_PROOF_CAPTURED", "FOLLOW_UP_SCHEDULED", "INTERVIEW_STAGE", "REJECTED", "OFFER_RECEIVED", "NO_RESPONSE_FOLLOWUP"].includes(status)
    },
    {
      key: "proof_capture",
      label: "Submission proof captured",
      state: record.readiness?.proofCaptured || status === "SUBMITTED_PROOF_CAPTURED" ? "DONE" : "WAITING",
      proofBacked: Boolean(record.readiness?.proofCaptured || status === "SUBMITTED_PROOF_CAPTURED")
    },
    {
      key: "follow_up_or_outcome",
      label: "Follow-up / outcome",
      state: ["FOLLOW_UP_SCHEDULED", "INTERVIEW_STAGE", "REJECTED", "OFFER_RECEIVED", "NO_RESPONSE_FOLLOWUP"].includes(status) ? "DONE_OR_ACTIVE" : "WAITING",
      proofBacked: ["INTERVIEW_STAGE", "REJECTED", "OFFER_RECEIVED"].includes(status)
    }
  ];
}

function publicProof(record) {
  const proofType = s(record.execution?.proofType);
  const proofReference = s(record.execution?.proofReference);
  const proofNotes = s(record.execution?.proofNotes);
  const submittedAt = s(record.execution?.submittedAt);

  return {
    proofCaptured: Boolean(proofType || proofReference || proofNotes || submittedAt),
    proofType,
    proofReference,
    submittedAt,
    proofNotes: proofNotes ? "Proof note exists in operator record." : "",
    candidateVisibleRule: "Show proof summary only. Do not expose sensitive internal operator notes."
  };
}

function makeItem(record, existing, index) {
  const candidateStatus = deriveCandidateStatus(record);
  const progress = buildProgress(candidateStatus, record);

  return {
    trackerId: existing?.trackerId || `pj24-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-24",
    workbenchId: record.workbenchId,
    ledgerId: record.ledgerId,
    packId: record.packId,
    candidateStatus,
    candidateMessage: statusMessage(candidateStatus, record),
    opportunity: {
      title: s(record.officialSource?.title || record.pack?.title),
      company: s(record.officialSource?.company || record.pack?.company),
      location: s(record.officialSource?.location || record.pack?.location),
      sourceUrl: s(record.officialSource?.sourceUrl),
      applyUrl: s(record.officialSource?.applyUrl)
    },
    timeline: {
      createdAt: s(record.createdAt),
      updatedAt: s(record.updatedAt),
      startedAt: s(record.execution?.startedAt),
      submittedAt: s(record.execution?.submittedAt),
      followUpDate: s(record.execution?.followUpDate)
    },
    progress,
    proof: publicProof(record),
    outcome: {
      outcomeStatus: s(record.execution?.outcomeStatus || "NONE"),
      outcomeNotesVisible: Boolean(s(record.execution?.outcomeNotes)),
      outcomeMessage: s(record.execution?.outcomeNotes) ? "Outcome note exists in operator record." : ""
    },
    candidateControls: {
      candidateAcknowledged: b(existing?.candidateControls?.candidateAcknowledged),
      candidateQuestion: s(existing?.candidateControls?.candidateQuestion),
      lastCandidateNoteAt: s(existing?.candidateControls?.lastCandidateNoteAt)
    },
    disclaimers: [
      "Kingsmen does not guarantee employment, interview, offer, or response.",
      "Progress is proof-backed where proof exists.",
      "Manual submission still requires human action and official-channel confirmation.",
      "No employer is contacted automatically from this tracker."
    ],
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
    createdAt: existing?.createdAt || now(),
    updatedAt: now()
  };
}

function summarize(items) {
  const byCandidateStatus = {};
  for (const item of items) {
    byCandidateStatus[item.candidateStatus] = (byCandidateStatus[item.candidateStatus] || 0) + 1;
  }

  return {
    totalItems: items.length,
    reviewRequired: items.filter((x) => x.candidateStatus === "REVIEW_REQUIRED").length,
    readyForManualSubmission: items.filter((x) => x.candidateStatus === "READY_FOR_MANUAL_SUBMISSION").length,
    submittedProofCaptured: items.filter((x) => x.candidateStatus === "SUBMITTED_PROOF_CAPTURED").length,
    followUpScheduled: items.filter((x) => x.candidateStatus === "FOLLOW_UP_SCHEDULED").length,
    outcomesVisible: items.filter((x) => ["INTERVIEW_STAGE", "REJECTED", "OFFER_RECEIVED", "NO_RESPONSE_FOLLOWUP"].includes(x.candidateStatus)).length,
    byCandidateStatus
  };
}

export function runApplicationTracker() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ23 input: ${INPUT}. Run PJ23 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.records)) {
    throw new Error("PJ24 requires PJ23 completed manual-submission-workbench.local.json with records array.");
  }

  const existing = readExistingTracker();
  const existingMap = existingByWorkbenchId(existing);

  const items = input.records.map((record, index) => makeItem(record, existingMap.get(record.workbenchId), index));
  const summary = summarize(items);

  const output = {
    schema: "kingsmen.personal-jobs-24.application-tracker.v1",
    module: "PERSONAL-JOBS-24",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj23RecordCount: input.records.length,
    trackerItemCount: items.length,
    allowedCandidateStatuses: CANDIDATE_STATUSES,
    summary,
    items,
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
      nextModule: "PERSONAL-JOBS-25",
      nextPurpose: "Candidate follow-up inbox, questions, and operator response queue.",
      onlyAfter: "PJ24 tracker items exist and candidate-safe messages are visible."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-24.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    trackerItemCount: output.trackerItemCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/application-tracker and inspect candidate-safe progress."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runApplicationTracker();
  console.log(JSON.stringify({
    status: output.status,
    pj23RecordCount: output.pj23RecordCount,
    trackerItemCount: output.trackerItemCount,
    summary: output.summary
  }, null, 2));
}