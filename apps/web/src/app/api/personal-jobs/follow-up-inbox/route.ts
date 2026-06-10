import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THREAD_STATUSES = [
  "NO_QUESTION",
  "CANDIDATE_QUESTION_PENDING",
  "OPERATOR_RESPONSE_DRAFTED",
  "RESPONSE_APPROVED_FOR_MANUAL_SEND",
  "RESPONSE_MARKED_SENT_WITH_PROOF",
  "CLOSED"
];

const QUESTION_CATEGORIES = [
  "STATUS_QUESTION",
  "PROOF_REQUEST",
  "DEADLINE_QUESTION",
  "DOCUMENT_QUESTION",
  "OUTCOME_QUESTION",
  "GENERAL"
];

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/follow-up-inbox.local.json");
}

function syncInbox(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-follow-up-inbox.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ25 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ25 sync failed.", status: 500 };
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

function summarize(threads: any[]) {
  const byThreadStatus: Record<string, number> = {};
  const byQuestionCategory: Record<string, number> = {};

  for (const thread of threads) {
    byThreadStatus[thread.threadStatus] = (byThreadStatus[thread.threadStatus] || 0) + 1;
    byQuestionCategory[thread.questionCategory] = (byQuestionCategory[thread.questionCategory] || 0) + 1;
  }

  return {
    totalThreads: threads.length,
    candidateQuestionsPending: threads.filter((x) => x.threadStatus === "CANDIDATE_QUESTION_PENDING").length,
    operatorDrafted: threads.filter((x) => x.threadStatus === "OPERATOR_RESPONSE_DRAFTED").length,
    approvedForManualSend: threads.filter((x) => x.threadStatus === "RESPONSE_APPROVED_FOR_MANUAL_SEND").length,
    markedSentWithProof: threads.filter((x) => x.threadStatus === "RESPONSE_MARKED_SENT_WITH_PROOF").length,
    noQuestion: threads.filter((x) => x.threadStatus === "NO_QUESTION").length,
    closed: threads.filter((x) => x.threadStatus === "CLOSED").length,
    byThreadStatus,
    byQuestionCategory
  };
}

export async function GET() {
  const synced = syncInbox();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncInbox();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const inbox = synced.output as any;
  const threads = Array.isArray(inbox.threads) ? inbox.threads : [];
  const thread = threads.find((x: any) =>
    x.threadId === body.threadId ||
    x.trackerId === body.trackerId ||
    x.packId === body.packId
  );

  if (!thread) {
    return NextResponse.json({ status: "FAILED", error: "Follow-up thread not found." }, { status: 404 });
  }

  const incoming = body.thread ?? {};
  const operator = incoming.operator ?? {};

  thread.threadStatus = THREAD_STATUSES.includes(incoming.threadStatus)
    ? incoming.threadStatus
    : thread.threadStatus;

  thread.questionCategory = QUESTION_CATEGORIES.includes(incoming.questionCategory)
    ? incoming.questionCategory
    : thread.questionCategory;

  thread.operator = {
    operatorResponseDraft: cleanText(operator.operatorResponseDraft ?? thread.operator?.operatorResponseDraft),
    operatorResponseFinal: cleanText(operator.operatorResponseFinal ?? thread.operator?.operatorResponseFinal),
    approvedForManualSend: cleanBool(operator.approvedForManualSend),
    manualSendChannel: cleanText(operator.manualSendChannel),
    manualSentAt: cleanText(operator.manualSentAt),
    manualSendProof: cleanText(operator.manualSendProof),
    internalNotes: cleanText(operator.internalNotes)
  };

  thread.updatedAt = new Date().toISOString();
  inbox.generatedAt = new Date().toISOString();
  inbox.summary = summarize(threads);

  writeJson(outputPath(), inbox);
  return NextResponse.json({ status: "SAVED", thread, summary: inbox.summary, inbox });
}