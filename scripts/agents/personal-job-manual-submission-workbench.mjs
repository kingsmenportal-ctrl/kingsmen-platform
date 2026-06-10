import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "data/personal-job-desk/application-review-ledger.local.json";
const OUTPUT = "data/personal-job-desk/manual-submission-workbench.local.json";
const LATEST = "reports/personal-jobs/personal-jobs-23-manual-submission-workbench-latest.json";

export const EXECUTION_STATUSES = [
  "NOT_READY_REVIEW_REQUIRED",
  "READY_TO_EXECUTE_MANUALLY",
  "MANUAL_SUBMISSION_STARTED",
  "SUBMITTED_PROOF_CAPTURED",
  "FOLLOW_UP_SCHEDULED",
  "OUTCOME_INTERVIEW",
  "OUTCOME_REJECTED",
  "OUTCOME_OFFER",
  "OUTCOME_NO_RESPONSE",
  "CLOSED_NOT_APPLYING"
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

function now() {
  return new Date().toISOString();
}

function readExistingWorkbench() {
  if (!exists(OUTPUT)) return null;
  try {
    return readJson(OUTPUT);
  } catch {
    return null;
  }
}

function existingByLedgerId(existing) {
  const map = new Map();
  const records = Array.isArray(existing?.records) ? existing.records : [];
  for (const record of records) {
    if (record?.ledgerId) map.set(record.ledgerId, record);
  }
  return map;
}

function deriveExecutionStatus(ledgerRecord, existingExecution = {}) {
  const saved = s(existingExecution.executionStatus);
  if (EXECUTION_STATUSES.includes(saved) && saved !== "NOT_READY_REVIEW_REQUIRED") return saved;

  if (ledgerRecord.actionState === "READY_FOR_MANUAL_SUBMISSION") return "READY_TO_EXECUTE_MANUALLY";
  if (ledgerRecord.actionState === "PROOF_CAPTURED") return "SUBMITTED_PROOF_CAPTURED";
  if (ledgerRecord.actionState === "OUTCOME_RECORDED") {
    if (ledgerRecord.review?.outcomeStatus === "INTERVIEW") return "OUTCOME_INTERVIEW";
    if (ledgerRecord.review?.outcomeStatus === "REJECTED") return "OUTCOME_REJECTED";
    if (ledgerRecord.review?.outcomeStatus === "OFFER") return "OUTCOME_OFFER";
    if (ledgerRecord.review?.outcomeStatus === "NO_RESPONSE") return "OUTCOME_NO_RESPONSE";
  }
  if (ledgerRecord.actionState === "CLOSED_NOT_APPLYING") return "CLOSED_NOT_APPLYING";

  return "NOT_READY_REVIEW_REQUIRED";
}

function makeChecklist(record) {
  return [
    {
      key: "open_official_source",
      label: "Open the official source link again",
      required: true,
      completed: false
    },
    {
      key: "confirm_vacancy",
      label: "Confirm vacancy title, employer, location, closing date, and method are still valid",
      required: true,
      completed: false
    },
    {
      key: "confirm_candidate_approval",
      label: "Confirm candidate approved this exact pack",
      required: true,
      completed: b(record.review?.candidateApproved)
    },
    {
      key: "confirm_founder_review",
      label: "Confirm founder/operator reviewed this exact pack",
      required: true,
      completed: b(record.review?.founderReviewed)
    },
    {
      key: "prepare_documents",
      label: "Prepare CV, motivation draft, and requested documents without inventing facts",
      required: true,
      completed: false
    },
    {
      key: "submit_manually",
      label: "Submit manually through official channel only",
      required: true,
      completed: false
    },
    {
      key: "capture_proof",
      label: "Capture proof: screenshot, reference number, confirmation email, or sent-email copy",
      required: true,
      completed: false
    },
    {
      key: "record_follow_up",
      label: "Record follow-up date and outcome tracking note",
      required: true,
      completed: false
    }
  ];
}

function mergeChecklist(base, saved) {
  const savedMap = new Map((Array.isArray(saved) ? saved : []).map((item) => [item.key, item]));
  return base.map((item) => {
    const old = savedMap.get(item.key);
    return {
      ...item,
      completed: Boolean(old?.completed ?? item.completed),
      note: s(old?.note)
    };
  });
}

function requiredComplete(checklist) {
  return checklist.filter((item) => item.required).every((item) => item.completed);
}

function makeRecord(ledgerRecord, existing, index) {
  const checklist = mergeChecklist(makeChecklist(ledgerRecord), existing?.checklist);
  const execution = {
    executionStatus: deriveExecutionStatus(ledgerRecord, existing?.execution ?? {}),
    applicationMethod: s(existing?.execution?.applicationMethod || ledgerRecord.review?.applicationMethod),
    startedAt: s(existing?.execution?.startedAt),
    submittedAt: s(existing?.execution?.submittedAt || ledgerRecord.review?.submittedAt),
    proofType: s(existing?.execution?.proofType || ledgerRecord.review?.proofType),
    proofReference: s(existing?.execution?.proofReference || ledgerRecord.review?.proofReference),
    proofNotes: s(existing?.execution?.proofNotes || ledgerRecord.review?.proofNotes),
    followUpDate: s(existing?.execution?.followUpDate || ledgerRecord.review?.followUpDate),
    outcomeStatus: OUTCOME_STATUSES.includes(existing?.execution?.outcomeStatus)
      ? existing.execution.outcomeStatus
      : (OUTCOME_STATUSES.includes(ledgerRecord.review?.outcomeStatus) ? ledgerRecord.review.outcomeStatus : "NONE"),
    outcomeNotes: s(existing?.execution?.outcomeNotes || ledgerRecord.review?.outcomeNotes),
    executorNotes: s(existing?.execution?.executorNotes)
  };

  const canStartManualSubmission =
    ledgerRecord.actionState === "READY_FOR_MANUAL_SUBMISSION" &&
    b(ledgerRecord.review?.candidateApproved) &&
    b(ledgerRecord.review?.founderReviewed);

  const proofCaptured = Boolean(execution.proofType || execution.proofReference || execution.proofNotes || execution.executionStatus === "SUBMITTED_PROOF_CAPTURED");

  return {
    workbenchId: existing?.workbenchId || `pj23-${String(index + 1).padStart(4, "0")}`,
    module: "PERSONAL-JOBS-23",
    ledgerId: ledgerRecord.ledgerId,
    packId: ledgerRecord.packId,
    readiness: {
      pj22ActionState: ledgerRecord.actionState,
      canStartManualSubmission,
      requiredChecklistComplete: requiredComplete(checklist),
      proofCaptured,
      candidateApproved: b(ledgerRecord.review?.candidateApproved),
      founderReviewed: b(ledgerRecord.review?.founderReviewed)
    },
    pack: ledgerRecord.pack,
    execution,
    checklist,
    officialSource: {
      sourceUrl: s(ledgerRecord.pack?.sourceUrl),
      applyUrl: s(ledgerRecord.pack?.applyUrl),
      title: s(ledgerRecord.pack?.title),
      company: s(ledgerRecord.pack?.company),
      location: s(ledgerRecord.pack?.location)
    },
    proofRules: [
      "Submitted status requires proof.",
      "Proof may be screenshot, confirmation email, sent-email copy, reference number, or portal confirmation.",
      "No outcome may be claimed without evidence or candidate/employer response.",
      "No employer contact is sent by PJ23 automatically."
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

function summarize(records) {
  const byExecutionStatus = {};
  const byOutcomeStatus = {};

  for (const record of records) {
    byExecutionStatus[record.execution.executionStatus] = (byExecutionStatus[record.execution.executionStatus] || 0) + 1;
    byOutcomeStatus[record.execution.outcomeStatus] = (byOutcomeStatus[record.execution.outcomeStatus] || 0) + 1;
  }

  return {
    totalRecords: records.length,
    notReadyReviewRequired: records.filter((r) => r.execution.executionStatus === "NOT_READY_REVIEW_REQUIRED").length,
    readyToExecuteManually: records.filter((r) => r.execution.executionStatus === "READY_TO_EXECUTE_MANUALLY").length,
    manualSubmissionStarted: records.filter((r) => r.execution.executionStatus === "MANUAL_SUBMISSION_STARTED").length,
    submittedProofCaptured: records.filter((r) => r.execution.executionStatus === "SUBMITTED_PROOF_CAPTURED").length,
    followUpScheduled: records.filter((r) => r.execution.executionStatus === "FOLLOW_UP_SCHEDULED").length,
    outcomesRecorded: records.filter((r) => String(r.execution.executionStatus).startsWith("OUTCOME_")).length,
    byExecutionStatus,
    byOutcomeStatus
  };
}

export function runManualSubmissionWorkbench() {
  if (!exists(INPUT)) {
    throw new Error(`Missing PJ22 input: ${INPUT}. Run PJ22 first.`);
  }

  const input = readJson(INPUT);
  if (input?.status !== "COMPLETED" || !Array.isArray(input?.records)) {
    throw new Error("PJ23 requires PJ22 completed application-review-ledger.local.json with records array.");
  }

  const existing = readExistingWorkbench();
  const existingMap = existingByLedgerId(existing);

  const records = input.records.map((ledgerRecord, index) => makeRecord(ledgerRecord, existingMap.get(ledgerRecord.ledgerId), index));
  const summary = summarize(records);

  const output = {
    schema: "kingsmen.personal-jobs-23.manual-submission-workbench.v1",
    module: "PERSONAL-JOBS-23",
    status: "COMPLETED",
    generatedAt: now(),
    inputPath: INPUT,
    outputPath: OUTPUT,
    pj22RecordCount: input.records.length,
    workbenchRecordCount: records.length,
    allowedExecutionStatuses: EXECUTION_STATUSES,
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
      nextModule: "PERSONAL-JOBS-24",
      nextPurpose: "Candidate-facing application tracker and proof-backed progress view.",
      onlyAfter: "PJ23 manual execution records have proof or follow-up/outcome state."
    }
  };

  writeJson(OUTPUT, output);

  writeJson(LATEST, {
    schema: "kingsmen.personal-jobs-23.latest.v1",
    module: output.module,
    status: output.status,
    generatedAt: output.generatedAt,
    inputPath: INPUT,
    outputPath: OUTPUT,
    workbenchRecordCount: output.workbenchRecordCount,
    summary,
    safetyBoundary: output.safetyBoundary,
    nextAction: "Open /personal-job-desk/manual-submission-workbench and process approved records manually."
  });

  return output;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const output = runManualSubmissionWorkbench();
  console.log(JSON.stringify({
    status: output.status,
    pj22RecordCount: output.pj22RecordCount,
    workbenchRecordCount: output.workbenchRecordCount,
    summary: output.summary
  }, null, 2));
}