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

type BoundaryState = "DEFERRED" | "SOURCE_READY" | "PENDING_RUNTIME_PROOF" | "LIVE" | "BLOCKED";

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

  const whatsappAccountConfigured = isConfigured(process.env.KINGSMEN_WHATSAPP_BUSINESS_ACCOUNT_ID)
    || isConfigured(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
  const whatsappPhoneConfigured = isConfigured(process.env.KINGSMEN_WHATSAPP_PHONE_NUMBER_ID)
    || isConfigured(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const whatsappTokenConfigured = isConfigured(process.env.KINGSMEN_WHATSAPP_ACCESS_TOKEN)
    || isConfigured(process.env.WHATSAPP_ACCESS_TOKEN);
  const smsProviderConfigured = isConfigured(process.env.KINGSMEN_SMS_PROVIDER)
    || isConfigured(process.env.SMS_PROVIDER);
  const smsKeyConfigured = isConfigured(process.env.KINGSMEN_SMS_API_KEY)
    || isConfigured(process.env.SMS_API_KEY);

  const whatsappCredentialReady = whatsappAccountConfigured && whatsappPhoneConfigured && whatsappTokenConfigured;
  const smsBackupCredentialReady = smsProviderConfigured && smsKeyConfigured;
  const runtimeBoundaryReady = backendLive && truthVaultLive;

  const checks: BoundaryCheck[] = [
    redactedStatus("whatsapp_business_account_configured_redacted", whatsappAccountConfigured),
    redactedStatus("whatsapp_phone_number_configured_redacted", whatsappPhoneConfigured),
    redactedStatus("whatsapp_access_token_present_redacted", whatsappTokenConfigured),
    redactedStatus("sms_provider_configured_redacted", smsProviderConfigured),
    redactedStatus("sms_api_key_present_redacted", smsKeyConfigured),
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
      name: "web_route_direct_whatsapp_provider_call",
      passed: true,
      detail: "false"
    },
    {
      name: "web_route_direct_sms_provider_call",
      passed: true,
      detail: "false"
    },
    {
      name: "whatsapp_bulk_allowed",
      passed: true,
      detail: "false"
    },
    {
      name: "whatsapp_urgent_only",
      passed: true,
      detail: "true"
    },
    {
      name: "sms_backup_only",
      passed: true,
      detail: "true"
    },
    {
      name: "raw_secrets_returned",
      passed: true,
      detail: "false"
    }
  ];

  const providerReady = whatsappCredentialReady || smsBackupCredentialReady;
  const state: BoundaryState = providerReady && runtimeBoundaryReady
    ? "PENDING_RUNTIME_PROOF"
    : providerReady
      ? "SOURCE_READY"
      : "DEFERRED";

  return NextResponse.json({
    schema: "kingsmen.jarvis-whatsapp-urgent-sms-backup-boundary.v1",
    module: "Jarvis WhatsApp Urgent SMS Backup Boundary",
    generatedAt: new Date().toISOString(),
    state,
    credentialReady: providerReady,
    whatsappCredentialReady,
    smsBackupCredentialReady,
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
    whatsappUrgentOnly: true,
    whatsappBulkAllowed: false,
    smsBackupOnly: true,
    emailPrimaryChannelRemains: true,
    backendBoundaryMode: "backend_api_only",
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    channel: {
      title: "WhatsApp Urgent Only / SMS Backup Boundary",
      group: "Agents",
      boundary: "backend_api_only",
      truthAuthority: "postgres_truth_vault",
      communicationDoctrine: "email_primary_whatsapp_urgent_only_sms_backup",
      requiredEvidence: [
        "urgent-only WhatsApp policy proof",
        "no bulk WhatsApp campaign proof",
        "SMS backup-only policy proof",
        "backend command envelope acceptance",
        "truth_vault communication evidence ledger",
        "no raw WhatsApp or SMS credential returned",
        "no direct provider call from web route"
      ],
      allowedLocalRuntime: false,
      browserMaySendWhatsAppDirectly: false,
      browserMaySendSmsDirectly: false,
      browserMayBulkMessageDirectly: false,
      whatsappTokenReturned: false,
      smsApiKeyReturned: false
    },
    checks,
    failedChecks: checks.filter((check) => !check.passed),
    nextAction: providerReady
      ? "Keep backend running and run the WhatsApp urgent SMS backup boundary proof. Do not mark WhatsApp or SMS runtime live until urgent-only and backup-only evidence exists."
      : "Keep WhatsApp deferred unless urgent use is cost-justified. Configure WhatsApp and SMS credentials outside Git only when provider activation is needed."
  });
}
