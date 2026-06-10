import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKLIST_STATUSES = [
  "QUEUED",
  "TODAY",
  "IN_PROGRESS",
  "WAITING_PROOF",
  "WAITING_CANDIDATE",
  "WAITING_FOUNDER",
  "DONE",
  "CLOSED"
];

const WORK_SLOTS = [
  "MORNING_REVIEW",
  "MIDDAY_EXECUTION",
  "AFTERNOON_PROOF",
  "END_OF_DAY_DIGEST",
  "WAITING"
];

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/daily-worklist.local.json");
}

function syncWorklist(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-daily-worklist.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ28 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ28 sync failed.", status: 500 };
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
  const byWorklistStatus: Record<string, number> = {};
  const byWorkSlot: Record<string, number> = {};
  const byPriorityBand: Record<string, number> = {};

  for (const item of items) {
    byWorklistStatus[item.worklistStatus] = (byWorklistStatus[item.worklistStatus] || 0) + 1;
    byWorkSlot[item.workSlot] = (byWorkSlot[item.workSlot] || 0) + 1;
    byPriorityBand[item.priorityBand] = (byPriorityBand[item.priorityBand] || 0) + 1;
  }

  return {
    totalItems: items.length,
    today: items.filter((x) => x.worklistStatus === "TODAY").length,
    inProgress: items.filter((x) => x.worklistStatus === "IN_PROGRESS").length,
    waitingProof: items.filter((x) => x.worklistStatus === "WAITING_PROOF").length,
    waitingCandidate: items.filter((x) => x.worklistStatus === "WAITING_CANDIDATE").length,
    waitingFounder: items.filter((x) => x.worklistStatus === "WAITING_FOUNDER").length,
    done: items.filter((x) => x.worklistStatus === "DONE").length,
    closed: items.filter((x) => x.worklistStatus === "CLOSED").length,
    founderAttentionRequired: items.filter((x) => x.founderAttentionRequired).length,
    candidateHarmRisk: items.filter((x) => x.candidateHarmRisk).length,
    estimatedMinutes: items.filter((x) => !["DONE", "CLOSED"].includes(x.worklistStatus)).reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0),
    byWorklistStatus,
    byWorkSlot,
    byPriorityBand
  };
}

export async function GET() {
  const synced = syncWorklist();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncWorklist();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const worklist = synced.output as any;
  const items = Array.isArray(worklist.worklistItems) ? worklist.worklistItems : [];
  const item = items.find((x: any) =>
    x.worklistId === body.worklistId ||
    x.queueId === body.queueId ||
    x.packId === body.packId
  );

  if (!item) {
    return NextResponse.json({ status: "FAILED", error: "Daily worklist item not found." }, { status: 404 });
  }

  const incoming = body.item ?? {};
  const operatorProgress = incoming.operatorProgress ?? {};
  const founderDecision = incoming.founderDecision ?? {};

  item.worklistStatus = WORKLIST_STATUSES.includes(incoming.worklistStatus) ? incoming.worklistStatus : item.worklistStatus;
  item.workSlot = WORK_SLOTS.includes(incoming.workSlot) ? incoming.workSlot : item.workSlot;
  item.assignedTo = cleanText(incoming.assignedTo ?? item.assignedTo);

  item.operatorProgress = {
    startedAt: cleanText(operatorProgress.startedAt ?? item.operatorProgress?.startedAt),
    completedAt: cleanText(operatorProgress.completedAt ?? item.operatorProgress?.completedAt),
    proofReference: cleanText(operatorProgress.proofReference ?? item.operatorProgress?.proofReference),
    blockerNote: cleanText(operatorProgress.blockerNote ?? item.operatorProgress?.blockerNote),
    completionNote: cleanText(operatorProgress.completionNote ?? item.operatorProgress?.completionNote)
  };

  item.founderDecision = {
    decision: cleanText(founderDecision.decision ?? item.founderDecision?.decision),
    decidedBy: cleanText(founderDecision.decidedBy ?? item.founderDecision?.decidedBy),
    decidedAt: cleanText(founderDecision.decidedAt ?? item.founderDecision?.decidedAt),
    decisionNote: cleanText(founderDecision.decisionNote ?? item.founderDecision?.decisionNote)
  };

  item.updatedAt = new Date().toISOString();
  worklist.generatedAt = new Date().toISOString();
  worklist.summary = summarize(items);

  writeJson(outputPath(), worklist);
  return NextResponse.json({ status: "SAVED", item, summary: worklist.summary, worklist });
}