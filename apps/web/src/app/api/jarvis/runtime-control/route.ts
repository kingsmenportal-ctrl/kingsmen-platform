import { NextRequest, NextResponse } from "next/server";

import type {
  JarvisChannel,
  JarvisCommandEnvelope,
  JarvisMode,
  JarvisAuthorityLevel,
  JarvisActorRef
} from "@kingsmen/contracts/jarvis";
import {
  jarvisControlCommand,
  jarvisRuntimeDecisionToHttpStatus,
  type JarvisLaunchEvidenceState
} from "@kingsmen/jarvis-core/jarvis-runtime-controller";
import {
  createKingsmenWebCommandEnvelope,
  postKingsmenCommand
} from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeRequestBody = {
  command?: Partial<JarvisCommandEnvelope>;
  toolRef?: string;
  launchEvidence?: JarvisLaunchEvidenceState;
  founderApprovalRef?: string;
  dryRun?: boolean;
};

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function safeArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function safeChannel(value: unknown): JarvisChannel {
  const allowed: readonly JarvisChannel[] = [
    "hud",
    "voice",
    "github",
    "email",
    "whatsapp_urgent",
    "n8n",
    "airtable",
    "supabase",
    "local_terminal",
    "browser_scout",
    "system"
  ];
  return allowed.includes(value as JarvisChannel) ? (value as JarvisChannel) : "hud";
}

function safeMode(value: unknown): JarvisMode {
  const allowed: readonly JarvisMode[] = [
    "safe_chat_mode",
    "controlled_command_mode",
    "builder_mode",
    "research_mode",
    "connector_dry_run_mode",
    "diagnostic_repair_mode",
    "production_approval_mode"
  ];
  return allowed.includes(value as JarvisMode) ? (value as JarvisMode) : "controlled_command_mode";
}

function safeAuthority(value: unknown): JarvisAuthorityLevel {
  const allowed: readonly JarvisAuthorityLevel[] = [
    "LEVEL_1_READ_ONLY",
    "LEVEL_2_GENERATE_FILES",
    "LEVEL_3_TEST_VALIDATE",
    "LEVEL_4_STAGING_DEPLOY",
    "LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED"
  ];
  return allowed.includes(value as JarvisAuthorityLevel) ? (value as JarvisAuthorityLevel) : "LEVEL_3_TEST_VALIDATE";
}

function safeActor(value: unknown): JarvisActorRef {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const actorType = input.actorType === "operator" || input.actorType === "system" || input.actorType === "validator" || input.actorType === "worker" ? input.actorType : "founder";
  return {
    actorType,
    actorRef: safeString(input.actorRef, "jarvis_runtime_surface")
  };
}

function normalizeCommandEnvelope(body: RuntimeRequestBody, request: NextRequest): JarvisCommandEnvelope {
  const command = body.command ?? {};
  const now = Date.now().toString(36);
  const requestId = safeString(command.requestId, `jarvis_req_${now}`);
  const correlationId = safeString(command.correlationId, request.headers.get("x-correlation-id") ?? `jarvis_corr_${now}`);
  const founderApprovalRef = safeString(body.founderApprovalRef ?? command.founderApprovalRef, "");

  return {
    commandRef: safeString(command.commandRef, `jarvis_cmd_${now}`),
    tenantRef: safeString(command.tenantRef, "kingsmen_default_tenant"),
    correlationId,
    requestId,
    channel: safeChannel(command.channel),
    mode: safeMode(command.mode),
    actor: safeActor(command.actor),
    commandTextSafe: safeString(command.commandTextSafe, "Jarvis runtime command."),
    intendedAction: safeString(command.intendedAction, "runtime_control"),
    targetRefs: safeArray(command.targetRefs),
    requestedAuthorityLevel: safeAuthority(command.requestedAuthorityLevel),
    evidenceRefs: safeArray(command.evidenceRefs),
    founderApprovalRef: founderApprovalRef || undefined
  };
}

