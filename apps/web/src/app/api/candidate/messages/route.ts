import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const url = new URL(`${auth.config.url}/rest/v1/candidate_messages`);
  url.searchParams.set("select", "id,application_id,channel,direction,urgency,subject,body,delivery_status,created_at,sent_at,read_at");
  url.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "200");
  const response = await supabaseAdminFetch(auth.config, `/rest/v1/candidate_messages?${url.searchParams}`).catch(() => null);
  if (!response) return json({ ok: false, code: "MESSAGES_UNAVAILABLE", error: "Messages could not be reached. Try again." }, 503);
  if (!response.ok) return json({ ok: false, code: "MESSAGES_QUERY_FAILED", error: "Messages could not be loaded. Confirm the connected schema." }, 502);
  const messages = await response.json().catch(() => null);
  if (!Array.isArray(messages)) return json({ ok: false, code: "MESSAGES_RESPONSE_INVALID", error: "Messages returned an invalid response." }, 502);
  return json({ ok: true, messages });
}

export async function PATCH(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { messageId?: unknown } | null;
  const id = typeof body?.messageId === "string" ? body.messageId : "";
  if (!id) return json({ ok: false, code: "MESSAGE_ID_REQUIRED", error: "messageId is required." }, 400);
  const url = new URL(`${auth.config.url}/rest/v1/candidate_messages`);
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  url.searchParams.set("read_at", "is.null");
  url.searchParams.set("direction", "in.(INBOUND,SYSTEM)");
  const response = await supabaseAdminFetch(auth.config, `/rest/v1/candidate_messages?${url.searchParams}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({ read_at: new Date().toISOString(), delivery_status: "READ" })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "MESSAGE_UPDATE_UNAVAILABLE", error: "Message state could not be updated." }, 503);
  if (!response.ok) return json({ ok: false, code: "MESSAGE_UPDATE_FAILED", error: "Message state could not be updated." }, 502);
  const rows = await response.json().catch(() => []);
  if (!Array.isArray(rows) || rows.length === 0) return json({ ok: true, unchanged: true, message: "The message was already read or is not available to this candidate." });
  return json({ ok: true, message: rows[0] });
}
