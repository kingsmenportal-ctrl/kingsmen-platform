import { buildPayFastRuntimeGate } from "./payfast-runtime-gate";
import { validatePayFastItn, type PayFastItnValidationResult } from "./payfast-itn";
import type { PayFastFields } from "./payfast-signature";

export type PayFastHttpRouteName =
  | "POST /api/payments/payfast/itn"
  | "GET /api/payments/payfast/return"
  | "GET /api/payments/payfast/cancel"
  | "GET /api/payments/payfast/status/:merchantReference";

export interface PayFastHttpBoundaryInput {
  env: Record<string, string | undefined>;
  nowIso?: string;
}

export interface PayFastItnHttpInput extends PayFastHttpBoundaryInput {
  rawBody: string;
  expectedMerchantReference: string;
  expectedAmountCents: number;
  duplicate?: boolean;
  ipValid?: boolean;
}

export interface PayFastHttpResponseBody {
  ok: boolean;
  status:
    | "PAYFAST_ITN_ACCEPTED"
    | "PAYFAST_ITN_REJECTED"
    | "PAYFAST_RETURN_PENDING_ITN"
    | "PAYFAST_CANCEL_NO_STATUS_CHANGE"
    | "PAYFAST_STATUS_PENDING_PROVIDER_EVIDENCE";
  route: PayFastHttpRouteName;
  merchantReference?: string;
  paidStatusChanged: boolean;
  providerEvidenceRequired: boolean;
  validation?: PayFastItnValidationResult;
  runtimeBlockers?: string[];
  warnings?: string[];
  generatedAtIso: string;
}

export function parsePayFastFormBody(rawBody: string): PayFastFields {
  const params = new URLSearchParams(rawBody);
  const fields: PayFastFields = {};
  for (const [key, value] of params.entries()) fields[key] = value;
  return fields;
}

export function buildPayFastItnHttpResponse(input: PayFastItnHttpInput): PayFastHttpResponseBody {
  const generatedAtIso = input.nowIso ?? new Date().toISOString();
  const gate = buildPayFastRuntimeGate({ env: input.env, allowLocalhostUrls: true });
  const payload = parsePayFastFormBody(input.rawBody);

  const validation = validatePayFastItn({
    payload,
    expectedMerchantReference: input.expectedMerchantReference,
    expectedAmountCents: input.expectedAmountCents,
    passphrase: input.env.PAYFAST_PASSPHRASE,
    duplicate: input.duplicate,
    ipValid: input.ipValid
  });

  const ok = validation.accepted && gate.blockers.length === 0;

  return {
    ok,
    status: ok ? "PAYFAST_ITN_ACCEPTED" : "PAYFAST_ITN_REJECTED",
    route: "POST /api/payments/payfast/itn",
    merchantReference: validation.merchantReference,
    paidStatusChanged: ok,
    providerEvidenceRequired: true,
    validation,
    runtimeBlockers: gate.blockers,
    warnings: gate.warnings,
    generatedAtIso
  };
}

export function buildPayFastReturnPendingResponse(input: PayFastHttpBoundaryInput & { merchantReference?: string }): PayFastHttpResponseBody {
  const gate = buildPayFastRuntimeGate({ env: input.env, allowLocalhostUrls: true });
  return {
    ok: true,
    status: "PAYFAST_RETURN_PENDING_ITN",
    route: "GET /api/payments/payfast/return",
    merchantReference: input.merchantReference,
    paidStatusChanged: false,
    providerEvidenceRequired: true,
    runtimeBlockers: gate.blockers,
    warnings: [
      ...gate.warnings,
      "Browser return is not proof of payment. Kingsmen must wait for accepted PayFast ITN evidence."
    ],
    generatedAtIso: input.nowIso ?? new Date().toISOString()
  };
}

export function buildPayFastCancelResponse(input: PayFastHttpBoundaryInput & { merchantReference?: string }): PayFastHttpResponseBody {
  return {
    ok: true,
    status: "PAYFAST_CANCEL_NO_STATUS_CHANGE",
    route: "GET /api/payments/payfast/cancel",
    merchantReference: input.merchantReference,
    paidStatusChanged: false,
    providerEvidenceRequired: true,
    warnings: ["Payment cancellation does not mark an order as paid, failed, or refunded without provider evidence."],
    generatedAtIso: input.nowIso ?? new Date().toISOString()
  };
}

export function buildPayFastStatusPendingResponse(input: PayFastHttpBoundaryInput & { merchantReference: string }): PayFastHttpResponseBody {
  const gate = buildPayFastRuntimeGate({ env: input.env, allowLocalhostUrls: true });
  return {
    ok: true,
    status: "PAYFAST_STATUS_PENDING_PROVIDER_EVIDENCE",
    route: "GET /api/payments/payfast/status/:merchantReference",
    merchantReference: input.merchantReference,
    paidStatusChanged: false,
    providerEvidenceRequired: true,
    runtimeBlockers: gate.blockers,
    warnings: gate.warnings,
    generatedAtIso: input.nowIso ?? new Date().toISOString()
  };
}

export const PAYFAST_HTTP_BOUNDARY_ROUTES: PayFastHttpRouteName[] = [
  "POST /api/payments/payfast/itn",
  "GET /api/payments/payfast/return",
  "GET /api/payments/payfast/cancel",
  "GET /api/payments/payfast/status/:merchantReference"
];

export const PAYFAST_HTTP_BOUNDARY_DOCTRINE = {
  routeWiringBuilt: true,
  itnEndpointRequired: true,
  returnPagePendingOnly: true,
  cancelPageNoStatusChange: true,
  statusRequiresProviderEvidence: true,
  paidStatusChangedOnlyByAcceptedItn: true,
  paymentRuntimeGateRequired: true
} as const;
