import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUEUE_STATUSES = [
  "BLOCKED_REVIEW_REQUIRED",
  "READY_FOR_MANUAL_SUBMISSION",
  "MANUAL_SUBMISSION_IN_PROGRESS",
  "PROOF_CAPTURE_REQUIRED",
  "FOLLOW_UP_DUE",
  "OUTCOME_REVIEW_REQUIRED",
  "CANDIDATE_RESPONSE_REQUIRED",
  "CLOSED"
];

const PRIORITY_BANDS = [
  "P0_URGENT",
  "P1_HIGH",
  "P2_NORMAL",
  "P3_LOW",
  "P4_WAIT"
];

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/readiness-priority-queue.local.json");
}

function syncQueue(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-readiness-queue.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ27 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ27 sync failed.", status: 500 };
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

function summarize(items: any[]) {
  const byQueueStatus: Record<string, number> = {};
  const byPriorityBand: Record<string, number> = {};

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

export async function GET() {
  const synced = syncQueue();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncQueue();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const queue = synced.output as any;
  const items = Array.isArray(queue.queueItems) ? queue.queueItems : [];
  const item = items.find((x: any) =>
    x.queueId === body.queueId ||
    x.workflowId === body.workflowId ||
    x.packId === body.packId
  );

  if (!item) {
    return NextResponse.json({ status: "FAILED", error: "Readiness queue item not found." }, { status: 404 });
  }

  const incoming = body.item ?? {};

  item.queueStatus = QUEUE_STATUSES.includes(incoming.queueStatus) ? incoming.queueStatus : item.queueStatus;
  item.priorityBand = PRIORITY_BANDS.includes(incoming.priorityBand) ? incoming.priorityBand : item.priorityBand;
  item.assignedTo = cleanText(incoming.assignedTo ?? item.assignedTo);
  item.operatorDecision = cleanText(incoming.operatorDecision ?? item.operatorDecision);
  item.operatorNotes = cleanText(incoming.operatorNotes ?? item.operatorNotes);
  item.updatedAt = new Date().toISOString();

  queue.generatedAt = new Date().toISOString();
  queue.summary = summarize(items);

  writeJson(outputPath(), queue);
  return NextResponse.json({ status: "SAVED", item, summary: queue.summary, queue });
}