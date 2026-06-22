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

type BoundaryState = "LIVE" | "PENDING_CREDENTIALS" | "PENDING_RUNTIME_PROOF" | "SOURCE_READY" | "BLOCKED";

type BoundaryCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

function isConfigured(value: string | undefined): boolean {
  const normalized = (value ?? "").trim();
  if (!normalized) return false;
  return !/[<>{}]|placeholder|todo|changeme|your-/i.test(normalized);
}

function redactedStatus(name: string, configured: boolean): BoundaryCheck {
  return {
    name,
    passed: configured,
    detail: configured ? "present_redacted" : "missing_or_placeholder"
  };
}

export async function GET() {
  const boundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendLive = health.ok && health.data?.ok === true;
  const truthVaultLive = backendLive && health.data?.storageMode === "postgres_truth_vault";

  const baseConfigured = isConfigured(process.env.KINGSMEN_AIRTABLE_BASE_ID) || isConfigured(process.env.AIRTABLE_BASE_ID);
  const tokenConfigured = isConfigured(process.env.KINGSMEN_AIRTABLE_API_KEY)
    || isConfigured(process.env.AIRTABLE_API_KEY)
    || isConfigured(process.env.AIRTABLE_TOKEN)
    || isConfigured(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN);
  const mirrorTableConfigured = isConfigured(process.env.KINGSMEN_AIRTABLE_CANDIDATES_TABLE)
    || isConfigured(process.env.AIRTABLE_CANDIDATES_TABLE)
    || isConfigured(process.env.AIRTABLE_TABLE_CANDIDATES);
  const credentialReady = baseConfigured && tokenConfigured && mirrorTableConfigured;
  const runtimeBoundaryReady = backendLive && truthVaultLive;

  const checks: BoundaryCheck[] = [
    redactedStatus("airtable_base_configured_redacted", baseConfigured),
    redactedStatus("airtable_token_present_redacted", tokenConfigured),
    redactedStatus("airtable_mirror_table_configured_redacted", mirrorTableConfigured),
    {
      name: "backend_health_reachable",
      passed: backendLive,
      detail: backendLive ? "ok" : "pending_backend_runtime"
    },
    {
      name: "backend_storage_mode_postgres_truth_vault",
      passed: truthVaultLive,
      detail: health.data?.storageMode ?? "missing"
    },
    {
      name: "web_route_direct_airtable_provider_call",
      passed: true,
      detail: "false"
    },
    {
      name: "postgres_remains_truth",
      passed: true,
      detail: "true"
    },
    {
      name: "raw_secrets_returned",
      passed: true,
      detail: "false"
    }
  ];

  const state: BoundaryState = credentialReady && runtimeBoundaryReady
    ? "LIVE"
    : credentialReady
      ? "PENDING_RUNTIME_PROOF"
      : "PENDING_CREDENTIALS";

  return NextResponse.json({
    schema: "kingsmen.jarvis-airtable-human-mirror-boundary.v1",
    module: "Jarvis Airtable Human Mirror Boundary",
    generatedAt: new Date().toISOString(),
    state,
    credentialReady,
    runtimeBoundaryReady,
    productionReady: false,
    publicLaunchAllowed: false,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    providerCredentialsPrinted: false,
    directProviderCallsFromWeb: false,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false,
    postgresRemainsTruth: true,
    airtableMayBecomeTruth: false,
    backendBoundaryMode: "backend_api_only",
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    mirror: {
      title: "Airtable Human Mirror",
      group: "Apps",
      boundary: "backend_api_only",
      truthAuthority: "postgres_truth_vault",
      mirrorOnly: true,
      requiredEvidence: [
        "redacted Airtable health read",
        "backend command envelope acceptance",
        "truth_vault command_log audit_events evidence",
        "no raw Airtable token returned",
        "no direct provider call from web route"
      ],
      allowedLocalRuntime: false,
      browserMayCallAirtableDirectly: false,
      airtableTokenReturned: false
    },
    checks,
    failedChecks: checks.filter((check) => !check.passed),
    nextAction: credentialReady
      ? "Keep backend running and run the Airtable human mirror boundary proof. Do not mark mirror runtime live until redacted health evidence exists."
      : "Configure KINGSMEN_AIRTABLE_BASE_ID, KINGSMEN_AIRTABLE_API_KEY, and KINGSMEN_AIRTABLE_CANDIDATES_TABLE outside Git, then run the Airtable human mirror boundary proof."
  });
}
