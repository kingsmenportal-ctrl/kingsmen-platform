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

  const smtpHostConfigured = isConfigured(process.env.SMTP_HOST) || isConfigured(process.env.KINGSMEN_SMTP_HOST);
  const smtpUserConfigured = isConfigured(process.env.SMTP_USER) || isConfigured(process.env.KINGSMEN_SMTP_USER);
  const smtpPasswordConfigured = isConfigured(process.env.SMTP_PASSWORD) || isConfigured(process.env.KINGSMEN_SMTP_PASSWORD);
  const senderConfigured = isConfigured(process.env.EMAIL_FROM)
    || isConfigured(process.env.KINGSMEN_EMAIL_FROM)
    || isConfigured(process.env.SMTP_FROM);
  const credentialReady = smtpHostConfigured && smtpUserConfigured && smtpPasswordConfigured && senderConfigured;
  const runtimeBoundaryReady = backendLive && truthVaultLive;

  const checks: BoundaryCheck[] = [
    redactedStatus("smtp_host_configured_redacted", smtpHostConfigured),
    redactedStatus("smtp_user_configured_redacted", smtpUserConfigured),
    redactedStatus("smtp_password_present_redacted", smtpPasswordConfigured),
    redactedStatus("email_sender_configured_redacted", senderConfigured),
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
      name: "web_route_direct_email_provider_call",
      passed: true,
      detail: "false"
    },
    {
      name: "email_primary_channel",
      passed: true,
      detail: "true"
    },
    {
      name: "whatsapp_bulk_allowed",
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
    schema: "kingsmen.jarvis-email-primary-channel-boundary.v1",
    module: "Jarvis Email Primary Channel Boundary",
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
    emailPrimaryChannel: true,
    whatsappBulkAllowed: false,
    smsBackupOnly: true,
    backendBoundaryMode: "backend_api_only",
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    channel: {
      title: "Email Primary Channel",
      group: "Apps",
      boundary: "backend_api_only",
      truthAuthority: "postgres_truth_vault",
      communicationDoctrine: "email_primary_whatsapp_urgent_only_sms_backup",
      requiredEvidence: [
        "redacted SMTP provider readiness",
        "backend command envelope acceptance",
        "truth_vault notification evidence ledger",
        "send receive bounce and opt-out proof",
        "no raw SMTP credential returned",
        "no direct provider call from web route"
      ],
      allowedLocalRuntime: false,
      browserMaySendEmailDirectly: false,
      browserMayCallSmtpDirectly: false,
      whatsappBulkAllowed: false,
      emailPasswordReturned: false
    },
    checks,
    failedChecks: checks.filter((check) => !check.passed),
    nextAction: credentialReady
      ? "Keep backend running and run the Email primary channel boundary proof. Do not mark email runtime live until send receive bounce opt-out and evidence-ledger proof exists."
      : "Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM outside Git, then run the Email primary channel boundary proof."
  });
}
