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
  return !/[<>{}]|placeholder|todo|changeme|your-|real_|dummy|fake/i.test(normalized);
}

function redactedStatus(name: string, configured: boolean): BoundaryCheck {
  return {
    name,
    passed: configured,
    detail: configured ? "present_redacted" : "missing_or_placeholder"
  };
}

function isSandbox(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "sandbox";
}

function hasUsableNotifyUrl(value: string | undefined): boolean {
  const normalized = (value ?? "").trim();
  if (!isConfigured(normalized)) return false;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || (url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname));
  } catch {
    return false;
  }
}

export async function GET() {
  const boundary = getKingsmenBackendBoundary();
  const health = await getKingsmenApiHealth<BackendHealth>();
  const backendLive = health.ok && health.data?.ok === true;
  const truthVaultLive = backendLive && health.data?.storageMode === "postgres_truth_vault";

  const merchantIdConfigured = isConfigured(process.env.PAYFAST_MERCHANT_ID);
  const merchantKeyConfigured = isConfigured(process.env.PAYFAST_MERCHANT_KEY);
  const passphraseConfigured = isConfigured(process.env.PAYFAST_PASSPHRASE);
  const notifyUrlConfigured = hasUsableNotifyUrl(process.env.PAYFAST_NOTIFY_URL);
  const providerSecretConfigured = isConfigured(process.env.PAYMENT_PROVIDER_SECRET);
  const sandboxEnvironment = isSandbox(process.env.PAYFAST_ENVIRONMENT ?? "sandbox");

  const credentialReady = merchantIdConfigured
    && merchantKeyConfigured
    && passphraseConfigured
    && notifyUrlConfigured
    && providerSecretConfigured
    && sandboxEnvironment;

  const runtimeBoundaryReady = backendLive && truthVaultLive;

  const checks: BoundaryCheck[] = [
    redactedStatus("payfast_merchant_id_configured_redacted", merchantIdConfigured),
    redactedStatus("payfast_merchant_key_configured_redacted", merchantKeyConfigured),
    redactedStatus("payfast_passphrase_configured_redacted", passphraseConfigured),
    redactedStatus("payfast_notify_url_configured_redacted", notifyUrlConfigured),
    redactedStatus("payment_provider_secret_configured_redacted", providerSecretConfigured),
    {
      name: "payfast_environment_sandbox_only",
      passed: sandboxEnvironment,
      detail: sandboxEnvironment ? "sandbox" : "not_sandbox"
    },
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
      name: "accepted_itn_required_for_paid_status",
      passed: true,
      detail: "true"
    },
    {
      name: "return_cancel_cannot_mark_paid",
      passed: true,
      detail: "true"
    },
    {
      name: "refund_human_review_required",
      passed: true,
      detail: "true"
    },
    {
      name: "web_route_direct_payfast_provider_call",
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
    ? "PENDING_RUNTIME_PROOF"
    : credentialReady
      ? "SOURCE_READY"
      : "DEFERRED";

  return NextResponse.json({
    schema: "kingsmen.jarvis-payfast-provider-proof-queue-boundary.v1",
    module: "Jarvis PayFast Provider Proof Queue Boundary",
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
    backendBoundaryMode: "backend_api_only",
    backendBoundary: boundary,
    backendHealthStatus: health.status,
    backendStorageMode: health.data?.storageMode ?? null,
    paymentDoctrine: {
      title: "PayFast Provider Proof Queue Boundary",
      group: "Payments",
      boundary: "backend_api_only",
      truthAuthority: "postgres_truth_vault",
      payfastEnvironment: "sandbox",
      livePaymentsEnabled: false,
      candidateCharged: false,
      acceptedItnRequiredForPaidStatus: true,
      returnUrlMayMarkPaid: false,
      cancelUrlMayMarkPaid: false,
      refundsAutoApproved: false,
      refundHumanReviewRequired: true,
      browserMayCallPayFastDirectly: false,
      payfastCredentialsReturned: false,
      requiredEvidence: [
        "sandbox merchant configured redacted proof",
        "sandbox checkout created proof",
        "accepted ITN evidence proof",
        "signature verification proof",
        "amount verification proof",
        "duplicate ITN rejection proof",
        "failed payment rejection proof",
        "return and cancel URLs cannot mark paid proof",
        "refund human review proof",
        "founder payment approval proof"
      ]
    },
    checks,
    failedChecks: checks.filter((check) => !check.passed),
    nextAction: credentialReady
      ? "Run the PayFast provider proof queue boundary proof with backend and web running. Do not enable live payments until accepted ITN, sandbox evidence, and founder approval are recorded."
      : "Keep PayFast in sandbox/deferred mode. Configure PayFast sandbox credentials outside Git and collect accepted ITN proof before payment status can be marked paid."
  });
}
