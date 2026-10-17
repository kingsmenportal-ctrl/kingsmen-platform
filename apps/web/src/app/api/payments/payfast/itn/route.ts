import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store", pragma: "no-cache" };
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: noStore });

function canonicalPayFast(params: URLSearchParams, passphrase: string) {
  const entries: string[] = [];
  for (const [key, raw] of params.entries()) {
    if (["signature", "merchant_key", "passphrase"].includes(key) || raw === "") continue;
    entries.push(`${key}=${encodeURIComponent(raw.trim()).replace(/%20/g, "+")}`);
  }
  if (passphrase) entries.push(`passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`);
  return entries.join("&");
}

function validSignature(canonical: string, received: string) {
  if (!/^[a-f0-9]{32}$/i.test(received)) return false;
  const calculated = createHash("md5").update(canonical).digest("hex");
  const left = Buffer.from(calculated.toLowerCase(), "hex");
  const right = Buffer.from(received.toLowerCase(), "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function getAllowedIps() {
  return new Set((process.env.PAYFAST_ITN_ALLOWED_IPS || "").split(",").map(v => v.trim()).filter(Boolean));
}

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim();
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  if (!url || !anonKey || !serviceKey || !merchantId || passphrase === undefined) {
    return json({ ok: false, code: "PAYFAST_RUNTIME_NOT_CONFIGURED", error: "PayFast callback processing requires Supabase server credentials, merchant ID, passphrase, and the private ITN IP allowlist." }, 503);
  }
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
    return json({ ok: false, code: "INVALID_ITN_CONTENT_TYPE", error: "PayFast ITN must be form-encoded." }, 415);
  }
  const rawBody = await request.text();
  if (!rawBody || rawBody.length > 65536) return json({ ok: false, code: "INVALID_ITN_BODY", error: "ITN body is empty or exceeds 64 KiB." }, 413);
  const params = new URLSearchParams(rawBody);
  const fields: Record<string, string> = {};
  let duplicateField = false;
  for (const [key, value] of params.entries()) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) duplicateField = true;
    fields[key] = value;
  }
  const receivedSignature = fields.signature || "";
  const canonical = canonicalPayFast(params, passphrase);
  const signatureValid = !duplicateField && validSignature(canonical, receivedSignature);
  const merchantValid = fields.merchant_id === merchantId;
  const sourceIp = request.headers.get("x-nf-client-connection-ip")?.trim() || "";
  const allowedIps = getAllowedIps();
  const ipValid = Boolean(sourceIp && allowedIps.size > 0 && allowedIps.has(sourceIp));

  const merchantReference = fields.m_payment_id || "";
  const intentUrl = new URL(`${url}/rest/v1/payfast_payment_intents`);
  intentUrl.searchParams.set("select", "merchant_reference,amount_cents,currency,payfast_environment");
  intentUrl.searchParams.set("merchant_reference", `eq.${merchantReference}`);
  intentUrl.searchParams.set("limit", "1");
  const serviceHeaders = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, accept: "application/json" };
  let intentResponse: Response;
  try { intentResponse = await fetch(intentUrl, { headers: serviceHeaders, cache: "no-store" }); }
  catch { return json({ ok: false, code: "PAYFAST_INTENT_LOOKUP_UNAVAILABLE", error: "Payment intent could not be checked. Provider status was not changed." }, 503); }
  if (!intentResponse.ok) return json({ ok: false, code: "PAYFAST_INTENT_LOOKUP_FAILED", error: "Payment intent lookup failed. Provider status was not changed." }, 503);
  const intentRows = await intentResponse.json().catch(() => null) as Array<{ payfast_environment?: string }> | null;
  if (!Array.isArray(intentRows)) return json({ ok: false, code: "PAYFAST_INTENT_LOOKUP_INVALID", error: "Payment intent lookup returned invalid data." }, 502);
  const environment = intentRows[0]?.payfast_environment === "live" ? "live" : "sandbox";
  const validationUrl = environment === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";
  let providerValidation = "UNAVAILABLE";
  try {
    const validationResponse = await fetch(validationUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: rawBody,
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });
    providerValidation = validationResponse.ok && (await validationResponse.text()).trim() === "VALID" ? "VALID" : "INVALID";
  } catch {
    providerValidation = "UNAVAILABLE";
  }

  const safePayload: Record<string, string> = {};
  for (const key of ["merchant_id","m_payment_id","pf_payment_id","payment_status","amount_gross","amount_fee","amount_net","currency","item_name","custom_str1","custom_str2"]) {
    if (typeof fields[key] === "string") safePayload[key] = fields[key];
  }
  const calculatedSignature = createHash("md5").update(canonical).digest("hex");
  const canonicalHash = createHash("sha256").update(canonical).digest("hex");
  let rpcResponse: Response;
  try {
    rpcResponse = await fetch(`${url}/rest/v1/rpc/process_payfast_itn`, {
      method: "POST",
      headers: { ...serviceHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        p_payload: safePayload,
        p_signature_valid: signatureValid,
        p_merchant_valid: merchantValid,
        p_ip_valid: ipValid,
        p_provider_validation: providerValidation,
        p_source_ip: sourceIp || null,
        p_received_signature: receivedSignature || null,
        p_calculated_signature: calculatedSignature,
        p_canonical_hash: canonicalHash
      }),
      cache: "no-store"
    });
  } catch {
    return json({ ok: false, code: "PAYFAST_RECONCILIATION_UNAVAILABLE", error: "The verified callback could not be durably recorded. Provider status was not changed." }, 503);
  }
  if (!rpcResponse.ok) return json({ ok: false, code: "PAYFAST_RECONCILIATION_FAILED", error: "The database did not confirm the ITN receipt and reconciliation transaction." }, 503);
  const result = await rpcResponse.json().catch(() => null) as Record<string, unknown> | null;
  if (!result || result.ok !== true) return json({ ok: false, code: "PAYFAST_RECONCILIATION_UNCONFIRMED", error: "The database did not confirm the ITN processing result." }, 503);

  if (result.accepted === true || result.duplicate === true || result.failureRecorded === true) {
    return new Response("OK", { status: 200, headers: { ...noStore, "content-type": "text/plain; charset=utf-8" } });
  }
  if (result.retryable === true || providerValidation === "UNAVAILABLE") {
    return json({ ok: false, code: "PAYFAST_ITN_RETRYABLE", error: "Provider validation was unavailable; the rejected attempt was recorded and may be retried." }, 503);
  }
  return json({ ok: false, code: "PAYFAST_ITN_REJECTED", error: typeof result.rejectionReason === "string" ? result.rejectionReason : "ITN validation failed." }, 400);
}
