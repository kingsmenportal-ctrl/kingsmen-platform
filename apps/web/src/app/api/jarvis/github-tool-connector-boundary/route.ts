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

  const repoConfigured = isConfigured(process.env.KINGSMEN_GITHUB_REPOSITORY)
    || isConfigured(process.env.GITHUB_REPOSITORY_FULL_NAME)
    || isConfigured(process.env.GITHUB_REPOSITORY);
  const tokenConfigured = isConfigured(process.env.GITHUB_TOKEN) || isConfigured(process.env.GH_TOKEN);
  const credentialReady = repoConfigured && tokenConfigured;
  const runtimeBoundaryReady = backendLive && truthVaultLive;

  const checks: BoundaryCheck[] = [
    redactedStatus("github_repository_configured_redacted", repoConfigured),
    redactedStatus("github_token_present_redacted", tokenConfigured),
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
      name: "web_route_direct_github_provider_call",
      passed: true,
      detail: "false"
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
    schema: "kingsmen.jarvis-github-tool-connector-boundary.v1",
    module: "Jarvis GitHub Tool Connector Boundary",
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
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    connector: {
      title: "GitHub Tool Connector",
      group: "Tools",
      owner: "Kingsmen",
      boundary: "backend_or_approved_tool_boundary_only",
      requiredEvidence: [
        "redacted repository metadata read",
        "backend command envelope acceptance",
        "truth_vault command_log audit_events evidence",
        "no raw GitHub token returned",
        "no direct provider call from web route"
      ],
      allowedLocalRuntime: false,
      browserMayCallGitHubDirectly: false,
      githubTokenReturned: false
    },
    checks,
    failedChecks: checks.filter((check) => !check.passed),
    nextAction: credentialReady
      ? "Keep backend running and run the GitHub tool connector boundary proof. Do not mark provider runtime live until redacted metadata evidence exists."
      : "Configure KINGSMEN_GITHUB_REPOSITORY and GITHUB_TOKEN or GH_TOKEN outside Git, then run the GitHub tool connector boundary proof."
  });
}
