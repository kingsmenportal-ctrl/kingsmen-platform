import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECORD_STATUSES = [
  "NOT_READY",
  "READY_TO_RECORD",
  "RECORDED_IN_AUDIT_MIRROR",
  "REJECTED",
  "BLOCKED",
  "CLOSED"
];

const TARGET_STATUSES = [
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
  return path.join(repoRoot(), "data/personal-job-desk/status-advancement-audit.local.json");
}

function syncAdvancement(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-status-advancement.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ30 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ30 sync failed.", status: 500 };
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
  const byRecordStatus: Record<string, number> = {};
  const byTargetStatus: Record<string, number> = {};
  const byPriorityBand: Record<string, number> = {};

  for (const record of records) {
    byRecordStatus[record.recordStatus] = (byRecordStatus[record.recordStatus] || 0) + 1;
    byTargetStatus[record.targetStatus] = (byTargetStatus[record.targetStatus] || 0) + 1;
    byPriorityBand[record.sourcePriorityBand] = (byPriorityBand[record.sourcePriorityBand] || 0) + 1;
  }

  return {
    totalRecords: records.length,
    notReady: records.filter((x) => x.recordStatus === "NOT_READY").length,
    readyToRecord: records.filter((x) => x.recordStatus === "READY_TO_RECORD").length,
    recordedInAuditMirror: records.filter((x) => x.recordStatus === "RECORDED_IN_AUDIT_MIRROR").length,
    rejected: records.filter((x) => x.recordStatus === "REJECTED").length,
    blocked: records.filter((x) => x.recordStatus === "BLOCKED").length,
    closed: records.filter((x) => x.recordStatus === "CLOSED").length,
    canRecordAuditMirror: records.filter((x) => x.controls?.canRecordAuditMirror).length,
    proofBacked: records.filter((x) => Boolean(x.proofReference)).length,
    approved: records.filter((x) => x.advanceApproved).length,
    byRecordStatus,
    byTargetStatus,
    byPriorityBand
  };
}

export async function GET() {
  const synced = syncAdvancement();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncAdvancement();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const audit = synced.output as any;
  const records = Array.isArray(audit.advancementRecords) ? audit.advancementRecords : [];
  const record = records.find((x: any) =>
    x.advancementId === body.advancementId ||
    x.reviewId === body.reviewId ||
    x.packId === body.packId
  );

  if (!record) {
    return NextResponse.json({ status: "FAILED", error: "Status advancement record not found." }, { status: 404 });
  }

  const incoming = body.record ?? {};
  const mirror = incoming.auditMirror ?? {};
  const candidateFacing = incoming.candidateFacing ?? {};

  record.recordStatus = RECORD_STATUSES.includes(incoming.recordStatus) ? incoming.recordStatus : record.recordStatus;
  record.targetStatus = TARGET_STATUSES.includes(incoming.targetStatus) ? incoming.targetStatus : record.targetStatus;
  record.advanceApproved = cleanBool(incoming.advanceApproved ?? record.advanceApproved);
  record.proofReference = cleanText(incoming.proofReference ?? record.proofReference);

  record.auditMirror = {
    recordedInAuditMirror: cleanBool(mirror.recordedInAuditMirror ?? record.auditMirror?.recordedInAuditMirror),
    recordedAt: cleanText(mirror.recordedAt ?? record.auditMirror?.recordedAt),
    recordedBy: cleanText(mirror.recordedBy ?? record.auditMirror?.recordedBy),
    auditReference: cleanText(mirror.auditReference ?? record.auditMirror?.auditReference),
    auditNote: cleanText(mirror.auditNote ?? record.auditMirror?.auditNote)
  };

  record.candidateFacing = {
    candidateMessageDraft: cleanText(candidateFacing.candidateMessageDraft ?? record.candidateFacing?.candidateMessageDraft),
    candidateMessageApproved: cleanBool(candidateFacing.candidateMessageApproved ?? record.candidateFacing?.candidateMessageApproved),
    candidateMessageSentManually: cleanBool(candidateFacing.candidateMessageSentManually ?? record.candidateFacing?.candidateMessageSentManually),
    manualSendProof: cleanText(candidateFacing.manualSendProof ?? record.candidateFacing?.manualSendProof)
  };

  record.controls = {
    ...record.controls,
    canRecordAuditMirror: Boolean(record.proofReference && record.advanceApproved && record.targetStatus && record.targetStatus !== "NONE"),
    canMarkRecorded: Boolean(record.proofReference && record.advanceApproved && record.targetStatus && record.targetStatus !== "NONE")
  };

  record.updatedAt = new Date().toISOString();
  audit.generatedAt = new Date().toISOString();
  audit.summary = summarize(records);

  writeJson(outputPath(), audit);
  return NextResponse.json({ status: "SAVED", record, summary: audit.summary, audit });
}