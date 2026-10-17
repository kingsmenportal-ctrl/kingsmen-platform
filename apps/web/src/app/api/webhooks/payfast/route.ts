import { getPayFastRuntime, isTrustedPayFastItnSource, randToMinor, sha256Hex, validatePayFastItnAtProvider, verifyPayFastItnSignature } from "../../../../lib/payfast-runtime";

const response = (status: number, body: string) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

export async function POST(request: Request) {
  const runtime = getPayFastRuntime();
  if (!runtime) return response(503, "PAYFAST_NOT_CONFIGURED");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
    return response(415, "FORM_URLENCODED_REQUIRED");
  }
  if (!isTrustedPayFastItnSource(request, runtime)) return response(403, "UNTRUSTED_ITN_SOURCE");

  let rawBody: string;
  try { rawBody = await request.text(); } catch { return response(400, "INVALID_BODY"); }
  if (!rawBody || rawBody.length > 65536) return response(413, "ITN_BODY_SIZE_INVALID");

  const params = new URLSearchParams(rawBody);
  const fields: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) return response(400, "DUPLICATE_ITN_FIELD");
    fields[key] = value;
  }
  if (params.getAll("signature").length !== 1 || params.keys().next().done) return response(400, "ITN_SIGNATURE_REQUIRED");
  if (Array.from(params.keys()).at(-1) !== "signature") return response(400, "ITN_SIGNATURE_MUST_BE_LAST");
  if (fields.merchant_id !== runtime.merchantId) return response(400, "MERCHANT_MISMATCH");
  if (!verifyPayFastItnSignature(fields, runtime.passphrase)) return response(400, "INVALID_SIGNATURE");
  if (fields.payment_status !== "COMPLETE") return response(200, "IGNORED_NON_COMPLETE");
  const merchantReference = (fields.m_payment_id || "").trim();
  const providerPaymentId = (fields.pf_payment_id || "").trim();
  const amountMinor = randToMinor(fields.amount_gross || "");
  if (!merchantReference || !providerPaymentId || amountMinor === null || amountMinor < 500) {
    return response(400, "PAYMENT_FIELDS_INVALID");
  }

  // PayFast's server confirmation is mandatory; a valid-looking browser return is not payment proof.
  const serverValidationBody = rawBody.split("&").slice(0, -1).join("&");
  if (!serverValidationBody || !(await validatePayFastItnAtProvider(serverValidationBody, runtime.environment))) return response(502, "PROVIDER_VALIDATION_FAILED");

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)?.trim();
  if (!supabaseUrl || !serviceRoleKey) return response(503, "PAYMENT_PERSISTENCE_NOT_CONFIGURED");

  try {
    const orderUrl = new URL(supabaseUrl + "/rest/v1/candidate_service_orders");
    orderUrl.searchParams.set("select", "id,order_ref,candidate_id,amount_minor,currency,status");
    orderUrl.searchParams.set("order_ref", "eq." + merchantReference);
    orderUrl.searchParams.set("limit", "2");
    const orderResponse = await fetch(orderUrl, {
      headers: { apikey: serviceRoleKey, authorization: "Bearer " + serviceRoleKey, accept: "application/json" },
      cache: "no-store"
    });
    if (!orderResponse.ok) return response(502, "ORDER_LOOKUP_FAILED");
    const orders = await orderResponse.json() as Array<{ id: string; order_ref: string; candidate_id: string; amount_minor: number; currency: string; status: string }>;
    if (!Array.isArray(orders) || orders.length !== 1) return response(404, "ORDER_NOT_FOUND");
    const order = orders[0];
    if (order.order_ref !== merchantReference || order.currency !== "ZAR" || Number(order.amount_minor) !== amountMinor) {
      return response(409, "ORDER_AMOUNT_OR_CURRENCY_MISMATCH");
    }

    const rpcResponse = await fetch(supabaseUrl + "/rest/v1/rpc/n10_record_verified_payfast_payment", {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        authorization: "Bearer " + serviceRoleKey,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        p_order_id: order.id,
        p_merchant_reference: merchantReference,
        p_provider_payment_id: providerPaymentId,
        p_amount_minor: amountMinor,
        p_payload_sha256: sha256Hex(rawBody),
        p_idempotency_key: "payfast-itn:" + providerPaymentId + ":COMPLETE",
        p_server_validation: "VALID"
      }),
      cache: "no-store"
    });
    if (!rpcResponse.ok) return response(502, "PAYMENT_EVENT_PERSISTENCE_FAILED");
    const result = await rpcResponse.json().catch(() => null);
    if (!Array.isArray(result) || result.length !== 1 || result[0]?.order_status !== "PAID" || typeof result[0]?.payment_event_id !== "string") {
      return response(502, "PAYMENT_CONFIRMATION_UNCERTAIN");
    }

    // N11 is deliberately downstream of the committed N10 payment event. If this fails,
    // the ITN may retry; N10 payment persistence and N11 grant are both idempotent.
    const grantResponse = await fetch(supabaseUrl + "/rest/v1/rpc/n11_grant_entitlement", {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        authorization: "Bearer " + serviceRoleKey,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        p_order_id: order.id,
        p_financial_event_id: result[0].payment_event_id,
        p_actor_type: "SYSTEM",
        p_actor_auth_user_id: null,
        p_reason: "PayFast signature, trusted source and server confirmation passed; payment was atomically recorded.",
        p_idempotency_key: "n11-grant:" + order.id + ":" + providerPaymentId
      }),
      cache: "no-store"
    });
    if (!grantResponse.ok) return response(502, "ENTITLEMENT_ACTIVATION_PENDING");
    const grantResult = await grantResponse.json().catch(() => null);
    const grantId = typeof grantResult === "string" ? grantResult :
      Array.isArray(grantResult) && typeof grantResult[0] === "string" ? grantResult[0] : null;
    if (!grantId) return response(502, "ENTITLEMENT_ACTIVATION_UNCERTAIN");
    return response(200, "OK");
  } catch {
    return response(503, "PAYMENT_CONFIRMATION_UNAVAILABLE");
  }
}
