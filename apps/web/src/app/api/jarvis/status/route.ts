import { NextResponse } from "next/server";

import { getKingsmenApiHealth, getKingsmenBackendBoundary } from "@/lib/kingsmen-backend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const commands = [
  { id: "SYSTEM_VALIDATE_N20", title: "Validate N20 system lock", description: "Requests a backend-led system validation command. The web route does not execute local scripts.", category: "System", risk: "SAFE_READ" },
  { id: "DB_LEDGER_CHECK", title: "Check migration ledger", description: "Requests a backend-led database ledger check. The web route does not call database binaries directly.", category: "Database", risk: "SAFE_READ" },
  { id: "QUEUE_HEALTH_CHECK", title: "Check queue health", description: "Requests a backend-led queue/workflow/heartbeat/DLQ health check.", category: "Operations", risk: "SAFE_READ" },
  { id: "INCIDENT_REVIEW", title: "Review incidents", description: "Requests a backend-led incident and evidence review.", category: "Operations", risk: "SAFE_READ" },
  { id: "MANUAL_FALLBACK_REVIEW", title: "Manual fallback review", description: "Requests a backend-led MAP and Phoenix fallback review.", category: "Operations", risk: "SAFE_READ" },
  { id: "FOUNDER_OVERRIDE_REVIEW", title: "Founder override review", description: "Requests a backend-led governance and approval-surface review. No override is executed by the web app.", category: "Governance", risk: "SAFE_READ" },
  { id: "PUBLIC_ROUTE_HOUSE_CHECK", title: "Public route house check", description: "Requests a backend-led public surface check.", category: "Web", risk: "SAFE_READ" },
  { id: "CANDIDATE_PORTAL_CHECK", title: "Candidate portal check", description: "Requests a backend-led candidate portal check.", category: "Web", risk: "SAFE_READ" },
  { id: "OPENCLAW_GRIP_CHECK", title: "OpenClaw grip check", description: "Requests a backend-led operator grip check without giving OpenClaw direct production authority.", category: "OpenClaw", risk: "SAFE_READ" },
  { id: "COMMAND_PERSISTENCE_PROOF", title: "Truth Vault command evidence", description: "Sends a SAFE_READ Jarvis command envelope and expects backend command_log plus audit_events evidence when PostgreSQL Truth Vault is enabled.", category: "Evidence", risk: "SAFE_READ" },
  { id: "AI_PROVIDER_ROUTER_CHECK", title: "AI provider router check", description: "Requests backend evidence for real AI provider routing, policy gates, and redacted provider status.", category: "AI", risk: "SAFE_READ" },
  { id: "TOOLS_APPS_AGENTS_INDEX", title: "Tools, apps, agents index", description: "Requests backend evidence for integrations, tools, apps, and operator agents without dummy statuses.", category: "Technology", risk: "SAFE_READ" },
  { id: "PAYFAST_STAGING_EVIDENCE", title: "PayFast staging evidence", description: "Requests backend review of PayFast sandbox checkout and ITN proof before any live payment is allowed.", category: "Payments", risk: "SAFE_READ" },
  { id: "EVIDENCE_BUNDLE_REVIEW", title: "Final evidence bundle review", description: "Requests backend/founder review of the final staging evidence bundle and launch blockers.", category: "Evidence", risk: "SAFE_READ" }
];

type BackendHealth = {
  ok?: boolean;
  service?: string;
  status?: string;
  storageMode?: string;
  truthVault?: unknown;
  startedAtIso?: string;
  generatedAtIso?: string;
  routes?: string[];
};

