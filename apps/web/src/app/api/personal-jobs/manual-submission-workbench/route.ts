import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXECUTION_STATUSES = [
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

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/manual-submission-workbench.local.json");
}

function syncWorkbench(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-manual-submission-workbench.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ23 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ23 sync failed.", status: 500 };
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

function summarize(records: any[]) {
  const byExecutionStatus: Record<string, number> = {};
  const byOutcomeStatus: Record<string, number> = {};

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

export async function GET() {
  const synced = syncWorkbench();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncWorkbench();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const workbench = synced.output as any;
  const records = Array.isArray(workbench.records) ? workbench.records : [];
  const record = records.find((item: any) =>
    item.workbenchId === body.workbenchId ||
    item.ledgerId === body.ledgerId ||
    item.packId === body.packId
  );

  if (!record) {
    return NextResponse.json({ status: "FAILED", error: "Workbench record not found." }, { status: 404 });
  }

  const incoming = body.execution ?? {};
  const executionStatus = EXECUTION_STATUSES.includes(incoming.executionStatus)
    ? incoming.executionStatus
    : record.execution.executionStatus;

  const outcomeStatus = OUTCOME_STATUSES.includes(incoming.outcomeStatus)
    ? incoming.outcomeStatus
    : record.execution.outcomeStatus;

  record.execution = {
    executionStatus,
    applicationMethod: cleanText(incoming.applicationMethod),
    startedAt: cleanText(incoming.startedAt),
    submittedAt: cleanText(incoming.submittedAt),
    proofType: cleanText(incoming.proofType),
    proofReference: cleanText(incoming.proofReference),
    proofNotes: cleanText(incoming.proofNotes),
    followUpDate: cleanText(incoming.followUpDate),
    outcomeStatus,
    outcomeNotes: cleanText(incoming.outcomeNotes),
    executorNotes: cleanText(incoming.executorNotes)
  };

  if (Array.isArray(body.checklist)) {
    record.checklist = body.checklist.map((item: any) => ({
      key: cleanText(item.key),
      label: cleanText(item.label),
      required: cleanBool(item.required),
      completed: cleanBool(item.completed),
      note: cleanText(item.note)
    }));
  }

  const requiredComplete = Array.isArray(record.checklist)
    ? record.checklist.filter((item: any) => item.required).every((item: any) => item.completed)
    : false;

  const proofCaptured = Boolean(record.execution.proofType || record.execution.proofReference || record.execution.proofNotes || record.execution.executionStatus === "SUBMITTED_PROOF_CAPTURED");

  record.readiness = {
    ...record.readiness,
    requiredChecklistComplete: requiredComplete,
    proofCaptured
  };

  record.updatedAt = new Date().toISOString();
  workbench.generatedAt = new Date().toISOString();
  workbench.summary = summarize(records);

  writeJson(outputPath(), workbench);
  return NextResponse.json({ status: "SAVED", record, summary: workbench.summary, workbench });
}