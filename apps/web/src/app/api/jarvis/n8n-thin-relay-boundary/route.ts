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

type RedactedCredentialCheck = {
  name: string;
  configured: boolean;
  detail: "configured_redacted" | "missing_or_placeholder";
};

function isConfigured(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !["placeholder", "replace_me", "changeme", "todo", "test", "dummy", "example", "your_value_here"].some((token) => normalized.includes(token));
}

function credential(name: string): RedactedCredentialCheck {
  const configured = isConfigured(process.env[name]);
  return {
    name,
    configured,
    detail: configured ? "configured_redacted" : "missing_or_placeholder"
  };
}

export async function GET() {
  const generatedAt = new Date().toISOString();
  const backendBoundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendReachable = health.ok && health.data?.ok === true;
  const postgresTruthVault = backendReachable && health.data?.storageMode === "postgres_truth_vault";

  const n8nBaseUrl = credential("KINGSMEN_N8N_BASE_URL");
  const n8nApiKey = credential("KINGSMEN_N8N_API_KEY");
  const n8nWebhookSecret = credential("KINGSMEN_N8N_WEBHOOK_SECRET");
  const relayMode = process.env.KINGSMEN_N8N_RELAY_MODE?.trim() || "thin_relay_only";
  const thinRelayOnly = relayMode === "thin_relay_only";
  const credentialReady = n8nBaseUrl.configured && n8nApiKey.configured && n8nWebhookSecret.configured && thinRelayOnly;
  const runtimeBoundaryReady = credentialReady && backendReachable && postgresTruthVault;

  return NextResponse.json({
    schema: "kingsmen.jarvis-n8n-thin-relay-boundary.v1",
    module: "Jarvis n8n Thin Relay Boundary",
    status: runtimeBoundaryReady ? "JARVIS_N8N_THIN_RELAY_BOUNDARY_READY" : "JARVIS_N8N_THIN_RELAY_BOUNDARY_PENDING",
    generatedAt,
    productionReady: false,
    publicLaunchAllowed: false,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    providerCredentialsPrinted: false,
    directProviderCallsFromWeb: false,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false,
    backend_api_only: true,
    browserMayCallN8nDirectly: false,
    workflowMayWriteTruthVaultDirectly: false,
    n8nMayBecomeAuthority: false,
    thinRelayOnly,
    automationAuthority: "backend_command_outbox",
    postgresTruthVaultRequired: true,
    credentialReady,
    runtimeBoundaryReady,
    backendBoundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    checks: [
      n8nBaseUrl,
      n8nApiKey,
      n8nWebhookSecret,
      {
        name: "n8n_relay_mode_thin_relay_only",
        configured: thinRelayOnly,
        detail: thinRelayOnly ? "configured_redacted" : "missing_or_placeholder"
      },
      {
        name: "backend_health_reachable",
        passed: backendReachable,
        detail: backendReachable ? "reachable" : "missing"
      },
      {
        name: "backend_storage_mode_postgres_truth_vault",
        passed: postgresTruthVault,
        detail: health.data?.storageMode ?? "missing"
      },
      {
        name: "browser_may_call_n8n_directly",
        passed: true,
        detail: "false"
      },
      {
        name: "workflow_may_write_truth_vault_directly",
        passed: true,
        detail: "false"
      },
      {
        name: "n8n_may_become_authority",
        passed: true,
        detail: "false"
      }
    ],
    nextAction: runtimeBoundaryReady
      ? "Run backend command envelope proof for N8N_THIN_RELAY_CHECK and capture evidence ledger output."
      : "Keep n8n as source-ready only until redacted credentials, backend runtime, and outbox evidence are available."
  });
}
