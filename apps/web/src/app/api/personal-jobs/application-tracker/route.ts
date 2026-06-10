import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/application-tracker.local.json");
}

function syncTracker(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-application-tracker.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ24 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ24 sync failed.", status: 500 };
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

export async function GET() {
  const synced = syncTracker();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncTracker();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const tracker = synced.output as any;
  const items = Array.isArray(tracker.items) ? tracker.items : [];
  const item = items.find((x: any) =>
    x.trackerId === body.trackerId ||
    x.workbenchId === body.workbenchId ||
    x.packId === body.packId
  );

  if (!item) {
    return NextResponse.json({ status: "FAILED", error: "Tracker item not found." }, { status: 404 });
  }

  item.candidateControls = {
    candidateAcknowledged: cleanBool(body.candidateControls?.candidateAcknowledged),
    candidateQuestion: cleanText(body.candidateControls?.candidateQuestion),
    lastCandidateNoteAt: cleanText(body.candidateControls?.candidateQuestion) ? new Date().toISOString() : cleanText(item.candidateControls?.lastCandidateNoteAt)
  };

  item.updatedAt = new Date().toISOString();
  tracker.generatedAt = new Date().toISOString();

  writeJson(outputPath(), tracker);
  return NextResponse.json({ status: "SAVED", item, tracker });
}