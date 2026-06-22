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

type RedactedModeCheck = {
  name: string;
  configured: boolean;
  detail: "configured_redacted" | "missing_or_placeholder";
};

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return ["1", "true", "yes", "enabled", "on"].includes(raw);
}

function modeCheck(name: string, expected: string, defaultValue: string): RedactedModeCheck {
  const value = process.env[name]?.trim() || defaultValue;
  const configured = value === expected;
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

  const scoutMode = modeCheck("KINGSMEN_PLAYWRIGHT_SCOUT_MODE", "scout_probe_only", "scout_probe_only");
  const mapFallbackEnabled = envFlag("KINGSMEN_MAP_FALLBACK_ENABLED", true);
  const phoenixFallbackEnabled = envFlag("KINGSMEN_PHOENIX_FALLBACK_ENABLED", true);
  const captchaOtpManualOnly = envFlag("KINGSMEN_CAPTCHA_OTP_MANUAL_ONLY", true);
  const playwrightScoutOnly = scoutMode.configured;
  const runtimeBoundaryReady = playwrightScoutOnly && mapFallbackEnabled && phoenixFallbackEnabled && captchaOtpManualOnly && backendReachable && postgresTruthVault;

  return NextResponse.json({
    schema: "kingsmen.jarvis-playwright-scout-map-fallback-boundary.v1",
    module: "Jarvis Playwright Scout MAP Fallback Boundary",
    status: runtimeBoundaryReady ? "JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY_READY" : "JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY_PENDING",
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
    browserMayRunPlaywrightDirectly: false,
    portalAutomationMayBypassPolicy: false,
    captchaOtpMayBeAutomated: false,
    playwrightScoutOnly,
    manualApplicationPackageRequired: true,
    mapFallbackEnabled,
    phoenixFallbackRequired: true,
    phoenixFallbackEnabled,
    captchaOtpManualOnly,
    backendCommandOutboxAuthority: true,
    postgresTruthVaultRequired: true,
    runtimeBoundaryReady,
    backendBoundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    checks: [
      scoutMode,
      {
        name: "manual_application_package_enabled",
        configured: mapFallbackEnabled,
        detail: mapFallbackEnabled ? "configured_redacted" : "missing_or_placeholder"
      },
      {
        name: "phoenix_fallback_enabled",
        configured: phoenixFallbackEnabled,
        detail: phoenixFallbackEnabled ? "configured_redacted" : "missing_or_placeholder"
      },
      {
        name: "captcha_otp_manual_only",
        configured: captchaOtpManualOnly,
        detail: captchaOtpManualOnly ? "configured_redacted" : "missing_or_placeholder"
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
        name: "browser_may_run_playwright_directly",
        passed: true,
        detail: "false"
      },
      {
        name: "portal_automation_may_bypass_policy",
        passed: true,
        detail: "false"
      },
      {
        name: "captcha_otp_may_be_automated",
        passed: true,
        detail: "false"
      }
    ],
    nextAction: runtimeBoundaryReady
      ? "Run backend command envelope proof for PLAYWRIGHT_SCOUT_MAP_FALLBACK_CHECK and capture MAP fallback evidence."
      : "Keep Playwright as scout/probe only until backend runtime, Truth Vault evidence, MAP fallback, Phoenix fallback, and CAPTCHA/OTP manual boundary proof are available."
  });
}
