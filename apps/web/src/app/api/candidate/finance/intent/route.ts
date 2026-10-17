import { randomUUID, createHash } from "node:crypto";
import { requireCandidateSession, supabaseAdminFetch } from "../../../../../../lib/candidate-document-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store", pragma: "no-cache" } });
type Row = Record<string, unknown>;

function safeHttps(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
function payFastEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*~]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, '+');
}
function signatureFor(fields: Record<string, string>, passphrase: string) {
  const canonical = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && key !== "passphrase" && value !== "")
    .map(([key, value]) => `${key}=${payFastEncode(value.trim())}`);
  if (passphrase) canonical.push(`passphrase=${payFastEncode(passphrase.trim())}`);
  return createHash("md5").update(canonical.join("&")).digest("hex");
}

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { planCode?: unknown } | null;
  const planCode = typeof body?.planCode === "string" ? body.planCode.trim() : "";
  const clientKey = request.headers.get("idempotency-key")?.trim() || "";
  if (!planCode || planCode.length > 80 || clientKey.length < 8 || clientKey.length > 160) {
    return json({ ok: false, code: "INVALID_PAYMENT_REQUEST", error: "A plan code and stable Idempotency-Key header (8–160 characters) are required." }, 400);
  }

  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim();
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const notifyUrl = process.env.PAYFAST_ITN_URL?.trim() || "";
  const returnUrl = process.env.PAYFAST_RETURN_URL?.trim() || "";
  const cancelUrl = process.env.PAYFAST_CANCEL_URL?.trim() || "";
  const environment = process.env.PAYFAST_ENVIRONMENT === "live" ? "live" : "sandbox";
  if (!merchantId || !merchantKey || passphrase === undefined || !safeHttps(notifyUrl) || !safeHttps(returnUrl) || !safeHttps(cancelUrl)) {
    return json({ ok: false, code: "PAYFAST_INTENT_RUNTIME_NOT_CONFIGURED", error: "Configure server-only PayFast merchant credentials and HTTPS ITN/return/cancel URLs before creating payment intents." }, 503);
  }
  if (environment === "live" && process.env.PAYFAST_ENABLE_LIVE_PAYMENTS !== "true") {
    return json({ ok: false, code: "LIVE_PAYMENTS_DISABLED", error: "Live payment creation remains disabled until PAYFAST_ENABLE_LIVE_PAYMENTS=true is deliberately configured." }, 503);
  }

  const candidateUrl = new URL(`${auth.config.url}/rest/v1/candidates`);
  candidateUrl.searchParams.set("select", "id,public_ref,email,display_name");
  candidateUrl.searchParams.set("id", `eq.${auth.session.candidateId}`);
  candidateUrl.searchParams.set("limit", "1");
  const planUrl = new URL(`${auth.config.url}/rest/v1/finance_plan_catalog`);
  planUrl.searchParams.set("select", "plan_code,plan_name,description,amount_cents,currency,active");
  planUrl.searchParams.set("plan_code", `eq.${planCode}`);
  planUrl.searchParams.set("active", "eq.true");
  planUrl.searchParams.set("limit", "1");
  const [candidateResponse, planResponse] = await Promise.all([
    supabaseAdminFetch(auth.config, `/rest/v1/candidates?${candidateUrl.searchParams}`).catch(() => null),
    supabaseAdminFetch(auth.config, `/rest/v1/finance_plan_catalog?${planUrl.searchParams}`).catch(() => null)
  ]);
  if (!candidateResponse || !planResponse) return json({ ok: false, code: "FINANCE_LOOKUP_UNAVAILABLE", error: "Candidate or plan records could not be reached." }, 503);
  if (!candidateResponse.ok || !planResponse.ok) return json({ ok: false, code: "FINANCE_LOOKUP_FAILED", error: "Candidate or plan records could not be loaded." }, 502);
  const [candidateRows, planRows] = await Promise.all([candidateResponse.json().catch(() => null), planResponse.json().catch(() => null)]) as [Row[] | null, Row[] | null];
  if (!Array.isArray(candidateRows) || candidateRows.length !== 1 || !Array.isArray(planRows) || planRows.length !== 1) return json({ ok: false, code: "CANDIDATE_OR_PLAN_NOT_FOUND", error: "A unique active candidate and active plan are required." }, 404);
  const candidate = candidateRows[0];
  const plan = planRows[0];
  const amountCents = Number(plan.amount_cents);
  const currency = String(plan.currency || "ZAR").toUpperCase();
  if (!candidate.public_ref || !candidate.email || !Number.isSafeInteger(amountCents) || amountCents <= 0 || currency !== "ZAR") {
    return json({ ok: false, code: "PLAN_NOT_PAYABLE", error: "This plan is free, invalid, or uses an unsupported currency; no PayFast intent was created." }, 409);
  }

  const orderRef = `KMORD-${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;
  const invoiceRef = `KMINV-${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;
  const intentRef = `pf_intent_${randomUUID()}`;
  const paymentUrl = environment === "live" ? "https://www.payfast.co.za/eng/process" : "https://sandbox.payfast.co.za/eng/process";
  const fields: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    m_payment_id: orderRef,
    amount: (amountCents / 100).toFixed(2),
    item_name: String(plan.plan_name),
    item_description: String(plan.description),
    email_address: String(candidate.email),
    name_first: String(candidate.display_name || "")
  };
  const signature = signatureFor(fields, passphrase);
  const signedPayload = { ...fields, signature };
  const idempotencyKey = `candidate:${auth.session.userId}:${createHash("sha256").update(clientKey).digest("hex")}`;

  const rpc = await supabaseAdminFetch(auth.config, "/rest/v1/rpc/create_payfast_payment_intent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      p_auth_user_id: auth.session.userId,
      p_candidate_ref: String(candidate.public_ref),
      p_plan_code: planCode,
      p_idempotency_key: idempotencyKey,
      p_order_ref: orderRef,
      p_invoice_ref: invoiceRef,
      p_intent_ref: intentRef,
      p_amount_cents: amountCents,
      p_currency: currency,
      p_item_name: String(plan.plan_name),
      p_item_description: String(plan.description),
      p_return_url: returnUrl,
      p_cancel_url: cancelUrl,
      p_notify_url: notifyUrl,
      p_environment: environment,
      p_payment_url: paymentUrl,
      p_signed_payload: signedPayload,
      p_signature: signature
    })
  }).catch(() => null);
  if (!rpc) return json({ ok: false, code: "PAYMENT_INTENT_UNAVAILABLE", error: "Payment intent could not be saved. No redirect was issued." }, 503);
  if (!rpc.ok) return json({ ok: false, code: "PAYMENT_INTENT_REJECTED", error: "The database rejected the payment intent. Confirm migration 0064, active plan pricing, and verified candidate identity." }, 502);
  const result = await rpc.json().catch(() => null) as Record<string, unknown> | null;
  if (!result || result.ok !== true || typeof result.paymentUrl !== "string" || !result.signedPayload || typeof result.orderRef !== "string") {
    return json({ ok: false, code: "PAYMENT_INTENT_UNCONFIRMED", error: "The database did not confirm a complete signed payment intent." }, 502);
  }
  return json({ ok: true, ...result, amountCents, currency, message: result.replayed ? "Existing idempotent payment intent returned." : "Order, invoice, payment intent and initial ledger evidence were created." }, 201);
}
