import { cookies } from "next/headers";
import { candidateAccessCookie, supabaseAuthConfig } from "@/lib/supabase-auth";
import { founderAccessDenied, founderPrivateJson, requireFounderAccess } from "@/lib/founder-auth";

const MAX_BODY_BYTES = 16 * 1024;
const validText = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const validRef = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$/.test(v);

export async function POST(request: Request) {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return founderPrivateJson({ ok: false, error: "Request too large." }, { status: 413 });
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    body = value as Record<string, unknown>;
  } catch {
    return founderPrivateJson({ ok: false, error: "A JSON object is required." }, { status: 400 });
  }

  if (!validText(body.commandId, 100) || !validText(body.commandName, 180)
    || !validText(body.evidenceId, 180) || !validRef(body.requestId) || !validRef(body.auditId)
    || !validText(body.reason, 1200) || (body.reason as string).trim().length < 8
    || (body.payload !== undefined && (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)))) {
    return founderPrivateJson({ ok: false, error: "Provide commandId, commandName, evidenceId, requestId, auditId, and a reason of at least 8 characters." }, { status: 400 });
  }

  const config = supabaseAuthConfig();
  const token = (await cookies()).get(candidateAccessCookie)?.value;
  if (!config || !token || token.length > 8192 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
    return founderPrivateJson({ ok: false, error: "Authenticated database persistence is unavailable; nothing was recorded." }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/rpc/record_founder_command_intake`, {
      method: "POST",
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        p_request_ref: body.requestId, p_command_key: body.commandId, p_command_name: body.commandName,
        p_actor_user_id: access.userId, p_actor_email: access.email, p_reason: (body.reason as string).trim(),
        p_evidence_ref: body.evidenceId, p_audit_ref: body.auditId, p_request_payload: body.payload ?? {}
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    return founderPrivateJson({ ok: false, error: "Database request timed out. Nothing was dispatched." }, { status: 503 });
  }

  if (!response.ok) {
    const status = response.status === 409 ? 409 : response.status === 401 || response.status === 403 ? 403 : 503;
    return founderPrivateJson({
      ok: false,
      error: status === 409 ? "Request or audit reference already exists; use new references." : "Database did not accept the request. Confirm migration 0016 is applied and the Supabase app_metadata founder role is set."
    }, { status });
  }

  let persisted: unknown;
  try { persisted = await response.json(); }
  catch { return founderPrivateJson({ ok: false, error: "Could not verify the persistence response." }, { status: 502 }); }

  return founderPrivateJson({
    ok: true, productionReady: false, request: persisted, executed: false,
    note: "Request and audit event recorded for review. No command was approved, dispatched, or executed."
  }, { status: 201 });
}
