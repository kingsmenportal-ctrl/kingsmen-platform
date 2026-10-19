import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } });

export async function GET(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/get_founder_ops_queue", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ p_limit: 100 })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "OPS_QUEUE_UNAVAILABLE", error: "Founder operations queues could not be reached." }, 503);
  if (!response.ok) return json({ ok: false, code: "OPS_QUEUE_QUERY_FAILED", error: "Founder/operator access or migration 0066 is missing." }, response.status === 401 || response.status === 403 ? response.status : 503);
  const data = await response.json().catch(() => null);
  if (!data || data.ok !== true) return json({ ok: false, code: "OPS_QUEUE_INVALID", error: "Founder operations queues returned invalid data." }, 502);
  return json(data);
}

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { action?: unknown; notificationId?: unknown; deadLetterId?: unknown; approvalId?: unknown; exceptionId?: unknown; decision?: unknown; notes?: unknown } | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  if (notes.length < 8) return json({ ok: false, code: "OPERATOR_REASON_REQUIRED", error: "Enter at least eight characters explaining the operational action." }, 400);
  let path = "";
  let args: Record<string, unknown> = {};
  if (action === "REQUEUE_NOTIFICATION" && typeof body?.notificationId === "string") {
    path = "/rest/v1/rpc/founder_requeue_notification";
    args = { p_notification_id: body.notificationId, p_notes: notes };
  } else if (action === "RESOLVE_DEAD_LETTER" && typeof body?.deadLetterId === "string" && body?.decision === "RESOLVED") {
    path = "/rest/v1/rpc/founder_resolve_dead_letter";
    args = { p_dead_letter_id: body.deadLetterId, p_decision: "RESOLVED", p_notes: notes };
  } else if (action === "IGNORE_DEAD_LETTER" && typeof body?.deadLetterId === "string" && body?.decision === "IGNORED") {
    path = "/rest/v1/rpc/founder_resolve_dead_letter";
    args = { p_dead_letter_id: body.deadLetterId, p_decision: "IGNORED", p_notes: notes };
  } else if (action === "REVIEW_CONTROL_PLANE_APPROVAL" && typeof body?.approvalId === "string" && (body.decision === "APPROVED" || body.decision === "REJECTED")) {
    path = "/rest/v1/rpc/founder_review_control_plane_approval";
    args = { p_approval_id: body.approvalId, p_decision: body.decision, p_reason: notes };
  } else if (action === "REVIEW_POLICY_EXCEPTION" && typeof body?.exceptionId === "string" && (body.decision === "APPROVED" || body.decision === "REJECTED")) {
    path = "/rest/v1/rpc/founder_review_policy_exception";
    args = { p_exception_id: body.exceptionId, p_decision: body.decision, p_notes: notes };
  } else {
    return json({ ok: false, code: "INVALID_OPS_ACTION", error: "Choose a supported notification, dead-letter, approval, or policy exception action." }, 400);
  }
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, path, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(args)
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "OPS_ACTION_UNAVAILABLE", error: "The operational action could not be reached." }, 503);
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status === 404 ? 503 : 409;
    return json({ ok: false, code: "OPS_ACTION_REJECTED", error: status === 403 || status === 401 ? "Founder/operator permission is required." : "The operational action was rejected. Confirm migration 0066 and the current queue state." }, status);
  }
  const result = await response.json().catch(() => null);
  if (!result || result.ok !== true) return json({ ok: false, code: "OPS_ACTION_UNCONFIRMED", error: "The database did not confirm the operational action." }, 502);
  return json(result);
}
