import { NextResponse } from "next/server";

import { getKingsmenApiHealth, getKingsmenBackendBoundary } from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BackendHealth = {
  ok?: boolean;
  service?: string;
  storageMode?: string;
  generatedAtIso?: string;
};

type RuntimeState = "LIVE" | "SOURCE_READY" | "PENDING_RUNTIME_PROOF" | "DEFERRED";

type ReadinessEntry = {
  id: string;
  title: string;
  group: "ai" | "tool" | "app" | "agent" | "infrastructure";
  state: RuntimeState;
  detail: string;
  launchCritical: boolean;
  evidenceRequired: string;
  noFakeData: true;
  rawSecretsReturned: false;
  localShellExecuted: false;
  directDatabaseAccessFromWeb: false;
};

function entry(input: Omit<ReadinessEntry, "noFakeData" | "rawSecretsReturned" | "localShellExecuted" | "directDatabaseAccessFromWeb">): ReadinessEntry {
  return {
    ...input,
    noFakeData: true,
    rawSecretsReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false
  };
}

export async function GET() {
  const boundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendLive = health.ok && health.data?.ok === true;
  const truthVaultLive = backendLive && health.data?.storageMode === "postgres_truth_vault";

  const runtimeGroups = ["AI", "Tools", "Apps", "Agents", "Infrastructure"] as const;

  const entries: ReadinessEntry[] = [
    entry({
      id: "backend-policy-boundary",
      title: "Backend Policy Boundary",
      group: "infrastructure",
      state: backendLive ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: backendLive ? "Backend health is reachable through the configured boundary." : "Backend API must be reachable before Jarvis can prove runtime AI and tool readiness.",
      launchCritical: true,
      evidenceRequired: "backend health response"
    }),
    entry({
      id: "truth-vault-command-evidence",
      title: "Truth Vault Command Evidence",
      group: "infrastructure",
      state: truthVaultLive ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: truthVaultLive ? "Backend reports postgres_truth_vault and command runtime evidence can be persisted." : "PostgreSQL Truth Vault must remain live for Jarvis commands and runtime provider evidence.",
      launchCritical: true,
      evidenceRequired: "command_log, audit_events, and idempotency_keys"
    }),
    entry({
      id: "ai-provider-router",
      title: "AI Provider Router",
      group: "ai",
      state: "PENDING_RUNTIME_PROOF",
      detail: "AI routing must be backend controlled. This route reports runtime readiness only after backend proof, never fake model status.",
      launchCritical: true,
      evidenceRequired: "backend policy-gated live provider call with redacted request and response evidence"
    }),
    entry({
      id: "tool-github",
      title: "GitHub Tool Connector",
      group: "tool",
      state: "PENDING_RUNTIME_PROOF",
      detail: "GitHub integration must prove a redacted metadata read through an approved backend or tool boundary.",
      launchCritical: true,
      evidenceRequired: "redacted repository metadata read"
    }),
    entry({
      id: "tool-n8n",
      title: "n8n Thin Relay",
      group: "tool",
      state: "PENDING_RUNTIME_PROOF",
      detail: "n8n remains a thin relay and must prove relay routing plus outbox evidence before production claims.",
      launchCritical: false,
      evidenceRequired: "redacted n8n relay ping and outbox trace"
    }),
    entry({
      id: "app-airtable",
      title: "Airtable Human Mirror",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Airtable is a mirror only. PostgreSQL remains truth. Mirror readiness requires redacted health evidence.",
      launchCritical: true,
      evidenceRequired: "redacted Airtable health and read mirror evidence"
    }),
    entry({
      id: "app-email",
      title: "Email Primary Channel",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Email is the primary tracked channel. Provider send, receive, bounce, opt-out, and evidence-ledger proof remain required.",
      launchCritical: true,
      evidenceRequired: "send, receive, bounce, opt-out, and evidence-ledger proof"
    }),
    entry({
      id: "app-payfast",
      title: "PayFast Sandbox Provider",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "PayFast remains blocked for live payments until real sandbox checkout and accepted ITN evidence pass.",
      launchCritical: true,
      evidenceRequired: "real sandbox checkout, accepted ITN, duplicate rejection, failed payment rejection, return and cancel review, refund review"
    }),
    entry({
      id: "agent-playwright-scout",
      title: "Playwright Scout",
      group: "agent",
      state: "SOURCE_READY",
      detail: "Playwright is a scout only. CAPTCHA, OTP, portal outage, and selector changes must generate MAP fallback instead of pretending automation succeeded.",
      launchCritical: true,
      evidenceRequired: "portal probe trace plus MAP fallback proof"
    }),
    entry({
      id: "agent-openclaw-operator",
      title: "OpenClaw Operator Boundary",
      group: "agent",
      state: "SOURCE_READY",
      detail: "OpenClaw is operator-only and cannot bypass backend policy, founder approval, vaulting, or evidence ledgers.",
      launchCritical: false,
      evidenceRequired: "operator policy-gate simulation proof"
    }),
    entry({
      id: "agent-whatsapp-urgent-only",
      title: "WhatsApp Urgent Only",
      group: "agent",
      state: "DEFERRED",
      detail: "WhatsApp remains urgent-only and deferred until cost-justified. No bulk messaging.",
      launchCritical: false,
      evidenceRequired: "urgent-only policy proof before provider activation"
    })
  ];

  const summary = {
    total: entries.length,
    live: entries.filter((item) => item.state === "LIVE").length,
    sourceReady: entries.filter((item) => item.state === "SOURCE_READY").length,
    pendingRuntimeProof: entries.filter((item) => item.state === "PENDING_RUNTIME_PROOF").length,
    deferred: entries.filter((item) => item.state === "DEFERRED").length,
    launchCriticalPending: entries.filter((item) => item.launchCritical && item.state !== "LIVE").length
  };

  return NextResponse.json({
    schema: "kingsmen.jarvis-ai-tools-runtime-readiness.v1",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    noFakeData: true,
    rawSecretsReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    directProviderCallsFromWeb: false,
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    runtimeGroups,
    summary,
    entries,
    nextAction: "Run backend-governed provider proofs before marking any AI, tool, app, or agent runtime live."
  });
}