export async function GET() {
  const backendBoundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendOk = health.ok && health.data?.ok === true;
  const truthVaultOk = backendOk && health.data?.storageMode === "postgres_truth_vault";

  const cards = [
    {
      key: "backend-api-boundary",
      title: "Backend API Boundary",
      state: backendOk ? "ONLINE" : "REVIEW",
      detail: backendOk
        ? `Backend ${health.data?.service ?? "kingsmen-api"} responded through ${backendBoundary.mode}.`
        : health.error ?? "Backend API boundary is not configured or did not respond.",
      ok: backendOk
    },
    {
      key: "truth-vault-mode",
      title: "Truth Vault Mode",
      state: truthVaultOk ? "POSTGRES" : "DEVELOPMENT",
      detail: health.data?.storageMode
        ? `API storage mode: ${health.data.storageMode}.`
        : "Storage mode unavailable until the backend API responds.",
      ok: truthVaultOk
    },
    {
      key: "jarvis-command-persistence",
      title: "Jarvis Command Persistence",
      state: truthVaultOk ? "POSTGRES_EVIDENCE_READY" : "PENDING_POSTGRES_TRUTH_VAULT",
      detail: truthVaultOk
        ? "Backend /api/commands accepts Jarvis envelopes and records command_log plus audit_events evidence in PostgreSQL Truth Vault."
        : "Jarvis command persistence requires the backend API to run with KINGSMEN_TRUTH_VAULT_MODE=postgres and DATABASE_URL/KINGSMEN_DATABASE_URL configured.",
      ok: truthVaultOk
    },
    {
      key: "jarvis-live-index",
      title: "Jarvis Live Technology Index",
      state: "AVAILABLE",
      detail: "/api/jarvis/live-index exposes backend, AI, tools, apps, agents, PayFast, email, storage, OpenClaw, WhatsApp, and evidence boundaries with no fake status and no secrets returned.",
      ok: true
    },
    {
      key: "ai-provider-router",
      title: "AI Provider Router",
      state: "PENDING_RUNTIME_PROOF",
      detail: "Real AI routing must be backend-controlled with provider credentials outside Git, policy gates, and live-call evidence before production claims.",
      ok: false
    },
    {
      key: "tool-app-agent-registry",
      title: "Tools, Apps, Agents Registry",
      state: "SOURCE_READY",
      detail: "GitHub, n8n, Playwright, Airtable, PayFast, Email, Storage, OpenClaw, WhatsApp, and SMS are indexed as real integration boundaries, not dummy cards.",
      ok: true
    },
    {
      key: "payfast-provider-sandbox",
      title: "PayFast Provider Sandbox Evidence",
      state: "PENDING_STAGING_CAPTURE",
      detail: "Source proof is clean. Real sandbox merchant configuration, checkout, ITN, duplicate rejection, failed payment rejection, return/cancel review, refund review, and founder review remain required.",
      ok: false
    },
    {
      key: "web-boundary",
      title: "Web Runtime Boundary",
      state: "LOCKED",
      detail: "This Next route only calls the backend API client. It performs no local shell execution, direct database access, or local proof-file writes.",
      ok: true
    },
    {
      key: "api-command",
      title: "Jarvis API Command Runner",
      state: "BACKEND_ONLY",
      detail: "Whitelisted SAFE_READ commands are converted into backend command envelopes through /api/commands.",
      ok: true
    },
    {
      key: "policy-boundary",
      title: "Policy Boundary",
      state: "LOCKED",
      detail: "Jarvis remains a founder/operator surface. Backend command policy and evidence remain the authority.",
      ok: true
    }
  ];

  return NextResponse.json({
    ok: cards.every((card) => card.ok),
    generatedAt: new Date().toISOString(),
    backendBoundary,
    backendHealthStatus: health.status,
    backendHealth: health.data,
    cards,
    commands,
    liveIndexPath: "/api/jarvis/live-index",
    doctrine: [
      "Jarvis is the founder/operator surface, not the backend authority.",
      "The web app must call the backend API boundary rather than local workstation commands.",
      "Backend state machine remains authority for candidate journeys.",
      "Every command must carry idempotency and correlation evidence.",
      "Every accepted Jarvis command must be persisted by the backend in command_log and audit_events when PostgreSQL Truth Vault is enabled.",
      "Risky actions require policy gates and founder approval.",
      "Jarvis must never invent fake candidate, payment, provider, AI, or tool status.",
      "AI, tools, apps, and agents require real provider configuration plus redacted runtime evidence before production claims."
    ]
  });
}
