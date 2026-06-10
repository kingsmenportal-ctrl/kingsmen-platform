import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_STATUSES = [
  "NO_RESPONSE_NEEDED",
  "DRAFT_AVAILABLE",
  "FINAL_READY_FOR_APPROVAL",
  "APPROVED_FOR_MANUAL_SEND",
  "MANUAL_SEND_PROOF_CAPTURED",
  "CLOSED"
];

function repoRoot() {
  const cwd = process.cwd();
  if (cwd.replace(/\\/g, "/").endsWith("apps/web")) return path.resolve(cwd, "../..");
  return cwd;
}

function outputPath() {
  return path.join(repoRoot(), "data/personal-job-desk/response-library.local.json");
}

function syncLibrary(): { ok: true; output: any } | { ok: false; error: string; status: number } {
  const root = repoRoot();
  const script = path.join(root, "scripts/agents/personal-job-response-library.mjs");

  if (!fs.existsSync(script)) {
    return { ok: false, error: "PJ26 agent missing.", status: 500 };
  }

  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 1024 * 1024 * 30
  });

  if (run.status !== 0) {
    return { ok: false, error: run.stderr || run.stdout || "PJ26 sync failed.", status: 500 };
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

function summarize(workflows: any[], templates: any[]) {
  const byResponseStatus: Record<string, number> = {};
  const byQuestionCategory: Record<string, number> = {};

  for (const workflow of workflows) {
    byResponseStatus[workflow.responseStatus] = (byResponseStatus[workflow.responseStatus] || 0) + 1;
    byQuestionCategory[workflow.questionCategory] = (byQuestionCategory[workflow.questionCategory] || 0) + 1;
  }

  return {
    totalWorkflows: workflows.length,
    templateCount: templates.length,
    noResponseNeeded: workflows.filter((x) => x.responseStatus === "NO_RESPONSE_NEEDED").length,
    draftAvailable: workflows.filter((x) => x.responseStatus === "DRAFT_AVAILABLE").length,
    finalReadyForApproval: workflows.filter((x) => x.responseStatus === "FINAL_READY_FOR_APPROVAL").length,
    approvedForManualSend: workflows.filter((x) => x.responseStatus === "APPROVED_FOR_MANUAL_SEND").length,
    manualSendProofCaptured: workflows.filter((x) => x.responseStatus === "MANUAL_SEND_PROOF_CAPTURED").length,
    closed: workflows.filter((x) => x.responseStatus === "CLOSED").length,
    byResponseStatus,
    byQuestionCategory
  };
}

export async function GET() {
  const synced = syncLibrary();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  return NextResponse.json(synced.output);
}

export async function POST(request: Request) {
  const synced = syncLibrary();
  if (!synced.ok) {
    return NextResponse.json({ status: "FAILED", error: synced.error }, { status: synced.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const library = synced.output as any;
  const workflows = Array.isArray(library.responseWorkflows) ? library.responseWorkflows : [];
  const workflow = workflows.find((x: any) =>
    x.workflowId === body.workflowId ||
    x.threadId === body.threadId ||
    x.packId === body.packId
  );

  if (!workflow) {
    return NextResponse.json({ status: "FAILED", error: "Response workflow not found." }, { status: 404 });
  }

  const incoming = body.workflow ?? {};

  workflow.responseStatus = RESPONSE_STATUSES.includes(incoming.responseStatus)
    ? incoming.responseStatus
    : workflow.responseStatus;

  workflow.selectedTemplateKey = cleanText(incoming.selectedTemplateKey ?? workflow.selectedTemplateKey);
  workflow.operatorDraft = cleanText(incoming.operatorDraft ?? workflow.operatorDraft);
  workflow.finalResponse = cleanText(incoming.finalResponse ?? workflow.finalResponse);

  workflow.approval = {
    approvedForManualSend: cleanBool(incoming.approval?.approvedForManualSend),
    approvedBy: cleanText(incoming.approval?.approvedBy),
    approvedAt: cleanText(incoming.approval?.approvedAt)
  };

  workflow.manualSend = {
    channel: cleanText(incoming.manualSend?.channel),
    sentAt: cleanText(incoming.manualSend?.sentAt),
    manualSendProof: cleanText(incoming.manualSend?.manualSendProof),
    sentBy: cleanText(incoming.manualSend?.sentBy),
    proofCaptured: Boolean(cleanText(incoming.manualSend?.manualSendProof))
  };

  workflow.updatedAt = new Date().toISOString();
  library.generatedAt = new Date().toISOString();
  library.summary = summarize(workflows, library.templates || []);

  writeJson(outputPath(), library);
  return NextResponse.json({ status: "SAVED", workflow, summary: library.summary, library });
}