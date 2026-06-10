import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVIEW_STATUSES = [
  "WAITING_FOUNDER_DECISION",
  "NEEDS_PROOF",
  "READY_FOR_REVIEW",
  "APPROVED_FOR_STATUS_ADVANCE",
  "REJECTED_PROOF",
  "STATUS_ADVANCE_RECORDED",
  "CLOSED"
];

const ADVANCEMENT_TARGETS = [
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

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/proof-review-board.local.json");
}

function syncBoard(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-proof-review-board.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ29 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ29 sync failed.", status: 500 };
  }

  const output = JSON.parse(fs.readFileSync(outputPath(), "utf8"));
  return { ok: true, output };
}

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanBool(value: unknown) {
  return Boolean(value);
}

function summarize(items: any[]) {
  const byReviewStatus: Record<string, number> = {};
  const byTargetStatus: Record<string, number> = {};
  const byPriorityBand: Record<string, number> = {};

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

export async function GET() {
  const synced = syncBoard();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncBoard();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const board = synced.output as any;
  const items = Array.isArray(board.reviewItems) ? board.reviewItems : [];
  const item = items.find((x: any) =>
    x.reviewId === body.reviewId ||
    x.worklistId === body.worklistId ||
    x.packId === body.packId
  );

  if (!item) {
    return NextResponse.json({ status: "FAILED", error: "Proof review item not found." }, { status: 404 });
  }

  const incoming = body.item ?? {};
  const proof = incoming.proof ?? {};
  const reviewDecision = incoming.reviewDecision ?? {};
  const statusAdvance = incoming.statusAdvance ?? {};

  item.reviewStatus = REVIEW_STATUSES.includes(incoming.reviewStatus) ? incoming.reviewStatus : item.reviewStatus;

  item.proof = {
    proofReference: cleanText(proof.proofReference ?? item.proof?.proofReference),
    proofType: cleanText(proof.proofType ?? item.proof?.proofType),
    proofLocation: cleanText(proof.proofLocation ?? item.proof?.proofLocation),
    proofCapturedAt: cleanText(proof.proofCapturedAt ?? item.proof?.proofCapturedAt),
    proofNotes: cleanText(proof.proofNotes ?? item.proof?.proofNotes),
    proofIsSensitive: cleanBool(proof.proofIsSensitive ?? item.proof?.proofIsSensitive),
    proofVisibleToCandidate: cleanBool(proof.proofVisibleToCandidate ?? item.proof?.proofVisibleToCandidate)
  };

  item.reviewDecision = {
    decision: cleanText(reviewDecision.decision ?? item.reviewDecision?.decision),
    decidedBy: cleanText(reviewDecision.decidedBy ?? item.reviewDecision?.decidedBy),
    decidedAt: cleanText(reviewDecision.decidedAt ?? item.reviewDecision?.decidedAt),
    decisionNote: cleanText(reviewDecision.decisionNote ?? item.reviewDecision?.decisionNote),
    rejectionReason: cleanText(reviewDecision.rejectionReason ?? item.reviewDecision?.rejectionReason)
  };

  item.statusAdvance = {
    targetStatus: ADVANCEMENT_TARGETS.includes(statusAdvance.targetStatus)
      ? statusAdvance.targetStatus
      : item.statusAdvance?.targetStatus,
    advanceApproved: cleanBool(statusAdvance.advanceApproved ?? item.statusAdvance?.advanceApproved),
    advancedAt: cleanText(statusAdvance.advancedAt ?? item.statusAdvance?.advancedAt),
    advancedBy: cleanText(statusAdvance.advancedBy ?? item.statusAdvance?.advancedBy),
    advancementProof: cleanText(statusAdvance.advancementProof ?? item.statusAdvance?.advancementProof),
    advancementNote: cleanText(statusAdvance.advancementNote ?? item.statusAdvance?.advancementNote)
  };

  item.controls = {
    ...item.controls,
    canAdvanceStatus: Boolean(
      item.proof.proofReference &&
      item.statusAdvance.advanceApproved &&
      item.statusAdvance.targetStatus &&
      item.statusAdvance.targetStatus !== "NONE" &&
      ["APPROVED_FOR_STATUS_ADVANCE", "STATUS_ADVANCE_RECORDED"].includes(item.reviewStatus)
    )
  };

  item.updatedAt = new Date().toISOString();
  board.generatedAt = new Date().toISOString();
  board.summary = summarize(items);

  writeJson(outputPath(), board);
  return NextResponse.json({ status: "SAVED", item, summary: board.summary, board });
}