function summarizeLedgerForResponse(result: ReturnType<typeof jarvisControlCommand>) {
  return result.ledger.events.map((event) => ({
    eventRef: event.eventRef,
    commandRef: event.commandRef,
    correlationId: event.correlationId,
    eventType: event.eventType,
    safeSummary: event.safeSummary,
    createdAtIso: event.createdAtIso
  }));
}

async function recordRuntimeLedger(result: ReturnType<typeof jarvisControlCommand>) {
  const ledger = summarizeLedgerForResponse(result);
  const command = createKingsmenWebCommandEnvelope({
    commandType: "system.health.requested",
    commandIdPrefix: "jarvis_runtime_ledger",
    idempotencyKeyPrefix: "jarvis_runtime_ledger",
    idempotencyInput: {
      commandRef: result.command.commandRef,
      finalDecision: result.finalDecision,
      reasonCode: result.reasonCode,
      ledgerRefs: ledger.map((event) => event.eventRef)
    },
    correlationId: result.command.correlationId,
    actor: {
      type: "system",
      id: "jarvis_runtime_controller",
      displayName: "Jarvis Runtime Controller"
    },
    source: "jarvis",
    payload: {
      jarvisRuntimeLedger: true,
      commandRef: result.command.commandRef,
      requestId: result.command.requestId,
      finalDecision: result.finalDecision,
      reasonCode: result.reasonCode,
      safeReason: result.safeReason,
      approvalRequired: result.approvalRequired,
      evidenceRequired: result.evidenceRequired,
      executable: result.executable,
      nextStep: result.nextStep,
      launchGateChecked: result.launchGateChecked,
      launchGateOpen: result.launchGateOpen,
      blockedBy: result.blockedBy,
      ledger,
      localShellExecuted: false,
      localFileWritten: false,
      directDatabaseAccessFromWeb: false
    }
  });

  const backend = await postKingsmenCommand(command);
  return {
    attempted: true,
    accepted: backend.ok,
    status: backend.status,
    commandId: backend.data && typeof backend.data === "object" && "commandId" in backend.data ? String((backend.data as { commandId?: unknown }).commandId ?? command.commandId) : command.commandId,
    storageMode: backend.data && typeof backend.data === "object" && "storageMode" in backend.data ? String((backend.data as { storageMode?: unknown }).storageMode ?? "unknown") : null,
    boundary: backend.boundary,
    error: backend.error
  };
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = (await request.json().catch(() => ({}))) as RuntimeRequestBody;
  const command = normalizeCommandEnvelope(body, request);

  const result = jarvisControlCommand({
    command,
    toolRef: typeof body.toolRef === "string" ? body.toolRef : undefined,
    launchEvidence: body.launchEvidence
  });

  const ledger = summarizeLedgerForResponse(result);
  const evidenceWrite = body.dryRun === false ? await recordRuntimeLedger(result) : {
    attempted: false,
    accepted: false,
    status: 0,
    commandId: null,
    storageMode: null,
    boundary: null,
    error: "dry_run_enabled"
  };
  const status = jarvisRuntimeDecisionToHttpStatus(result);
  const finishedAt = new Date();

  return NextResponse.json(
    {
      ok: result.executable,
      commandRef: result.command.commandRef,
      correlationId: result.command.correlationId,
      requestId: result.command.requestId,
      finalDecision: result.finalDecision,
      policyDecision: result.policyDecision.decision,
      risk: result.risk,
      reasonCode: result.reasonCode,
      safeReason: result.safeReason,
      approvalRequired: result.approvalRequired,
      evidenceRequired: result.evidenceRequired,
      executable: result.executable,
      nextStep: result.nextStep,
      launchGateChecked: result.launchGateChecked,
      launchGateOpen: result.launchGateOpen,
      blockedBy: result.blockedBy,
      toolRef: result.tool?.toolRef ?? null,
      ledger,
      evidenceWrite,
      localShellExecuted: false,
      localFileWritten: false,
      directDatabaseAccessFromWeb: false,
      dryRun: body.dryRun !== false,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime()
    },
    { status }
  );
}
