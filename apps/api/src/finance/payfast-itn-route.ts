import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randToCents } from "./money";
import { validatePayFastItn } from "./payfast-itn";
import type { PayFastFields } from "./payfast-signature";

type QueryResult<T> = { rows: T[]; rowCount: number | null };
type Client = {
  query<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<QueryResult<T>>;
  release(): void;
};
type Pool = { connect(): Promise<Client> };
type PoolCtor = new (options: Record<string, unknown>) => Pool;

let sharedPool: Pool | undefined;
function getPool(): Pool {
  if (sharedPool) return sharedPool;
  const databaseUrl = process.env.KINGSMEN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("FINANCE_DATABASE_NOT_CONFIGURED");
  const pg = require("pg") as { Pool: PoolCtor };
  sharedPool = new pg.Pool({
    connectionString: databaseUrl,
    max: 4,
    connectionTimeoutMillis: 5000,
    ssl: process.env.KINGSMEN_DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined
  });
  return sharedPool;
}

function send(response: ServerResponse, status: number, body: string): void {
  response.statusCode = status;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(body);
}

function parseFields(body: string): PayFastFields {
  const params = new URLSearchParams(body);
  const fields: PayFastFields = {};
  for (const [key, value] of params.entries()) {
    // Reject duplicate keys rather than allowing ambiguous signature inputs.
    if (Object.hasOwn(fields, key)) throw new Error("DUPLICATE_ITN_FIELD");
    fields[key] = value;
  }
  return fields;
}

async function readForm(request: IncomingMessage): Promise<string> {
  let body = "";
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 64 * 1024) throw new Error("ITN_BODY_TOO_LARGE");
    body += buffer.toString("utf8");
  }
  return body;
}

/**
 * Minimal fail-closed ITN receiver. It intentionally does not activate entitlements:
 * provider server-confirmation, schema migration, and production evidence are separate gates.
 */
