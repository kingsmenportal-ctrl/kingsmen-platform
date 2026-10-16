import { cookies } from "next/headers";
import { candidateAccessCookie, supabaseAuthConfig } from "@/lib/supabase-auth";
import { founderAccessDenied, founderPrivateJson, requireFounderAccess } from "@/lib/founder-auth";

const MAX_BODY_BYTES = 8 * 1024;
const STATUSES = new Set(["OPEN", "WAITING_ON_CANDIDATE", "WAITING_ON_OPERATOR", "RESOLVED", "CLOSED"]);
const EVENT_TYPES = new Set(["ASSIGNED", "STATUS_CHANGED", "RESOLUTION_NOTE", "INTERNAL_NOTE"]);
const validRef = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$/.test(value);

async function databaseContext() {
  const config = supabaseAuthConfig();
  const token = (await cookies()).get(candidateAccessCookie)?.value;
  if (!config || !token || token.length > 8192 || !/^[A-Za-z0-9._~-]+$/.test(token)) return null;
  return { config, token };
}

function dbHeaders(token: string, anonKey: string, json = false): HeadersInit {
  return { apikey: anonKey, Authorization: `Bearer ${token}`, Accept: "application/json", ...(json ? { "Content-Type": "application/json" } : {}) };
}

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);
  const ctx = await databaseContext();
  if (!ctx) return founderPrivateJson({ ok: false, error: "Authenticated database access is unavailable. No support data was loaded." }, { status: 503 });

  try {
    const response = await fetch(
      `${ctx.config.url}/rest/v1/candidate_support_tickets?select=id,ticket_ref,candidate_id,application_id,category,priority,status,title,description,evidence_ref,assigned_to,created_at,updated_at,closed_at&order=created_at.desc&limit=200`,
      { headers: dbHeaders(ctx.token, ctx.config.anonKey), cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return founderPrivateJson({ ok: false, error: "Canonical support tickets are unavailable. Confirm migration 0002 and 0023, authenticated role grants, and ticket data." }, { status: response.status === 401 || response.status === 403 ? 403 : 503 });
    const tickets: unknown = await response.json();
    if (!Array.isArray(tickets)) return founderPrivateJson({ ok: false, error: "Support ticket query returned an invalid shape." }, { status: 502 });

    const eventsResponse = await fetch(
      `${ctx.config.url}/rest/v1/candidate_support_ticket_events?select=id,ticket_id,ticket_ref,event_type,from_status,to_status,from_assignee,to_assignee,note,actor_user_id,actor_email,audit_ref,created_at&order=created_at.desc&limit=500`,
      { headers: dbHeaders(ctx.token, ctx.config.anonKey), cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!eventsResponse.ok) return founderPrivateJson({ ok: false, error: "Support audit history is unavailable. Confirm migration 0023 and founder-role policy." }, { status: eventsResponse.status === 401 || eventsResponse.status === 403 ? 403 : 503 });
    const events: unknown = await eventsResponse.json();
    if (!Array.isArray(events)) return founderPrivateJson({ ok: false, error: "Support audit history returned an invalid shape." }, { status: 502 });

    return founderPrivateJson({
      ok: true, tickets, events, currentUserId: access.userId,
      count: tickets.length, ticketLimit: 200, eventLimit: 500,
      productionReady: false,
      notice: "This queue reads canonical database tickets only. Candidate-local support requests are not automatically mirrored into these rows."
    });
  } catch {
    return founderPrivateJson({ ok: false, error: "Support operations request timed out. Refresh before retrying." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return founderPrivateJson({ ok: false, error: "Request too large." }, { status: 413 });
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return founderPrivateJson({ ok: false, error: "A JSON object is required." }, { status: 400 });
  }

  const ticketRef = typeof body.ticketRef === "string" ? body.ticketRef.trim() : "";
  const status = typeof body.status === "string" ? body.status.toUpperCase() : "";
  const assignedToRaw = body.assignedTo;
  const assignedTo = assignedToRaw === null || assignedToRaw === "" ? null : typeof assignedToRaw === "string" ? assignedToRaw.trim() : undefined;
  const eventType = typeof body.eventType === "string" ? body.eventType.toUpperCase() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const auditRef = body.auditRef;
  if (ticketRef.length < 4 || ticketRef.length > 160 || !STATUSES.has(status)
    || assignedTo === undefined || (assignedTo !== null && assignedTo.length > 160)
    || !EVENT_TYPES.has(eventType) || note.length < 4 || note.length > 2000 || !validRef(auditRef)) {
    return founderPrivateJson({ ok: false, error: "Provide a ticket reference, valid status, assignee (or blank), event type, 4–2000 character audit note, and valid audit reference." }, { status: 400 });
  }

  const ctx = await databaseContext();
  if (!ctx) return founderPrivateJson({ ok: false, error: "Authenticated database access is unavailable; no ticket change was made." }, { status: 503 });

  try {
    const response = await fetch(`${ctx.config.url}/rest/v1/rpc/update_support_ticket_as_operator`, {
      method: "POST",
      headers: dbHeaders(ctx.token, ctx.config.anonKey, true),
      body: JSON.stringify({
        p_ticket_ref: ticketRef,
        p_status: status,
        p_assigned_to: assignedTo,
        p_event_type: eventType,
        p_note: note,
        p_actor_user_id: access.userId,
        p_actor_email: access.email,
        p_audit_ref: auditRef
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (detail.includes("SUPPORT_TICKET_NOT_FOUND")) return founderPrivateJson({ ok: false, error: "Canonical support ticket not found." }, { status: 404 });
      if (detail.includes("SUPPORT_OPERATOR_ROLE_REQUIRED") || response.status === 401 || response.status === 403) return founderPrivateJson({ ok: false, error: "Database denied support-operator access. No change was made." }, { status: 403 });
      return founderPrivateJson({ ok: false, error: "Support change was not confirmed by the database. Confirm migration 0023 and refresh before retrying." }, { status: 503 });
    }
    let result: unknown;
    try { result = await response.json(); } catch { return founderPrivateJson({ ok: false, error: "Could not verify the support change response. Refresh the queue before retrying." }, { status: 502 }); }
    return founderPrivateJson({ ok: true, result, executed: true, notificationSent: false, productionReady: false, notice: "Support assignment/status and audit event were recorded atomically. No external notification was sent." }, { status: 200 });
  } catch {
    return founderPrivateJson({ ok: false, error: "Support update timed out. Refresh the queue to verify whether it was recorded." }, { status: 503 });
  }
}
