import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store", pragma: "no-cache" } });

async function readRows(cfg: Parameters<typeof supabaseAdminFetch>[0], table: string, params: URLSearchParams) {
  const response = await supabaseAdminFetch(cfg, `/rest/v1/${table}?${params}`);
  if (!response.ok) throw new Error(`${table} query failed`);
  const data = await response.json().catch(() => null);
  if (!Array.isArray(data)) throw new Error(`${table} response invalid`);
  return data as Array<Record<string, unknown>>;
}

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  try {
    const candidateRows = await readRows(auth.config, "candidates", new URLSearchParams({ select: "id,public_ref", id: `eq.${auth.session.candidateId}`, limit: "1" }));
    if (candidateRows.length !== 1 || !candidateRows[0].public_ref) return json({ ok: false, code: "CANDIDATE_FINANCE_REFERENCE_MISSING", error: "The candidate finance reference could not be resolved." }, 409);
    const candidateRef = String(candidateRows[0].public_ref);
    const [items, orders, invoices, payments, refunds, ledger, plans] = await Promise.all([
      readRows(auth.config, "candidate_financial_items", new URLSearchParams({ select: "id,item_type,item_ref,description,amount_cents,currency,status,provider,provider_ref,evidence_ref,created_at,updated_at", candidate_id: `eq.${auth.session.candidateId}`, order: "created_at.desc", limit: "200" })),
      readRows(auth.config, "finance_orders", new URLSearchParams({ select: "id,order_ref,plan_code,order_status,amount_cents,currency,evidence_ref,created_at,updated_at", candidate_ref: `eq.${candidateRef}`, order: "created_at.desc", limit: "200" })),
      readRows(auth.config, "finance_invoices", new URLSearchParams({ select: "id,invoice_ref,order_ref,invoice_status,amount_cents,currency,issued_at,due_at,paid_at,evidence_ref,created_at", candidate_ref: `eq.${candidateRef}`, order: "issued_at.desc", limit: "200" })),
      readRows(auth.config, "finance_payments", new URLSearchParams({ select: "id,payment_ref,order_ref,invoice_ref,provider,provider_payment_id,merchant_reference,amount_gross_cents,amount_fee_cents,amount_net_cents,currency,payment_status,verified,verified_at,evidence_ref,created_at", candidate_ref: `eq.${candidateRef}`, order: "created_at.desc", limit: "200" })),
      readRows(auth.config, "finance_refund_requests", new URLSearchParams({ select: "id,refund_ref,payment_ref,order_ref,amount_cents,currency,reason,refund_status,evidence_ref,created_at,reviewed_at,completed_at", candidate_ref: `eq.${candidateRef}`, order: "created_at.desc", limit: "100" })),
      readRows(auth.config, "finance_ledger_entries", new URLSearchParams({ select: "id,ledger_ref,order_ref,invoice_ref,payment_ref,refund_ref,entry_type,debit_cents,credit_cents,currency,description,evidence_ref,created_at", candidate_ref: `eq.${candidateRef}`, order: "created_at.desc", limit: "300" })),
      readRows(auth.config, "finance_plan_catalog", new URLSearchParams({ select: "plan_code,plan_name,description,amount_cents,currency,active,catalogue_version,service_scope", active: "eq.true", order: "amount_cents.asc", limit: "100" }))
    ]);
    return json({
      ok: true, candidateReference: candidateRef, items, orders, invoices, payments, refunds, ledger, plans,
      authority: { candidateCanMarkPaid: false, returnUrlCanMarkPaid: false, verifiedPaymentRequiresProviderCallback: true, ledgerIsReadOnly: true }
    });
  } catch {
    return json({ ok: false, code: "FINANCE_QUERY_FAILED", error: "Finance records could not be loaded from the connected ledger tables. Check schema and server configuration." }, 502);
  }
}


export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { paymentRef?: unknown; amountCents?: unknown; reason?: unknown } | null;
  const paymentRef = typeof body?.paymentRef === "string" ? body.paymentRef.trim() : "";
  const amountCents = Number(body?.amountCents);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!paymentRef || paymentRef.length > 100 || !Number.isSafeInteger(amountCents) || amountCents <= 0 || reason.length < 10 || reason.length > 1000) {
    return json({ ok: false, code: "INVALID_REFUND_REQUEST", error: "Choose a verified payment, enter a positive amount in cents, and provide a 10–1,000 character reason." }, 400);
  }
  const response = await supabaseAdminFetch(auth.config, "/rest/v1/rpc/request_candidate_refund", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_auth_user_id: auth.session.userId, p_candidate_id: auth.session.candidateId, p_payment_ref: paymentRef, p_amount_cents: amountCents, p_reason: reason })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "REFUND_REQUEST_UNAVAILABLE", error: "Refund request service could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "REFUND_REQUEST_REJECTED", error: "Refund request was rejected. Only a verified completed PayFast payment with available refundable balance can be used." }, 409);
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "REFUND_REQUEST_UNCONFIRMED", error: "The database did not confirm the refund request." }, 502);
  return json(result, 201);
}
