import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const url = new URL(`${auth.config.url}/rest/v1/candidate_success_events`);
  url.searchParams.set("select", "id,application_id,event_type,event_status,outcome_confidence,summary,evidence_ref,feedback_score,created_at");
  url.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "200");
  const response = await supabaseAdminFetch(auth.config, `/rest/v1/candidate_success_events?${url.searchParams}`).catch(() => null);
  if (!response) return json({ ok: false, code: "OUTCOMES_UNAVAILABLE", error: "Outcome records could not be reached. Try again." }, 503);
  if (!response.ok) return json({ ok: false, code: "OUTCOMES_QUERY_FAILED", error: "Outcome records could not be loaded. Confirm the connected schema." }, 502);
  const events = await response.json().catch(() => null);
  if (!Array.isArray(events)) return json({ ok: false, code: "OUTCOMES_RESPONSE_INVALID", error: "Outcomes returned an invalid response." }, 502);
  return json({ ok: true, events, authority: { candidateCanVerifyOutcome: false, onlyVerifiedEventsCountAsVerified: true } });
}
