import type { IncomingMessage, ServerResponse } from "node:http";
import { processPayFastCallback } from "./payfast-callback";
import { SupabasePaymentCallbackStore } from "./supabase-payment-store";

const MAX_ITN_BYTES = 16_384;

function send(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

async function readRawBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_ITN_BYTES) throw new Error("PAYFAST_BODY_TOO_LARGE");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function callbackConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID ?? "";
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
  const environment = process.env.PAYFAST_ENVIRONMENT;
  if (!merchantId || !passphrase || (environment !== "sandbox" && environment !== "live")) {
    throw new Error("PAYFAST_NOT_CONFIGURED");
  }
  return { merchantId, passphrase, environment };
}

/**
 * Public provider callback route: security comes from signature + fixed-host
 * server confirmation + trusted invoice lookup + transactional commit. It must
 * never be protected by the portal's shared service token, nor accept JSON.
 */
export async function handlePayFastWebhook(
  request: IncomingMessage,
  response: ServerResponse,
  fetcher: typeof fetch = fetch
): Promise<boolean> {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname !== "/api/webhooks/payfast/itn") return false;
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    send(response, 405, { ok: false, code: "METHOD_NOT_ALLOWED" });
    return true;
  }
  const contentType = (request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/x-www-form-urlencoded") {
    send(response, 415, { ok: false, code: "PAYFAST_FORM_CONTENT_TYPE_REQUIRED" });
    return true;
  }

  try {
    const rawBody = await readRawBody(request);
    const result = await processPayFastCallback(rawBody, callbackConfig(), new SupabasePaymentCallbackStore(), fetcher);
    // Acknowledgement is emitted only after the database RPC confirms transaction commit.
    send(response, result.status, result.body);
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYFAST_CALLBACK_FAILED";
    const clientErrors = new Set([
      "PAYFAST_BODY_TOO_LARGE", "PAYFAST_DUPLICATE_PARAMETER", "PAYFAST_SIGNATURE_MISSING",
      "PAYFAST_PAYMENT_REFERENCE_INVALID", "PAYFAST_INVOICE_NOT_FOUND", "PAYFAST_CURRENCY_UNSUPPORTED",
      "PAYFAST_INVOICE_NOT_PAYABLE", "PAYFAST_SIGNATURE_INVALID", "PAYFAST_PROVIDER_PAYMENT_ID_INVALID",
      "PAYFAST_MERCHANT_MISMATCH", "PAYFAST_STATUS_INVALID", "PAYFAST_AMOUNT_MISMATCH"
    ]);
    const unavailable = new Set([
      "PAYFAST_NOT_CONFIGURED", "PAYFAST_CONFIRMATION_UNAVAILABLE", "PAYFAST_CONFIRMATION_HTTP_ERROR",
      "PAYMENT_DATABASE_NOT_CONFIGURED", "PAYMENT_DATABASE_URL_INVALID",
      "PAYMENT_DATABASE_SCHEMA_NOT_READY", "PAYMENT_DATABASE_UNAVAILABLE", "PAYMENT_DATABASE_WRITE_FAILED"
    ]);
    // Do not return raw provider or SQL error text; expose only a stable code.
    const status = clientErrors.has(code) ? 400 : unavailable.has(code) ? 503 : 500;
    send(response, status, { ok: false, code: clientErrors.has(code) || unavailable.has(code) ? code : "PAYFAST_CALLBACK_FAILED" });
  }
  return true;
}
