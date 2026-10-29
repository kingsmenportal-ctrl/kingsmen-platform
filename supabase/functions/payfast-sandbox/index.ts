import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import CryptoJS from "npm:crypto-js@4.2.0";

const cors = {
  "access-control-allow-origin": Deno.env.get("KINGSMEN_WEB_ORIGIN") ?? "https://kingsmen-portal-staging.netlify.app",
  "access-control-allow-headers": "authorization, apikey, content-type, idempotency-key",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const requiredEnv = [
  "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "PAYFAST_MERCHANT_ID",
  "PAYFAST_MERCHANT_KEY", "PAYFAST_NOTIFY_URL"
] as const;

function missingConfig() {
  return requiredEnv.filter((key) => !Deno.env.get(key)?.trim());
}

function canonical(fields: Record<string, string>, passphrase?: string) {
  const pairs = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && value !== undefined && value !== null && value.length > 0)
    .map(([key, value]) => `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, "+")}`);
  if (passphrase?.trim()) pairs.push(`passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`);
  return pairs.join("&");
}

function signature(fields: Record<string, string>, passphrase?: string) {
  return CryptoJS.MD5(canonical(fields, passphrase)).toString(CryptoJS.enc.Hex);
}

function equalSafe(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function ref(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

const base = () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return { url: url.replace(/\/$/, ""), key };
};

async function rest(path: string, init: RequestInit = {}) {
  const { url, key } = base();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`database_operation_failed:${response.status}:${body.slice(0, 250)}`);
  return body ? JSON.parse(body) : null;
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  const { url, key } = base();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return await response.json();
}

function sanitize(fields: Record<string, string>) {
  const safe = { ...fields };
  delete safe.merchant_key;
  delete safe.passphrase;
  delete safe.signature;
  return safe;
}

async function checkout(request: Request, body: Record<string, unknown>) {
  const user = await authenticatedUser(request);
  if (!user?.id) return json({ error: "authentication_required" }, 401);
  if (typeof user.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    return json({ error: "verified_email_required_for_payfast_checkout" }, 400);
  }

  const planCode = String(body.planCode ?? "");
  const idem = request.headers.get("idempotency-key") ?? String(body.idempotencyKey ?? "");
  if (!/^[A-Z0-9_]{3,80}$/.test(planCode) || !/^[A-Za-z0-9._:-]{8,160}$/.test(idem)) {
    return json({ error: "valid_plan_code_and_idempotency_key_required" }, 400);
  }

  const links = await rest(`candidate_auth_identity_links?select=candidate_id,link_status,verified_at&supabase_user_id=eq.${encodeURIComponent(user.id)}&link_status=eq.VERIFIED&verified_at=not.is.null&limit=2`);
  if (!Array.isArray(links) || links.length !== 1) {
    return json({ error: "verified_candidate_identity_link_required" }, 403);
  }
  const candidateId = String(links[0].candidate_id);
  const plans = await rest(`finance_plan_catalog?select=*&plan_code=eq.${encodeURIComponent(planCode)}&active=eq.true&limit=1`);
  if (!Array.isArray(plans) || plans.length !== 1) return json({ error: "active_plan_not_found" }, 404);
  const plan = plans[0];
  if (!Number.isInteger(plan.amount_cents) || plan.amount_cents <= 0 || plan.currency !== "ZAR") {
    return json({ error: "plan_not_payable_through_payfast" }, 400);
  }

  const orderRef = ref("ord");
  const invoiceRef = ref("inv");
  const intentRef = ref("pf_intent");
  const returnUrl = Deno.env.get("PAYFAST_RETURN_URL") ?? "https://kingsmen-portal-staging.netlify.app/payment/return";
  const cancelUrl = Deno.env.get("PAYFAST_CANCEL_URL") ?? "https://kingsmen-portal-staging.netlify.app/payment/cancel";
  const notifyUrl = Deno.env.get("PAYFAST_NOTIFY_URL")!;
  // Hosted checkout uses PayFast's documented merchant -> buyer -> transaction field order.
  const fields: Record<string, string> = {
    merchant_id: Deno.env.get("PAYFAST_MERCHANT_ID")!,
    merchant_key: Deno.env.get("PAYFAST_MERCHANT_KEY")!,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    email_address: user.email,
    m_payment_id: orderRef,
    amount: (Number(plan.amount_cents) / 100).toFixed(2),
    item_name: String(plan.plan_name).slice(0, 100),
    item_description: String(plan.description ?? plan.plan_name).slice(0, 255),
  };
  const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") ?? "";
  const signed = { ...fields, signature: signature(fields, passphrase) };
  const evidenceRef = ref("pay_ev");
  const bundle = await rest("rpc/create_payfast_sandbox_checkout_bundle", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({
      p_supabase_user_id: user.id,
      p_candidate_ref: candidateId,
      p_plan_code: plan.plan_code,
      p_idempotency_key: idem,
      p_order_ref: orderRef,
      p_invoice_ref: invoiceRef,
      p_intent_ref: intentRef,
      p_evidence_ref: evidenceRef,
      p_return_url: returnUrl,
      p_cancel_url: cancelUrl,
      p_notify_url: notifyUrl,
      p_signed_payload: signed,
    }),
  });
  const result = Array.isArray(bundle) ? bundle[0] : bundle;
  if (!result?.intent?.signedPayload) return json({ error: "checkout_bundle_creation_failed" }, 502);

  // JSONB sorts keys, so reconstruct the documented order on retries before resigning.
  const hostedFields = orderHostedCheckoutFields({
    ...result.intent.signedPayload,
    merchant_id: Deno.env.get("PAYFAST_MERCHANT_ID")!,
    merchant_key: Deno.env.get("PAYFAST_MERCHANT_KEY")!,
  });
  const hostedSignature = signature(hostedFields, passphrase);
  return json({
    intent: {
      intentRef: result.intent.intentRef,
      merchantReference: result.intent.merchantReference,
      paymentUrl: result.intent.paymentUrl,
      fields: hostedFields,
      signature: hostedSignature,
    },
    orderStatus: result.orderStatus,
    paymentStatus: result.paymentStatus,
    reused: result.reused === true,
    note: result.note ?? "An intent is not payment success. Only a verified provider ITN can confirm payment.",
  }, result.reused === true ? 200 : 201);
}


