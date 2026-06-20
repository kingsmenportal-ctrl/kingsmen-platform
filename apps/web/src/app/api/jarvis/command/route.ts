import { NextRequest, NextResponse } from "next/server";

import {
  createKingsmenWebCommandEnvelope,
  postKingsmenCommand
} from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommandRegistryEntry = {
  title: string;
  category: string;
  risk: "SAFE_READ";
  backendAction: string;
};

type BackendCommandResponse = {
  ok?: boolean;
  status?: string;
  commandId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  storageMode?: string;
  generatedAtIso?: string;
  policy?: unknown;
};

const registry = {
  SYSTEM_VALIDATE_N20: {
    title: "Validate N20 system lock",
    category: "System",
    risk: "SAFE_READ",
    backendAction: "system_validate_n20"
  },
  DB_LEDGER_CHECK: {
    title: "Check migration ledger",
    category: "Database",
    risk: "SAFE_READ",
    backendAction: "db_ledger_check"
  },
  QUEUE_HEALTH_CHECK: {
    title: "Check queue health",
    category: "Operations",
    risk: "SAFE_READ",
    backendAction: "queue_health_check"
  },
  INCIDENT_REVIEW: {
    title: "Review incidents",
    category: "Operations",
    risk: "SAFE_READ",
    backendAction: "incident_review"
  },
  MANUAL_FALLBACK_REVIEW: {
    title: "Manual fallback review",
    category: "Operations",
    risk: "SAFE_READ",
    backendAction: "manual_fallback_review"
  },
  FOUNDER_OVERRIDE_REVIEW: {
    title: "Founder override review",
    category: "Governance",
    risk: "SAFE_READ",
    backendAction: "founder_override_review"
  },
  PUBLIC_ROUTE_HOUSE_CHECK: {
    title: "Public route house check",
    category: "Web",
    risk: "SAFE_READ",
    backendAction: "public_route_house_check"
  },
  CANDIDATE_PORTAL_CHECK: {
    title: "Candidate portal check",
    category: "Web",
    risk: "SAFE_READ",
    backendAction: "candidate_portal_check"
  },
  OPENCLAW_GRIP_CHECK: {
    title: "OpenClaw grip check",
    category: "OpenClaw",
    risk: "SAFE_READ",
    backendAction: "openclaw_grip_check"
  },
  COMMAND_PERSISTENCE_PROOF: {
    title: "Truth Vault command evidence",
    category: "Evidence",
    risk: "SAFE_READ",
    backendAction: "jarvis_command_persistence_proof"
  },
  AI_PROVIDER_ROUTER_CHECK: {
    title: "AI provider router check",
    category: "AI",
    risk: "SAFE_READ",
    backendAction: "ai_provider_router_check"
  },
  TOOLS_APPS_AGENTS_INDEX: {
    title: "Tools, apps, agents index",
    category: "Technology",
    risk: "SAFE_READ",
    backendAction: "tools_apps_agents_index"
  },
  AI_TOOLS_RUNTIME_READINESS: {
    title: "AI tools runtime readiness",
    category: "Technology",
    risk: "SAFE_READ",
    backendAction: "ai_tools_runtime_readiness"
  },
  PAYFAST_STAGING_EVIDENCE: {
    title: "PayFast staging evidence",
    category: "Payments",
    risk: "SAFE_READ",
    backendAction: "payfast_staging_evidence"
  },
  EVIDENCE_BUNDLE_REVIEW: {
    title: "Final evidence bundle review",
    category: "Evidence",
    risk: "SAFE_READ",
    backendAction: "evidence_bundle_review"
  }
} satisfies Record<string, CommandRegistryEntry>;

function normalizeCommandId(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase() : "";
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  const body = await request.json().catch(() => ({}));
  const commandId = normalizeCommandId((body as Record<string, unknown>).commandId);
  const command = registry[commandId as keyof typeof registry];

  if (!command) {
    return NextResponse.json(
      {
        ok: false,
        commandId,
        title: "Blocked command",
        category: "Policy",
        risk: "BLOCKED",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        stdout: "",
        stderr: "Jarvis blocked an unknown or unsafe command. Only whitelisted SAFE_READ command envelopes are allowed.",
        evidencePath: null,
        message: "Command blocked by web policy boundary before backend submission.",
        localShellExecuted: false,
        localFileWritten: false
      },
      { status: 400 }
    );
  }

  const envelope = createKingsmenWebCommandEnvelope({
    commandType: "system.health.requested",
    commandIdPrefix: "jarvis_web_command",
    idempotencyKeyPrefix: "jarvis_web_command",
    idempotencyInput: {
      commandId,
      backendAction: command.backendAction,
      requestedBy: "founder_command_surface",
      clientRequestId: (body as Record<string, unknown>).clientRequestId
    },
    correlationId: request.headers.get("x-correlation-id") ?? undefined,
    actor: {
      type: "founder",
      id: "founder_command_surface",
      displayName: "Kingsmen Founder Command Surface"
    },
    source: "jarvis",
    payload: {
      requestedCommandId: commandId,
      backendAction: command.backendAction,
      category: command.category,
      risk: command.risk,
      requestedAtIso: startedAt.toISOString(),
      webBoundary: "backend_api_only",
      truthVaultEvidenceExpected: true,
      commandLogTable: "command_log",
      auditEventExpected: "command.accepted",
      localShellExecuted: false,
      localFileWritten: false,
      directDatabaseAccessFromWeb: false
    }
  });

  const backend = await postKingsmenCommand<typeof envelope.payload, BackendCommandResponse>(envelope);
  const finishedAt = new Date();
  const ok = backend.ok && (backend.status === 202 || backend.status === 200) && backend.data?.ok !== false;

  return NextResponse.json(
    {
      ok,
      commandId,
      backendCommandId: backend.data?.commandId ?? envelope.commandId,
      correlationId: backend.data?.correlationId ?? envelope.correlationId,
      idempotencyKey: backend.data?.idempotencyKey ?? envelope.idempotencyKey,
      title: command.title,
      category: command.category,
      risk: command.risk,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      stdout: ok
        ? "Jarvis command envelope accepted by backend API boundary. The web route did not execute local commands. PostgreSQL Truth Vault evidence is expected when storageMode is postgres_truth_vault."
        : "",
      stderr: ok ? "" : backend.error ?? "Backend API boundary did not accept the command envelope.",
      backendStatus: backend.status,
      backendStorageMode: backend.data?.storageMode ?? null,
      backendPolicy: backend.data?.policy ?? null,
      backendBoundary: backend.boundary,
      evidencePath: null,
      truthVaultEvidenceExpected: true,
      localShellExecuted: false,
      localFileWritten: false,
      directDatabaseAccessFromWeb: false,
      message: ok
        ? "Jarvis command was handed to the backend command boundary. In postgres_truth_vault mode, the backend records command_log plus audit_events evidence."
        : "Jarvis command was not accepted by the backend boundary. Configure or repair KINGSMEN_BACKEND_BASE_URL."
    },
    { status: ok ? 202 : 502 }
  );
}
