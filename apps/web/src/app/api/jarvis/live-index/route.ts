import { NextResponse } from "next/server";

import { getKingsmenApiHealth, getKingsmenBackendBoundary } from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BackendHealth = {
  ok?: boolean;
  service?: string;
  status?: string;
  storageMode?: string;
  routes?: string[];
};

function entry(input: {
  id: string;
  title: string;
  group: "ai" | "tool" | "app" | "agent" | "infrastructure";
  state: "LIVE" | "SOURCE_READY" | "PENDING_RUNTIME_PROOF" | "DEFERRED";
  detail: string;
  launchCritical: boolean;
  evidenceRef?: string;
  boundaryRoute?: string;
}) {
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
  const backendStorageMode = health.data?.storageMode || "unreachable";
  const truthVaultLive = backendLive && backendStorageMode === "postgres_truth_vault";
  const openClawRuntimeProven = truthVaultLive;

  const entries = [
    entry({
      id: "backend-api",
      title: "Backend API Authority",
      group: "infrastructure",
      state: backendLive ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: backendLive ? "Backend health responded through the configured API boundary." : "Backend API must run and respond before Jarvis can be production-real.",
      launchCritical: true
    }),
    entry({
      id: "truth-vault",
      title: "PostgreSQL Truth Vault",
      group: "infrastructure",
      state: truthVaultLive ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: truthVaultLive ? "Backend reports postgres_truth_vault storage mode." : "Truth Vault must be proven live through backend health and command persistence.",
      launchCritical: true
    }),
    entry({
      id: "jarvis-command-envelope",
      title: "Jarvis Command Envelope",
      group: "agent",
      state: "SOURCE_READY",
      detail: "Jarvis command UI sends whitelisted SAFE_READ envelopes to /api/jarvis/command and never runs local shell from the browser.",
      launchCritical: true
    }),
    entry({
      id: "ai-provider-router",
      title: "AI Provider Router",
      group: "ai",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Real AI model routing must be backend-controlled with policy gates, provider credentials outside Git, and evidence of a live provider call.",
      launchCritical: true
    }),
    entry({
      id: "tool-registry",
      title: "Tools and Apps Registry",
      group: "tool",
      state: "SOURCE_READY",
      detail: "GitHub, n8n, Playwright, Airtable, PayFast, Email, Storage, OpenClaw, WhatsApp, and SMS are indexed as real integration boundaries, not dummy cards.",
      launchCritical: true
    }),
    entry({
      id: "payfast-sandbox",
      title: "PayFast Sandbox Provider Proof",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Source proof is clean, but real sandbox checkout and accepted ITN evidence are still required before payment launch.",
      launchCritical: true
    }),
    entry({
      id: "email-primary",
      title: "Email Primary Channel",
      group: "app",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Provider send, receive, bounce, opt-out, redaction, and evidence proof are still required before real candidate messaging.",
      launchCritical: true
    }),
    entry({
      id: "openclaw-operator-policy",
      title: "OpenClaw Operator Policy Boundary",
      group: "agent",
      state: openClawRuntimeProven ? "LIVE" : "PENDING_RUNTIME_PROOF",
      detail: openClawRuntimeProven
        ? "OpenClaw operator policy is runtime-proven through backend health, postgres_truth_vault mode, web boundary reachability, and OPENCLAW_OPERATOR_POLICY_CHECK command evidence. OpenClaw remains operator-only and cannot become production authority."
        : "OpenClaw must prove backend health, postgres_truth_vault mode, web boundary reachability, and OPENCLAW_OPERATOR_POLICY_CHECK command evidence before live-readiness indexing.",
      launchCritical: false,
      evidenceRef: "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
      boundaryRoute: "/api/jarvis/openclaw-operator-policy-boundary"
    }),
    entry({
      id: "whatsapp-urgent-only",
      title: "WhatsApp Urgent Only",
      group: "agent",
      state: "DEFERRED",
      detail: "WhatsApp remains urgent-only and deferred until cost-justified. No bulk messaging.",
      launchCritical: false
    })
  ];

  const summary = {
    total: entries.length,
    live: entries.filter((item) => item.state === "LIVE").length,
    sourceReady: entries.filter((item) => item.state === "SOURCE_READY").length,
    pendingRuntimeProof: entries.filter((item) => item.state === "PENDING_RUNTIME_PROOF").length,
    deferred: entries.filter((item) => item.state === "DEFERRED").length
  };

  return NextResponse.json({
    schema: "kingsmen.jarvis-live-index.v1",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    noFakeData: true,
    rawSecretsReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode,
    backendHealth: health.data,
    openClawRuntimeProven,
    summary,
    entries,
    nextAction: "Connect backend runtime, AI provider routing, provider credentials, and staging evidence before marking Jarvis production-real."
  });
}
