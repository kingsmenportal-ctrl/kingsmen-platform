import { cookies } from "next/headers";
import { candidateAccessCookie, supabaseAuthConfig } from "@/lib/supabase-auth";
import { founderAccessDenied, founderPrivateJson, requireFounderAccess } from "@/lib/founder-auth";

const MAX_BODY_BYTES = 8 * 1024;
const validRef = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$/.test(value);

export async function POST(request: Request) {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return founderPrivateJson({ ok: false, error: "Request too large." }, { status: 413 });
    }
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    body = value as Record<string, unknown>;
  } catch {
    return founderPrivateJson({ ok: false, error: "A JSON object is required." }, { status: 400 });
  }

  const decision = body.decision;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!validRef(body.requestRef) || !validRef(body.decisionRef) || !validRef(body.auditRef)
    || (decision !== "APPROVED" && decision !== "REJECTED") || reason.length < 8 || reason.length > 1200) {
    return founderPrivateJson({
      ok: false,
      error: "Provide valid request, decision and audit references, APPROVED or REJECTED, and a reason of 8–1200 characters."
    }, { status: 400 });
  }

  const config = supabaseAuthConfig();
  const token = (await cookies()).get(candidateAccessCookie)?.value;
  if (!config || !token || token.length > 8192 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
    return founderPrivateJson({ ok: false, error: "Authenticated database access is unavailable; no decision was recorded." }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/rpc/decide_founder_command_intake`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        p_request_ref: body.requestRef,
        p_decision_ref: body.decisionRef,
        p_decision: decision,
        p_reviewer_user_id: access.userId,
        p_reviewer_email: access.email,
        p_reason: reason,
        p_audit_ref: body.auditRef
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    return founderPrivateJson({ ok: false, error: "Decision request timed out; check the queue before retrying." }, { status: 503 });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403 || detail.includes("SEPARATION_OF_DUTIES_REQUIRED")) {
      return founderPrivateJson({ ok: false, error: "Decision denied. The requester cannot decide their own request; a separate founder reviewer is required." }, { status: 403 });
    }
    if (detail.includes("COMMAND_REQUEST_ALREADY_DECIDED")) {
      return founderPrivateJson({ ok: false, error: "This request already has a decision. Refresh the queue." }, { status: 409 });
    }
    if (detail.includes("COMMAND_REQUEST_NOT_FOUND")) {
      return founderPrivateJson({ ok: false, error: "Request not found. Refresh the queue." }, { status: 404 });
    }
    return founderPrivateJson({
      ok: false,
      error: "Database did not accept the decision. Confirm migration 0017 is applied and the founder role is configured."
    }, { status: 503 });
  }

  let persisted: unknown;
  try { persisted = await response.json(); }
  catch { return founderPrivateJson({ ok: false, error: "Could not verify the decision persistence response." }, { status: 502 }); }

  return founderPrivateJson({
    ok: true,
    decision: persisted,
    executed: false,
    productionReady: false,
    note: "Decision and audit event recorded. Approval is not execution and no operational command was dispatched."
  }, { status: 201 });
}
