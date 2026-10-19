import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/get_founder_candidate_messages", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ p_limit: 100 })
  }).catch(() => null);
  if (!response) return json({ ok: false, error: "Message queue unavailable." }, 503);
  if (!response.ok) return json({ ok: false, error: "Message queue access or migration 0071 is missing." }, response.status === 401 || response.status === 403 ? response.status : 503);
  const data = await response.json().catch(() => null);
  if (!data || data.ok !== true || !Array.isArray(data.messages)) return json({ ok: false, error: "Invalid message queue response." }, 502);
  return json(data);
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { messageId?: unknown; subject?: unknown; body?: unknown; urgency?: unknown } | null;
  const messageId = typeof body?.messageId === "string" ? body.messageId : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const messageBody = typeof body?.body === "string" ? body.body.trim() : "";
  const urgency = body?.urgency === "URGENT" ? "URGENT" : body?.urgency === "IMPORTANT" ? "IMPORTANT" : "ROUTINE";
  if (!messageId || subject.length < 3 || subject.length > 180 || messageBody.length < 10 || messageBody.length > 8000) {
    return json({ ok: false, error: "Provide a source message, a 3–180 character subject and a 10–8,000 character reply." }, 400);
  }
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/founder_reply_candidate_message", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_message_id: messageId, p_subject: subject, p_body: messageBody, p_urgency: urgency })
  }).catch(() => null);
  if (!response) return json({ ok: false, error: "Reply service unavailable." }, 503);
  if (!response.ok) return json({ ok: false, error: "Reply was rejected. Confirm operator permission and message state." }, response.status === 401 || response.status === 403 ? response.status : 409);
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, error: "The database did not confirm the reply." }, 502);
  return json(result, 201);
}
