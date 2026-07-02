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
  { id: "OPENCLAW_GRIP_CHECK", title: "OpenClaw grip check", description: "Requests a backend-led operator grip check without giving OpenClaw direct production authority.", category: "OpenClaw", risk: "SAFE_READ" }
];

type BackendHealth = {
  ok?: boolean;
  service?: string;
  status?: string;
  storageMode?: string;
  truthVault?: unknown;
  jarvisRuntime?: {
    route?: string;
    inMemoryResults?: number;
    backendAuthority?: boolean;
  };
  startedAtIso?: string;
  generatedAtIso?: string;
  routes?: string[];
};

export async function GET() {
  const backendBoundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendOk = health.ok && health.data?.ok === true;
  const jarvisRuntimeRoute = health.data?.routes?.includes("POST /api/jarvis/runtime-control") === true || health.data?.jarvisRuntime?.route === "POST /api/jarvis/runtime-control";

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
      key: "jarvis-runtime-authority",
      title: "Jarvis Runtime Authority",
      state: backendOk && jarvisRuntimeRoute ? "LIVE_ROUTE" : "REVIEW",
      detail: backendOk && jarvisRuntimeRoute
        ? "Backend exposes POST /api/jarvis/runtime-control for Jarvis decisions."
        : "Backend has not confirmed the Jarvis runtime-control route yet.",
      ok: backendOk && jarvisRuntimeRoute
    },
    {
      key: "truth-vault-mode",
      title: "Truth Vault Mode",
      state: health.data?.storageMode === "postgres_truth_vault" ? "POSTGRES" : "DEVELOPMENT",
      detail: health.data?.storageMode
        ? `API storage mode: ${health.data.storageMode}.`
        : "Storage mode unavailable until the backend API responds.",
      ok: backendOk
    },
    {
      key: "web-boundary",
      title: "Web Runtime Boundary",
      state: "LOCKED",
      detail: "This Next route only calls the backend API client. It performs no local shell execution, no workstation runtime commands, no direct storage access, and no local proof-file writes.",
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
    jarvisRuntimeRouteConfirmed: jarvisRuntimeRoute,
    cards,
    commands,
    doctrine: [
      "Jarvis is the founder/operator surface, not the backend authority.",
      "The web app must call the backend API boundary rather than local workstation commands.",
      "Backend state machine remains authority for candidate journeys.",
      "Every command must carry idempotency and correlation evidence.",
      "Risky actions require policy gates and founder approval."
    ]
  });
}
