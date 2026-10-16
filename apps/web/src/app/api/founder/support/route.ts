import { cookies } from "next/headers";
import { candidateAccessCookie, supabaseAuthConfig } from "@/lib/supabase-auth";
import { requireFounderAccess, founderAccessDenied, founderPrivateJson } from "@/lib/founder-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function rpc(name: string, body?: Record<string, unknown>) {
  const config = supabaseAuthConfig();
  const token = (await cookies()).get(candidateAccessCookie)?.value;
  if (!config || !token || token.length > 8192 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
    return { status: 503, body: { ok: false, error: "Authenticated database access is unavailable; no support operation was recorded." } };
  }
  let response: Response;
  try {
    response = await fetch(new URL(`/rest/v1/rpc/${name}`, config.url), {
      method: "POST",
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body || {}), cache: "no-store", signal: AbortSignal.timeout(8000)
    });
  } catch {
    return { status: 503, body: { ok: false, error: "Support storage timed out; retry after checking the queue." } };
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403 || detail.includes("FOUNDER_ACCESS_REQUIRED")) return { status: 403, body: { ok: false, error: "Founder authorization denied." } };
    if (detail.includes("SUPPORT_REQUEST_NOT_FOUND")) return { status: 404, body: { ok: false, error: "Support request not found." } };
    return { status: 503, body: { ok: false, error: "Support storage rejected the operation. Confirm migration 0023 is applied." } };
  }
  return { status: 200, body: await response.json().catch(() => null) };
}

export async function GET() {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);
  const result = await rpc("founder_list_support_requests");
  if (result.status !== 200 || !Array.isArray(result.body)) return founderPrivateJson({ ok: false, error: "Support queue unavailable.", detail: result.body }, { status: result.status });
  return founderPrivateJson({ ok: true, requests: result.body, productionReady: true });
}

export async function POST(request: Request) {
  const access = await requireFounderAccess();
  if (!access.ok) return founderAccessDenied(access);
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 12_000) return founderPrivateJson({ ok: false, error: "Support update exceeds size limit." }, { status: 413 });
  let body: Record<string, unknown>;
  try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(); body = parsed; }
  catch { return founderPrivateJson({ ok: false, error: "Provide a valid JSON update." }, { status: 400 }); }
  const candidateUserId = typeof body.candidateUserId === "string" ? body.candidateUserId : "";
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const status = typeof body.status === "string" ? body.status : "";
  const notes = typeof body.notes === "string" ? body.notes : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateUserId) ||
      requestId.length < 3 || requestId.length > 180 || notes.length > 2000 ||
      !["OPEN","IN_REVIEW","WAITING_FOR_CANDIDATE","RESOLVED","CLOSED"].includes(status)) {
    return founderPrivateJson({ ok: false, error: "Candidate, request, status or notes are invalid." }, { status: 400 });
  }
  const result = await rpc("founder_update_support_request", { p_candidate_user_id: candidateUserId, p_request_id: requestId, p_status: status, p_notes: notes });
  return founderPrivateJson(result.body, { status: result.status });
}
