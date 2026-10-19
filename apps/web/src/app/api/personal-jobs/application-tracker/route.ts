import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NOTE_LENGTH = 2000;

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
    return { ok: false, error: "Application tracker service is not available.", status: 503 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.error || run.status !== 0) {
    // Do not send process output to clients: scripts can include paths or other internal details.
    return { ok: false, error: "Application tracker sync failed. Please retry or contact support.", status: 503 };
  }

  try {
    const output = JSON.parse(fs.readFileSync(outputPath(), "utf8"));
    return { ok: true, output };
  } catch {
    return { ok: false, error: "Application tracker data could not be read.", status: 503 };
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\\n`, "utf8");
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const synced = syncTracker();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json({
    ...synced.output,
    persistence: { mode: "local-file", durable: false, note: "This runtime's local file is not a durable cross-deployment store." }
  });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ status: "FAILED", error: "Content-Type must be application/json." }, { status: 415 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "FAILED", error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ status: "FAILED", error: "Request body must be a JSON object." }, { status: 400 });
  }

  const note = cleanText(body.candidateControls?.candidateQuestion);
  if (note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({
      status: "FAILED",
      error: `Candidate note must be ${MAX_NOTE_LENGTH} characters or fewer.`
    }, { status: 413 });
  }

  const identifiers = [body.trackerId, body.workbenchId, body.packId]
    .filter((value) => typeof value === "string" && value.trim().length > 0);
  if (identifiers.length === 0) {
    return NextResponse.json({ status: "FAILED", error: "A tracker, workbench, or pack identifier is required." }, { status: 400 });
  }

  const synced = syncTracker();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  const tracker = synced.output as any;
  const items = Array.isArray(tracker.items) ? tracker.items : [];
  const item = items.find((x: any) =>
    (typeof body.trackerId === "string" && x.trackerId === body.trackerId) ||
    (typeof body.workbenchId === "string" && x.workbenchId === body.workbenchId) ||
    (typeof body.packId === "string" && x.packId === body.packId)
  );

  if (!item) {
    return NextResponse.json({ status: "FAILED", error: "Tracker item not found." }, { status: 404 });
  }

  const hasAcknowledgement = typeof body.candidateControls?.candidateAcknowledged === "boolean";
  const hasQuestion = typeof body.candidateControls?.candidateQuestion === "string";
  if (!body.candidateControls || typeof body.candidateControls !== "object" || Array.isArray(body.candidateControls) ||
      (!hasAcknowledgement && !hasQuestion)) {
    return NextResponse.json({ status: "FAILED", error: "Provide candidateAcknowledged as a boolean or candidateQuestion as text." }, { status: 400 });
  }

  const now = new Date().toISOString();
  item.candidateControls = {
    candidateAcknowledged: hasAcknowledgement
      ? body.candidateControls.candidateAcknowledged
      : Boolean(item.candidateControls?.candidateAcknowledged),
    candidateQuestion: hasQuestion ? note : cleanText(item.candidateControls?.candidateQuestion),
    lastCandidateNoteAt: hasQuestion && note
      ? now
      : cleanText(item.candidateControls?.lastCandidateNoteAt)
  };

  item.updatedAt = now;
  tracker.generatedAt = now;

  try {
    writeJson(outputPath(), tracker);
  } catch {
    return NextResponse.json({
      status: "FAILED",
      error: "Tracker changes could not be written by this runtime.",
      persistence: { mode: "local-file", durable: false }
    }, { status: 503 });
  }

  return NextResponse.json({
    status: "SAVED",
    item,
    tracker,
    persistence: {
      mode: "local-file",
      durable: false,
      note: "Saved to this runtime's local file only. Configure durable database storage before relying on cross-instance or post-deploy persistence."
    }
  });
}
