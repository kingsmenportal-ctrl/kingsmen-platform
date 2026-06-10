import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    byReviewStatus,
    byActionState,
    byOutcomeStatus
  };
}

export async function GET() {
  const synced = syncLedger();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncLedger();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const ledger = synced.output as any;
  const records = Array.isArray(ledger.records) ? ledger.records : [];
  const record = records.find((item: any) => item.ledgerId === body.ledgerId || item.packId === body.packId);

  if (!record) {
    return NextResponse.json({ status: "FAILED", error: "Ledger record not found." }, { status: 404 });
  }

  const incoming = body.review ?? {};
  const reviewStatus = REVIEW_STATUSES.includes(incoming.reviewStatus) ? incoming.reviewStatus : record.review.reviewStatus;
  const outcomeStatus = OUTCOME_STATUSES.includes(incoming.outcomeStatus) ? incoming.outcomeStatus : record.review.outcomeStatus;

  record.review = {
    reviewStatus,
    candidateApproved: cleanBool(incoming.candidateApproved),
    founderReviewed: cleanBool(incoming.founderReviewed),
    applicationMethod: cleanText(incoming.applicationMethod),
    submittedAt: cleanText(incoming.submittedAt),
    proofType: cleanText(incoming.proofType),
    proofReference: cleanText(incoming.proofReference),
    proofNotes: cleanText(incoming.proofNotes),
    outcomeStatus,
    outcomeNotes: cleanText(incoming.outcomeNotes),
    followUpDate: cleanText(incoming.followUpDate),
    reviewerNotes: cleanText(incoming.reviewerNotes)
  };

  record.actionState = deriveActionState(record.review);
  record.updatedAt = new Date().toISOString();

  ledger.generatedAt = new Date().toISOString();
  ledger.summary = summarize(records);

  writeLedger(ledger);
  return NextResponse.json({ status: "SAVED", record, summary: ledger.summary, ledger });
}