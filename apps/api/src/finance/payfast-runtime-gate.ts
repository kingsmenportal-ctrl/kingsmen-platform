export type PayFastEnvironment = "sandbox" | "live";

export interface PayFastRuntimeGateInput {
  env: Record<string, string | undefined>;
  allowLocalhostUrls?: boolean;
}

export interface PayFastRuntimeGateResult {
  environment: PayFastEnvironment | "invalid";
  accountVerified: boolean;
  sandboxItnProofReviewed: boolean;
  founderPaymentApproval: boolean;
  readyForSandboxCheckout: boolean;
  readyForLivePayments: boolean;
  livePaymentsEnabled: boolean;
  blockers: string[];
  warnings: string[];
  redactedRuntime: Record<string, "present" | "missing" | "placeholder" | "invalid">;
}

const PLACEHOLDER_TOKENS = [
  "changeme",
  "your_value_here",
  "example.com",
  "real_value",
  "real_secret",
  "real_key",
  "dummy_",
  "fake_",
  "placeholder"
];

const REQUIRED_BASE_ENV = [
  "PAYFAST_ENVIRONMENT",
  "PAYFAST_MERCHANT_ID",
  "PAYFAST_MERCHANT_KEY",
  "PAYFAST_NOTIFY_URL",
  "PAYFAST_RETURN_URL",
  "PAYFAST_CANCEL_URL",
  "PAYMENT_PROVIDER_SECRET"
] as const;

const REQUIRED_LIVE_ENV = [
  "PAYFAST_ACCOUNT_VERIFIED",
  "PAYFAST_SANDBOX_ITN_PROOF_REVIEWED",
  "PAYFAST_FOUNDER_PAYMENT_APPROVAL"
] as const;

function normalized(value: string | undefined): string {
  return (value ?? "").trim();
}

function isTruthy(value: string | undefined): boolean {
  return ["true", "1", "yes", "approved", "verified", "passed"].includes(normalized(value).toLowerCase());
}

function isPlaceholder(value: string | undefined): boolean {
  const clean = normalized(value).toLowerCase();
  return clean.length === 0 || PLACEHOLDER_TOKENS.some((token) => clean.includes(token));
}

function classifyEnvValue(value: string | undefined): "present" | "missing" | "placeholder" {
  if (!normalized(value)) return "missing";
  return isPlaceholder(value) ? "placeholder" : "present";
}

function validateUrl(name: string, value: string | undefined, environment: PayFastEnvironment | "invalid", allowLocalhostUrls: boolean, blockers: string[], warnings: string[]): "present" | "missing" | "placeholder" | "invalid" {
  const classification = classifyEnvValue(value);
  if (classification !== "present") return classification;

  try {
    const parsed = new URL(normalized(value));
    const isLocalhost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname);
    if (environment === "live" && parsed.protocol !== "https:") {
      blockers.push(`${name} must be HTTPS for live PayFast payments.`);
      return "invalid";
    }
    if (environment === "live" && isLocalhost) {
      blockers.push(`${name} must not use localhost for live PayFast payments.`);
      return "invalid";
    }
    if (environment === "sandbox" && parsed.protocol !== "https:" && !(allowLocalhostUrls && isLocalhost)) {
      warnings.push(`${name} should be HTTPS in staging unless this is an explicit local-only sandbox proof.`);
    }
    return "present";
  } catch {
    blockers.push(`${name} is not a valid URL.`);
    return "invalid";
  }
}

export function buildPayFastRuntimeGate(input: PayFastRuntimeGateInput): PayFastRuntimeGateResult {
  const env = input.env;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const redactedRuntime: PayFastRuntimeGateResult["redactedRuntime"] = {};

  const rawEnvironment = normalized(env.PAYFAST_ENVIRONMENT).toLowerCase();
  const environment: PayFastEnvironment | "invalid" = rawEnvironment === "sandbox" || rawEnvironment === "live" ? rawEnvironment : "invalid";
  if (environment === "invalid") {
    blockers.push("PAYFAST_ENVIRONMENT must be sandbox or live.");
  }

  for (const key of REQUIRED_BASE_ENV) {
    const classification = classifyEnvValue(env[key]);
    redactedRuntime[key] = classification;
    if (classification === "missing") blockers.push(`${key} is missing from runtime secrets/environment.`);
    if (classification === "placeholder") blockers.push(`${key} is a placeholder and must be replaced outside Git.`);
  }

  for (const key of ["PAYFAST_NOTIFY_URL", "PAYFAST_RETURN_URL", "PAYFAST_CANCEL_URL"] as const) {
    redactedRuntime[key] = validateUrl(key, env[key], environment, input.allowLocalhostUrls ?? false, blockers, warnings);
  }

  const accountVerified = isTruthy(env.PAYFAST_ACCOUNT_VERIFIED);
  const sandboxItnProofReviewed = isTruthy(env.PAYFAST_SANDBOX_ITN_PROOF_REVIEWED);
  const founderPaymentApproval = isTruthy(env.PAYFAST_FOUNDER_PAYMENT_APPROVAL);

  for (const key of REQUIRED_LIVE_ENV) {
    redactedRuntime[key] = classifyEnvValue(env[key]);
  }

  if (environment === "live") {
    if (!accountVerified) blockers.push("PayFast account verification must be complete before live payments.");
    if (!sandboxItnProofReviewed) blockers.push("Real PayFast sandbox ITN evidence must be reviewed before live payments.");
    if (!founderPaymentApproval) blockers.push("Founder payment approval is required before live payments.");
  }

  const baseReady = blockers.length === 0;
  const readyForSandboxCheckout = baseReady && environment === "sandbox";
  const readyForLivePayments = baseReady && environment === "live" && accountVerified && sandboxItnProofReviewed && founderPaymentApproval;

  return {
    environment,
    accountVerified,
    sandboxItnProofReviewed,
    founderPaymentApproval,
    readyForSandboxCheckout,
    readyForLivePayments,
    livePaymentsEnabled: readyForLivePayments,
    blockers,
    warnings,
    redactedRuntime
  };
}

export function assertPayFastLivePaymentAllowed(result: PayFastRuntimeGateResult): void {
  if (!result.readyForLivePayments) {
    throw new Error(`PAYFAST_LIVE_PAYMENT_BLOCKED: ${result.blockers.join(" | ") || "Live payment gate is not open."}`);
  }
}

export const PAYFAST_RUNTIME_GATE_DOCTRINE = {
  rawSecretsAreNeverReturned: true,
  returnUrlIsNotProofOfPayment: true,
  cancelUrlCannotChangePaidStatus: true,
  acceptedItnRequiredForPaidStatus: true,
  payfastAccountVerificationRequiredForLive: true,
  sandboxItnProofRequiredForLive: true,
  founderApprovalRequiredForLive: true
} as const;