export async function handlePayFastItn(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    send(response, 405, "Method not allowed");
    return;
  }

  let fields: PayFastFields;
  try {
    const contentType = String(request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
    if (contentType !== "application/x-www-form-urlencoded") {
      send(response, 415, "Unsupported media type");
      return;
    }
    fields = parseFields(await readForm(request));
  } catch (error) {
    send(response, error instanceof Error && error.message === "ITN_BODY_TOO_LARGE" ? 413 : 400, "Invalid ITN request");
    return;
  }

  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const allowedSourceIps = process.env.PAYFAST_ALLOWED_SOURCE_IPS;
  if (!merchantId || !passphrase || !allowedSourceIps) {
    send(response, 503, "Payment notifications are not configured");
    return;
  }
  if (String(fields.merchant_id ?? "") !== merchantId) {
    send(response, 400, "Invalid merchant");
    return;
  }

  let client: Client | undefined;
  try {
    const pool = getPool();
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

    const merchantReference = String(fields.m_payment_id ?? "").trim();
    const providerPaymentId = String(fields.pf_payment_id ?? "").trim();
    if (!merchantReference || !providerPaymentId) {
      await client.query("ROLLBACK");
      send(response, 400, "Missing payment reference");
      return;
    }

    const orderResult = await client.query<{
      order_ref: string; candidate_ref: string; order_status: string; amount_cents: number; currency: string;
    }>(
      "SELECT order_ref, candidate_ref, order_status, amount_cents, currency FROM public.finance_orders WHERE order_ref = $1 FOR UPDATE",
      [merchantReference]
    );
    const order = orderResult.rows[0];
    if (!order || order.currency !== "ZAR" || order.order_status !== "PENDING_PAYMENT") {
      await client.query("ROLLBACK");
      send(response, 400, "Unknown or ineligible order");
      return;
    }

    const intentResult = await client.query<{
      intent_ref: string; intent_status: string; amount_cents: number; currency: string; merchant_reference: string;
    }>(
      "SELECT intent_ref, intent_status, amount_cents, currency, merchant_reference FROM public.payfast_payment_intents WHERE order_ref = $1 AND merchant_reference = $2 ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
      [order.order_ref, merchantReference]
    );
    const intent = intentResult.rows[0];
    if (!intent || !["CREATED", "REDIRECTED", "ITN_RECEIVED"].includes(intent.intent_status)
      || intent.amount_cents !== order.amount_cents || intent.currency !== order.currency) {
      await client.query("ROLLBACK");
      send(response, 400, "No matching payment intent");
      return;
    }

    const prior = await client.query<{ id: string }>(
      "SELECT id FROM public.payfast_itn_receipts WHERE provider_payment_id = $1 OR idempotency_key = $2 LIMIT 1",
      [providerPaymentId, ["payfast-itn", merchantReference, providerPaymentId, String(fields.payment_status ?? "unknown").toUpperCase()].join(":")]
    );
    const result = validatePayFastItn({
      payload: fields,
      expectedMerchantReference: order.order_ref,
      expectedAmountCents: order.amount_cents,
      passphrase,
      idempotencyCheckCompleted: true,
      duplicate: prior.rows.length > 0,
      remoteAddress: request.socket.remoteAddress,
      allowedSourceIps
    });
    const itnRef = `itn_${crypto.randomUUID()}`;
    const idempotencyKey = result.idempotencyKey;
    const grossText = String(fields.amount_gross ?? "");
    let grossCents: number | null = null;
    try { grossCents = randToCents(grossText); } catch { /* rejected receipt remains auditable */ }

    await client.query(
      `INSERT INTO public.payfast_itn_receipts
       (itn_ref, merchant_reference, provider_payment_id, payment_status, amount_gross, amount_fee, amount_net,
        received_payload, received_signature, signature_valid, ip_valid, amount_valid, duplicate, accepted,
        rejection_reason, idempotency_key, evidence_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [itnRef, merchantReference, providerPaymentId, result.paymentStatus ?? null, grossText || null,
       fields.amount_fee == null ? null : String(fields.amount_fee), fields.amount_net == null ? null : String(fields.amount_net),
       JSON.stringify(fields), String(fields.signature ?? ""), result.signatureValid, result.ipValid, result.amountValid,
       result.duplicate, result.accepted, result.rejectionReason ?? null, idempotencyKey, `pay_ev_${itnRef}`]
    );

    if (!result.accepted) {
      await client.query("COMMIT");
      send(response, result.duplicate ? 200 : 400, result.duplicate ? "OK" : "Notification rejected");
      return;
    }

    // Do not treat a provider callback alone as sufficient production confirmation.
    // Record the verified receipt/payment as pending secondary provider confirmation;
    // never grant entitlements or mark the order PAID in this foundation stage.
    // Receipt and evidence are durable, but we do not fabricate fee/net accounting
    // from fields that have not been independently validated.
    await client.query(
      "UPDATE public.payfast_payment_intents SET intent_status = 'ITN_RECEIVED', updated_at = now() WHERE intent_ref = $1 AND intent_status IN ('CREATED','REDIRECTED','ITN_RECEIVED')",
      [intent.intent_ref]
    );
    await client.query(
      `INSERT INTO public.payment_evidence_ledger
       (evidence_ref, source_type, source_ref, candidate_ref, order_ref, event_name, event_summary, proof_payload)
       VALUES ($1,'payfast_itn',$2,$3,$4,'PAYFAST_ITN_VALIDATED','Signed callback validated; entitlement activation withheld pending provider confirmation.',$5::jsonb)
       ON CONFLICT (evidence_ref) DO NOTHING`,
      [`pay_ev_${itnRef}`, itnRef, order.candidate_ref, order.order_ref,
       JSON.stringify({ providerPaymentId, paymentStatus: result.paymentStatus, amountCents: grossCents, entitlementActivated: false })]
    );
    await client.query("COMMIT");
    send(response, 200, "OK");
  } catch (error) {
    try { await client?.query("ROLLBACK"); } catch { /* retain original failure */ }
    console.error(JSON.stringify({
      service: "kingsmen-api",
      event: "payfast_itn_persistence_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
      generatedAtIso: new Date().toISOString()
    }));
    send(response, 503, "Payment notification temporarily unavailable");
  } finally {
    client?.release();
  }
}
