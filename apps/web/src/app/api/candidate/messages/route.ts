import { randomUUID } from "node:crypto";
import { requireCandidateSession, supabaseAdminFetch } from "../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const url = new URL(`${auth.config.url}/rest/v1/candidate_messages`);
  url.searchParams.set("select", "id,application_id,channel,direction,urgency,subject,body,delivery_status,evidence_ref,correlation_id,created_at,sent_at,read_at");
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

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { subject?: unknown; body?: unknown; urgency?: unknown } | null;
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const messageBody = typeof body?.body === "string" ? body.body.trim() : "";
  const urgency = body?.urgency === "URGENT" ? "URGENT" : body?.urgency === "IMPORTANT" ? "IMPORTANT" : "ROUTINE";
  if (subject.length < 3 || subject.length > 180 || messageBody.length < 10 || messageBody.length > 8000) {
    return json({ ok: false, code: "INVALID_CANDIDATE_MESSAGE", error: "Subject must be 3–180 characters and message 10–8,000 characters." }, 400);
  }
  const response = await supabaseAdminFetch(auth.config, "/rest/v1/rpc/create_candidate_portal_message", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_auth_user_id: auth.session.userId, p_candidate_id: auth.session.candidateId, p_subject: subject, p_body: messageBody, p_urgency: urgency, p_correlation_id: randomUUID() })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "MESSAGE_CREATE_UNAVAILABLE", error: "Message submission could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "MESSAGE_CREATE_FAILED", error: "Message submission was rejected. Confirm migration 0068 and candidate identity state." }, 502);
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "MESSAGE_CREATE_UNCONFIRMED", error: "The database did not confirm the message." }, 502);
  return json({ ok: true, message: result.message, auditEventId: result.auditEventId, messageText: "Message saved for authorised operator review." }, 201);
}

export async function PATCH(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { messageId?: unknown } | null;
  const id = typeof body?.messageId === "string" ? body.messageId : "";
  if (!id) return json({ ok: false, code: "MESSAGE_ID_REQUIRED", error: "messageId is required." }, 400);
  const response = await supabaseAdminFetch(auth.config, "/rest/v1/rpc/mark_candidate_portal_message_read", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_auth_user_id: auth.session.userId, p_candidate_id: auth.session.candidateId, p_message_id: id })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "MESSAGE_UPDATE_UNAVAILABLE", error: "Message state could not be updated." }, 503);
  if (!response.ok) return json({ ok: false, code: "MESSAGE_UPDATE_FAILED", error: "Message state could not be updated. Confirm migration 0068." }, 502);
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "MESSAGE_UPDATE_UNCONFIRMED", error: "The database did not confirm the read update." }, 502);
  return json({ ok: true, ...result });
}
