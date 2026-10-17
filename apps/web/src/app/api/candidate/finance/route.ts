import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const url = new URL(`${auth.config.url}/rest/v1/candidate_financial_items`);
  url.searchParams.set("select", "id,item_type,item_ref,description,amount_cents,currency,status,provider,provider_ref,evidence_ref,created_at,updated_at");
  url.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "200");
  const response = await supabaseAdminFetch(auth.config, `/rest/v1/candidate_financial_items?${url.searchParams}`).catch(() => null);
  if (!response) return json({ ok: false, code: "FINANCE_UNAVAILABLE", error: "Finance records could not be reached. Try again." }, 503);
  if (!response.ok) return json({ ok: false, code: "FINANCE_QUERY_FAILED", error: "Finance records could not be loaded. Confirm the connected schema." }, 502);
  const items = await response.json().catch(() => null);
  if (!Array.isArray(items)) return json({ ok: false, code: "FINANCE_RESPONSE_INVALID", error: "Finance returned an invalid response." }, 502);
  return json({ ok: true, items, authority: { candidateCanMarkPaid: false, returnUrlCanMarkPaid: false, paymentVerification: "verified provider callback or authorised finance review only" } });
}