const HOSTED_CHECKOUT_FIELD_ORDER = [
  "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
  "name_first", "name_last", "email_address", "cell_number",
  "m_payment_id", "amount", "item_name", "item_description",
] as const;

function orderHostedCheckoutFields(payload: Record<string, unknown>): Record<string, string> {
  const ordered: Record<string, string> = {};
  for (const key of HOSTED_CHECKOUT_FIELD_ORDER) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) ordered[key] = value;
  }
  return ordered;
}

const PAYFAST_SOURCE_IPV4_RANGES = [
  { network: "197.97.145.144", prefix: 28 },
  { network: "41.74.179.192", prefix: 27 },
  { network: "102.216.36.0", prefix: 28 },
  { network: "102.216.36.128", prefix: 28 },
];
const PAYFAST_SOURCE_IPV4_EXACT = new Set(["144.126.193.139"]);

function ipv4ToUint32(address: string): number | null {
  const parts = address.trim().split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^(0|[1-9][0-9]{0,2})$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = ((value << 8) | octet) >>> 0;
  }
  return value >>> 0;
}

function isPayFastSourceIp(address: string): boolean {
  const input = ipv4ToUint32(address);
  if (input === null) return false;
  if (PAYFAST_SOURCE_IPV4_EXACT.has(address.trim())) return true;
  return PAYFAST_SOURCE_IPV4_RANGES.some(({ network, prefix }) => {
    const networkValue = ipv4ToUint32(network);
    if (networkValue === null) return false;
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (input & mask) === (networkValue & mask);
  });
}

function trustedPayFastSourceIp(request: Request): string | null {
  // The ingress proxy controls cf-connecting-ip. X-Forwarded-For/X-Real-IP
  // are caller-controllable here and therefore cannot authorize settlement.
  const address = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  return address && isPayFastSourceIp(address) ? address : null;
}

