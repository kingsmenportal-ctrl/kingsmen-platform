import { randomUUID } from "node:crypto";
import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";
import { createPayFastItnSignature, getPayFastRuntime, payFastProcessUrl } from "../../../../../lib/payfast-runtime";

const fail = (status: number, code: string, error: string) =>
  Response.json({ ok: false, productionReady: false, code, error }, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });

const centsToRand = (cents: number) => (cents / 100).toFixed(2);

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return fail(auth.status, auth.code, auth.message);
  const runtime = getPayFastRuntime();
  if (!runtime) return fail(503, "PAYFAST_NOT_CONFIGURED", "PayFast credentials, callback URLs and ITN source CIDRs are not configured.");

  let input: unknown;
  try { input = await request.json(); } catch { return fail(400, "INVALID_JSON", "Send valid JSON."); }
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return fail(400, "ORDER_ID_REQUIRED", "A valid order ID is required.");

  try {
    const orderUrl = new URL(auth.config.url + "/rest/v1/candidate_service_orders");
    orderUrl.searchParams.set("select", "id,order_ref,candidate_id,package_code,package_name,currency,amount_minor,status");
    orderUrl.searchParams.set("id", "eq." + orderId);
    orderUrl.searchParams.set("candidate_id", "eq." + auth.session.candidateId);
    orderUrl.searchParams.set("limit", "2");
    const orderResponse = await supabaseAdminFetch(auth.config, orderUrl.pathname + orderUrl.search);
    if (!orderResponse.ok) return fail(502, "ORDER_LOOKUP_FAILED", "Order could not be loaded.");
    const orders = await orderResponse.json() as Array<Record<string, unknown>>;
    if (!Array.isArray(orders) || orders.length !== 1) return fail(404, "ORDER_NOT_FOUND", "Order does not belong to the signed-in candidate.");
    const order = orders[0];
    if (order.currency !== "ZAR" || !Number.isSafeInteger(Number(order.amount_minor)) || Number(order.amount_minor) < 500) {
      return fail(409, "ORDER_AMOUNT_INVALID", "PayFast checkout requires a positive ZAR order of at least R5.00.");
    }
    if (order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_FAILED") {
      return fail(409, "ORDER_STATE_BLOCKED", "Only pending or failed payment orders can start checkout.");
    }

    const candidateUrl = new URL(auth.config.url + "/rest/v1/candidates");
    candidateUrl.searchParams.set("select", "email,display_name");
    candidateUrl.searchParams.set("id", "eq." + auth.session.candidateId);
    candidateUrl.searchParams.set("limit", "2");
    const candidateResponse = await supabaseAdminFetch(auth.config, candidateUrl.pathname + candidateUrl.search);
    if (!candidateResponse.ok) return fail(502, "CANDIDATE_LOOKUP_FAILED", "Candidate contact details could not be loaded.");
    const candidates = await candidateResponse.json() as Array<{ email?: string; display_name?: string }>;
    if (!Array.isArray(candidates) || candidates.length !== 1 || !candidates[0].email) {
      return fail(409, "CANDIDATE_EMAIL_REQUIRED", "A verified candidate contact email is required before checkout.");
    }

    const fields: Record<string, string> = {
      merchant_id: runtime.merchantId,
      merchant_key: runtime.merchantKey,
      return_url: runtime.returnUrl,
      cancel_url: runtime.cancelUrl,
      notify_url: runtime.notifyUrl,
      m_payment_id: String(order.order_ref),
      amount: centsToRand(Number(order.amount_minor)),
      item_name: String(order.package_name).slice(0, 100),
      item_description: ("Kingsmen service package " + String(order.package_code)).slice(0, 255),
      email_address: candidates[0].email
    };
    const displayName = (candidates[0].display_name || "").trim();
    if (displayName) fields.name_first = displayName.split(/\s+/)[0].slice(0, 100);
    fields.signature = createPayFastItnSignature(fields, runtime.passphrase);

    const initiation = await supabaseAdminFetch(auth.config, "/rest/v1/candidate_payment_events?on_conflict=idempotency_key", {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        event_ref: "KMPAYEVT-" + randomUUID(),
        order_id: order.id,
        candidate_id: order.candidate_id,
        event_type: "PAYMENT_INITIATION_REQUESTED",
        source: "SYSTEM",
        amount_minor: order.amount_minor,
        provider: "PAYFAST",
        provider_reference: order.order_ref,
        idempotency_key: "payfast-intent:" + order.id,
        metadata: { environment: runtime.environment, checkout_url: payFastProcessUrl(runtime.environment) }
      })
    });
    if (!initiation.ok) return fail(502, "PAYMENT_INITIATION_AUDIT_FAILED", "Checkout could not be safely recorded; no payment form was issued.");

    return Response.json({
      ok: true,
      productionReady: false,
      provider: "PAYFAST",
      environment: runtime.environment,
      paymentUrl: payFastProcessUrl(runtime.environment),
      fields,
      orderReference: order.order_ref,
      amount: fields.amount,
      currency: "ZAR",
      message: "Submit these fields to the returned PayFast payment URL. Activation still requires a server-validated ITN."
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return fail(503, "PAYFAST_CHECKOUT_UNAVAILABLE", "PayFast checkout could not be prepared. No payment was taken.");
  }
}
