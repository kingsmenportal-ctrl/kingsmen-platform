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
  const planCode = String(body.planCode ?? "");
  const idem = request.headers.get("idempotency-key") ?? String(body.idempotencyKey ?? "");
  if (!/^[A-Z0-9_]{3,80}$/.test(planCode) || !/^[A-Za-z0-9._:-]{8,160}$/.test(idem)) {
    return json({ error: "valid_plan_code_and_idempotency_key_required" }, 400);
  }

  const links = await rest(`candidate_auth_identity_links?select=candidate_id,link_status&supabase_user_id=eq.${encodeURIComponent(user.id)}&link_status=eq.VERIFIED&limit=2`);
  if (!Array.isArray(links) || links.length !== 1) {
    return json({ error: "verified_candidate_identity_link_required" }, 403);
  }
  const candidateId = links[0].candidate_id;
  const plans = await rest(`finance_plan_catalog?select=*&plan_code=eq.${encodeURIComponent(planCode)}&active=eq.true&limit=1`);
  if (!Array.isArray(plans) || plans.length !== 1) return json({ error: "active_plan_not_found" }, 404);
  const plan = plans[0];
  if (!Number.isInteger(plan.amount_cents) || plan.amount_cents <= 0 || plan.currency !== "ZAR") {
    return json({ error: "plan_not_payable_through_payfast" }, 400);
  }

  const existing = await rest(`payfast_payment_intents?select=intent_ref,merchant_reference,payment_url,signed_payload,intent_status,idempotency_key&candidate_ref=eq.${encodeURIComponent(candidateId)}&idempotency_key=eq.${encodeURIComponent(idem)}&limit=1`);
  if (Array.isArray(existing) && existing.length) {
    return json({ intent: existing[0], reused: true });
  }

  const orderRef = ref("ord");
  const invoiceRef = ref("inv");
  const intentRef = ref("pf_intent");
  const merchantReference = orderRef;
  const amount = (Number(plan.amount_cents) / 100).toFixed(2);
  const environment = "sandbox";
  const notifyUrl = Deno.env.get("PAYFAST_NOTIFY_URL")!;
  const returnUrl = Deno.env.get("PAYFAST_RETURN_URL") ?? "https://kingsmen-portal-staging.netlify.app/payment/return";
  const cancelUrl = Deno.env.get("PAYFAST_CANCEL_URL") ?? "https://kingsmen-portal-staging.netlify.app/payment/cancel";
  const fields: Record<string, string> = {
    merchant_id: Deno.env.get("PAYFAST_MERCHANT_ID")!,
    merchant_key: Deno.env.get("PAYFAST_MERCHANT_KEY")!,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    m_payment_id: merchantReference,
    amount,
    item_name: String(plan.plan_name).slice(0, 100),
    item_description: String(plan.description ?? plan.plan_name).slice(0, 255),
    email_address: String(user.email ?? ""),
  };
  const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") ?? "";
  const signed = { ...fields, signature: signature(fields, passphrase) };
  const entitlement = {
    plan_code: plan.plan_code,
    plan_name: plan.plan_name,
    amount_cents: plan.amount_cents,
    currency: "ZAR",
    catalogue_version: plan.catalogue_version,
    managed_application_count: plan.managed_application_count,
    accommodation_route_count: plan.accommodation_route_count,
    cv_versions: plan.cv_versions,
    motivation_letters: plan.motivation_letters,
    service_scope: plan.service_scope,
    refund_policy_version: plan.refund_policy_version,
  };

  await rest("finance_orders", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      order_ref: orderRef, candidate_ref: candidateId, plan_code: plan.plan_code,
      order_status: "PENDING_PAYMENT", amount_cents: plan.amount_cents, currency: "ZAR",
      catalogue_version: plan.catalogue_version, service_term_days: plan.service_term_days,
      managed_application_count: plan.managed_application_count, accommodation_route_count: plan.accommodation_route_count,
      cv_versions: plan.cv_versions, motivation_letters: plan.motivation_letters,
      acknowledgement_target_business_hours: plan.acknowledgement_target_business_hours,
      first_response_target_business_hours: plan.first_response_target_business_hours,
      upgrade_bonus_routes: plan.upgrade_bonus_routes_when_cv_revamp_owned ?? 0,
      refund_policy_version: plan.refund_policy_version, service_scope: plan.service_scope,
      entitlement_snapshot: entitlement,
    }),
  });
  await rest("finance_invoices", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      invoice_ref: invoiceRef, order_ref: orderRef, candidate_ref: candidateId,
      invoice_status: "OPEN", amount_cents: plan.amount_cents, currency: "ZAR",
    }),
  });
  await rest("payfast_payment_intents", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      intent_ref: intentRef, order_ref: orderRef, invoice_ref: invoiceRef, candidate_ref: candidateId,
      merchant_reference: merchantReference, amount_cents: plan.amount_cents, currency: "ZAR",
      item_name: plan.plan_name, item_description: plan.description, return_url: returnUrl,
      cancel_url: cancelUrl, notify_url: notifyUrl, payfast_environment: environment,
      payment_url: "https://sandbox.payfast.co.za/eng/process", signed_payload: signed,
      signature: signed.signature, intent_status: "CREATED", idempotency_key: idem,
    }),
  });
  const evidenceRef = ref("pay_ev");
  await rest("payment_evidence_ledger", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({
      evidence_ref: evidenceRef, source_type: "payfast_intent", source_ref: intentRef,
      candidate_ref: candidateId, order_ref: orderRef, event_name: "PAYFAST_SANDBOX_INTENT_CREATED",
      event_summary: "Sandbox checkout intent created; not proof of payment.",
      proof_payload: { environment, amountCents: plan.amount_cents, currency: "ZAR", secretsReturned: false },
    }),
  });
  return json({
    intent: { intentRef, merchantReference, paymentUrl: "https://sandbox.payfast.co.za/eng/process", fields: sanitize(signed), signature: signed.signature },
    orderStatus: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    note: "A checkout intent is not payment success. Only a verified provider ITN can confirm payment.",
  }, 201);
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
  // Supabase Edge Function request headers are not treated as trusted proof of the PayFast source IP.
  // Provider-side VALID response, signature, configured merchant, amount, status, and replay checks gate settlement.
  const ipValid = false;

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
  const prior = await rest(`payfast_itn_receipts?select=id,itn_ref,evidence_ref,accepted,merchant_reference,provider_payment_id,payment_status,amount_gross&idempotency_key=eq.${encodeURIComponent(duplicateKey)}&limit=1`);
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
  const accepted = Boolean(intent) && signatureValid && providerValid && amountValid
    && (!duplicate || priorAccepted) && paymentStatus === "COMPLETE" && merchantValid;
  const rejectionReason = accepted ? null : !intent ? "unknown_payment_reference" : !signatureValid ? "invalid_signature" : !providerValid ? "provider_validation_failed" : !amountValid ? "amount_mismatch" : duplicate && !priorAccepted ? "duplicate_itn" : paymentStatus !== "COMPLETE" ? "payment_not_complete" : !merchantValid ? "merchant_mismatch" : "rejected";
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