async function receiveItn(request: Request) {
  const textBody = await request.text();
  if (textBody.length > 32768) return json({ error: "payload_too_large" }, 413);
  const params = new URLSearchParams(textBody);
  const fields: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key in fields) return json({ error: "duplicate_form_field" }, 400);
    fields[key] = value;
  }
  const merchantReference = fields.m_payment_id ?? "";
  const providerPaymentId = fields.pf_payment_id ?? "";
  const paymentStatus = fields.payment_status ?? "";
  const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") ?? "";
  const expectedSignature = signature(fields, passphrase);
  const signatureValid = Boolean(fields.signature) && equalSafe(fields.signature.toLowerCase(), expectedSignature.toLowerCase());
  const sourceIp = trustedPayFastSourceIp(request);
  const ipValid = sourceIp !== null;

  let providerValid = false;
  try {
    const validationBody = new URLSearchParams(fields);
    const response = await fetch("https://sandbox.payfast.co.za/eng/query/validate", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: validationBody.toString(),
      signal: AbortSignal.timeout(8000),
    });
    providerValid = response.ok && (await response.text()).trim() === "VALID";
  } catch {
    providerValid = false;
  }

  const intents = merchantReference
    ? await rest(`payfast_payment_intents?select=*&merchant_reference=eq.${encodeURIComponent(merchantReference)}&limit=1`)
    : [];
  const intent = Array.isArray(intents) ? intents[0] : null;
  const amountCents = Math.round(Number(fields.amount_gross) * 100);
  const amountValid = Boolean(intent) && Number.isFinite(amountCents) && amountCents === Number(intent.amount_cents);
  const duplicateKey = `payfast-itn:${merchantReference}:${providerPaymentId}:${paymentStatus}`;
  const prior = await rest(`payfast_itn_receipts?select=id,itn_ref,evidence_ref,accepted,merchant_reference,provider_payment_id,payment_status,amount_gross&idempotency_key=eq.${encodeURIComponent(duplicateKey)}&accepted=eq.true&limit=1`);
  const priorReceipt = Array.isArray(prior) && prior.length === 1 ? prior[0] : null;
  const duplicate = Boolean(priorReceipt);
  const priorMatches = Boolean(priorReceipt)
    && priorReceipt.merchant_reference === merchantReference
    && String(priorReceipt.provider_payment_id ?? "") === providerPaymentId
    && String(priorReceipt.payment_status ?? "") === paymentStatus
    && Math.round(Number(priorReceipt.amount_gross) * 100) === Math.round(Number(fields.amount_gross) * 100);
  const priorAccepted = Boolean(priorReceipt?.accepted) && priorMatches;
  const merchantValid = fields.merchant_id === Deno.env.get("PAYFAST_MERCHANT_ID");
  // A replay of a previously accepted receipt is allowed to reach idempotent settlement recovery.
  // It must not create a second receipt or payment. A rejected/mismatched prior receipt stays rejected.
  const accepted = Boolean(intent) && signatureValid && providerValid && ipValid && amountValid
    && (!duplicate || priorAccepted) && paymentStatus === "COMPLETE" && merchantValid;
  const rejectionReason = accepted ? null : !intent ? "unknown_payment_reference" : !signatureValid ? "invalid_signature" : !providerValid ? "provider_validation_failed" : !ipValid ? "source_ip_not_allowlisted" : !amountValid ? "amount_mismatch" : duplicate && !priorAccepted ? "duplicate_itn" : paymentStatus !== "COMPLETE" ? "payment_not_complete" : !merchantValid ? "merchant_mismatch" : "rejected";
  const receiptRef = priorReceipt?.itn_ref ?? ref("itn");
  const receiptEvidenceRef = priorReceipt?.evidence_ref ?? ref("pay_ev");
  const safePayload = sanitize(fields);
  if (!duplicate) {
    await rest("payfast_itn_receipts", {
      method: "POST",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        itn_ref: receiptRef, merchant_reference: merchantReference, provider_payment_id: providerPaymentId || null,
        payment_status: paymentStatus || null, amount_gross: fields.amount_gross ?? null,
        amount_fee: fields.amount_fee ?? null, amount_net: fields.amount_net ?? null,
        received_payload: safePayload, received_signature: fields.signature ?? null,
        calculated_signature: expectedSignature, signature_valid: signatureValid, ip_valid: ipValid,
        amount_valid: amountValid, duplicate, accepted, rejection_reason: rejectionReason,
        idempotency_key: duplicateKey, evidence_ref: receiptEvidenceRef,
      }),
    });
  }
  await rest("payfast_signature_audit", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      audit_ref: ref("pfa"), merchant_reference: merchantReference || "unknown",
      verification_stage: "sandbox_itn", signature_valid: signatureValid,
      notes: `provider_valid=${providerValid};ip_valid=${ipValid};amount_valid=${amountValid};accepted=${accepted};reason=${rejectionReason ?? "none"}`,
    }),
  });
  if (!accepted || !intent) return new Response("INVALID", { status: 400, headers: { "content-type": "text/plain", "cache-control": "no-store" } });

  const existing = await rest(`finance_payments?select=id&provider=eq.PAYFAST&provider_payment_id=eq.${encodeURIComponent(providerPaymentId)}&limit=1`);
  if (Array.isArray(existing) && existing.length) return new Response("OK", { status: 200, headers: { "content-type": "text/plain" } });

  const paymentRef = ref("pay");
  const paymentEvidenceRef = ref("pay_ev");
  const gross = Math.round(Number(fields.amount_gross) * 100);
  const fee = Math.round(Number(fields.amount_fee ?? "0") * 100);
  const net = Math.round(Number(fields.amount_net ?? (gross - fee) / 100) * 100);
  await rest("rpc/payfast_settle_sandbox_payment", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({
      p_merchant_reference: merchantReference,
      p_provider_payment_id: providerPaymentId,
      p_amount_gross_cents: gross,
      p_amount_fee_cents: fee,
      p_amount_net_cents: net,
      p_payment_ref: paymentRef,
      p_evidence_ref: paymentEvidenceRef,
      p_receipt_ref: receiptRef,
      p_candidate_ref: String(intent.candidate_ref),
    }),
  });
  return new Response("OK", { status: 200, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method === "GET") {
    const missing = missingConfig();
    return json({
      module: "N10_PAYFAST_SANDBOX",
      environment: "sandbox",
      configuration: missing.length ? "missing_required_secrets" : "configured",
      missingKeys: missing,
      livePaymentsEnabled: false,
      productionReady: false,
      realTransactionProven: false,
    }, missing.length ? 503 : 200);
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const missing = missingConfig();
  if (missing.length) return json({ error: "payfast_sandbox_not_configured", missingKeys: missing }, 503);
  const path = new URL(request.url).searchParams.get("action");
  if (path === "itn") return await receiveItn(request);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_json_body" }, 400);
  return await checkout(request, body as Record<string, unknown>);
});
