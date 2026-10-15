import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return NextResponse.json(body, { ...init, headers });
}

function validDateOnly(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validTimestamp(value: string) {
  return !value || (value.length <= 40 && !Number.isNaN(Date.parse(value)));
}

const REVIEW_STATUSES = [
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

const OUTCOME_STATUSES = [
  "NONE",
  "SUBMITTED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "NO_RESPONSE",
  "WITHDRAWN"
];

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function ledgerPath() {
  return path.join(repoRoot(), "data/personal-job-desk/application-review-ledger.local.json");
}

function syncLedger(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-review-ledger.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ22 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ22 sync failed.", status: 500 };
  }

  const output = JSON.parse(fs.readFileSync(ledgerPath(), "utf8"));
  return { ok: true, output };
}

function writeLedger(data: unknown) {
  const file = ledgerPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanBool(value: unknown) {
  return Boolean(value);
}

function deriveActionState(review: any) {
  if (review.reviewStatus === "SUBMITTED_PROOF_CAPTURED") return "PROOF_CAPTURED";
  if (String(review.reviewStatus || "").startsWith("OUTCOME_")) return "OUTCOME_RECORDED";
  if (review.reviewStatus === "APPROVED_TO_APPLY_MANUALLY" && review.candidateApproved && review.founderReviewed) {
    return "READY_FOR_MANUAL_SUBMISSION";
  }
  if (review.reviewStatus === "NEEDS_PROFILE_FIX") return "BLOCKED_PROFILE_FIX";
  if (review.reviewStatus === "REJECTED_NOT_APPLYING") return "CLOSED_NOT_APPLYING";
  return "WAITING_HUMAN_REVIEW";
}

function summarize(records: any[]) {
  const byReviewStatus: Record<string, number> = {};
  const byActionState: Record<string, number> = {};
  const byOutcomeStatus: Record<string, number> = {};

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
    followUpsOverdue: records.filter((r) => r.review.followUpDate && r.review.followUpDate < new Date().toISOString().slice(0, 10) && !["INTERVIEW", "REJECTED", "OFFER", "WITHDRAWN"].includes(r.review.outcomeStatus)).length,
    followUpsDueToday: records.filter((r) => r.review.followUpDate === new Date().toISOString().slice(0, 10) && !["INTERVIEW", "REJECTED", "OFFER", "WITHDRAWN"].includes(r.review.outcomeStatus)).length,
    interviewsScheduled: records.filter((r) => r.review.interviewAt && !Number.isNaN(Date.parse(r.review.interviewAt)) && Date.parse(r.review.interviewAt) >= Date.now()).length,
    byReviewStatus,
    byActionState,
    byOutcomeStatus
  };
}

export async function GET() {\n  if (process.env.NODE_ENV === "production") {\n    return privateJson({ status: "STORAGE_NOT_CONFIGURED", error: "Review ledger is disabled in production until authenticated, candidate-scoped persistent storage is configured." }, { status: 503 });\n  }
  const synced = syncLedger();
  if (!synced.ok) {
    return privateJson({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return privateJson(synced.output);
}

export async function POST(request: Request) {\n  if (process.env.NODE_ENV === "production") {\n    return privateJson({ status: "STORAGE_NOT_CONFIGURED", error: "Review ledger updates are disabled in production until authenticated, candidate-scoped persistent storage is configured." }, { status: 503 });\n  }
  const synced = syncLedger();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return privateJson({ status: "FAILED", error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ status: "FAILED", error: "Request body must be a JSON object." }, { status: 400 });
  }

  const ledger = synced.output as any;
  const records = Array.isArray(ledger.records) ? ledger.records : [];
  const record = records.find((item: any) => item.ledgerId === body.ledgerId || item.packId === body.packId);

  if (!record) {
    return privateJson({ status: "FAILED", error: "Ledger record not found." }, { status: 404 });
  }

  const incoming = body.review ?? {};
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return privateJson({ status: "FAILED", error: "Review must be a JSON object." }, { status: 400 });
  }
  if (incoming.reviewStatus !== undefined && !REVIEW_STATUSES.includes(incoming.reviewStatus)) {
    return privateJson({ status: "FAILED", error: "Unsupported review status." }, { status: 400 });
  }
  if (incoming.outcomeStatus !== undefined && !OUTCOME_STATUSES.includes(incoming.outcomeStatus)) {
    return privateJson({ status: "FAILED", error: "Unsupported outcome status." }, { status: 400 });
  }
  for (const key of ["candidateApproved", "founderReviewed"]) {
    if (incoming[key] !== undefined && typeof incoming[key] !== "boolean") {
      return privateJson({ status: "FAILED", error: key + " must be a boolean." }, { status: 400 });
    }
  }

  const reviewStatus = incoming.reviewStatus ?? record.review.reviewStatus;
  const outcomeStatus = incoming.outcomeStatus ?? record.review.outcomeStatus;
  const limits: Record<string, number> = { applicationMethod: 120, submittedAt: 40, proofType: 80, proofReference: 240, proofNotes: 2000, outcomeNotes: 2000, followUpDate: 10, interviewAt: 40, nextAction: 300, responseHistory: 3000, reviewerNotes: 2000 };
  const values: Record<string, string> = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = cleanText(incoming[key] ?? record.review[key] ?? "");
    if (value.length > max) return privateJson({ status: "FAILED", error: key + " exceeds " + max + " characters." }, { status: 400 });
    values[key] = value;
  }
  if (!validDateOnly(values.followUpDate)) return privateJson({ status: "FAILED", error: "followUpDate must be a valid YYYY-MM-DD date." }, { status: 400 });
  if (!validTimestamp(values.submittedAt)) return privateJson({ status: "FAILED", error: "submittedAt must be a valid timestamp." }, { status: 400 });
  if (!validTimestamp(values.interviewAt)) return privateJson({ status: "FAILED", error: "interviewAt must be a valid timestamp." }, { status: 400 });

  record.review = {
    reviewStatus,
    candidateApproved: incoming.candidateApproved === undefined ? record.review.candidateApproved : incoming.candidateApproved,
    founderReviewed: incoming.founderReviewed === undefined ? record.review.founderReviewed : incoming.founderReviewed,
    ...values,
    outcomeStatus
  };

  const approved = record.review.candidateApproved && record.review.founderReviewed;
  if (["APPROVED_TO_APPLY_MANUALLY", "SUBMITTED_PROOF_CAPTURED"].includes(reviewStatus) && !approved) {
    return privateJson({ status: "FAILED", error: "Both candidate approval and founder/operator review are required before manual submission can be marked ready or submitted." }, { status: 409 });
  }
  if (reviewStatus === "SUBMITTED_PROOF_CAPTURED" && (!record.review.submittedAt || !record.review.proofType || !record.review.proofReference)) {
    return privateJson({ status: "FAILED", error: "A submitted timestamp, proof type, and proof reference are required before marking proof captured." }, { status: 409 });
  }
  if (["INTERVIEW", "REJECTED", "OFFER", "NO_RESPONSE", "WITHDRAWN"].includes(outcomeStatus) &&
      !["SUBMITTED_PROOF_CAPTURED", "OUTCOME_INTERVIEW", "OUTCOME_REJECTED", "OUTCOME_OFFER", "NO_RESPONSE_FOLLOWUP"].includes(reviewStatus)) {
    return privateJson({ status: "FAILED", error: "Record submission proof before recording an employer outcome." }, { status: 409 });
  }

  record.actionState = deriveActionState(record.review);
  record.updatedAt = new Date().toISOString();

  ledger.generatedAt = new Date().toISOString();
  ledger.summary = summarize(records);

  writeLedger(ledger);
  return privateJson({ status: "SAVED", record, summary: ledger.summary, ledger });
}