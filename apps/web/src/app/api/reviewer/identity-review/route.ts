import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthUser = { id?: string };
type ReviewerAuth = { userId: string; url: string; anon: string; service: string };

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !anon || !service) throw new Error("Reviewer identity service is not configured.");
  return { url, anon, service };
}

async function reviewer(request: Request): Promise<ReviewerAuth | NextResponse> {
  const { url, anon, service } = config();
  const token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store"
  });
  if (!response.ok) return NextResponse.json({ ok: false, error: "Invalid or expired session." }, { status: 401 });
  const user = await response.json() as AuthUser;
  if (!user.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
    return NextResponse.json({ ok: false, error: "Authenticated account could not be verified." }, { status: 401 });
  }

  const role = await fetch(
    `${url}/rest/v1/platform_reviewers?select=id&auth_user_id=eq.${encodeURIComponent(user.id)}&role_code=eq.PLATFORM_ADMIN&is_active=eq.true&revoked_at=is.null&limit=1`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` }, cache: "no-store" }
  );
  if (!role.ok) throw new Error("Reviewer authorisation lookup failed.");
  const roles = await role.json() as Array<{ id: string }>;
  if (roles.length !== 1) return NextResponse.json({ ok: false, error: "Active platform identity-review permission is required." }, { status: 403 });
  return { userId: user.id, url, anon, service };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "Reviewer identity service is not configured.") return NextResponse.json({ ok: false, error: message }, { status: 503 });
  return NextResponse.json({ ok: false, error: "Identity review operation failed safely. Check the request status before retrying." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const auth = await reviewer(request);
    if (auth instanceof NextResponse) return auth;
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "OPEN";
    const allowed = status === "OPEN"
      ? "or=(request_status.eq.PENDING,request_status.eq.NEEDS_INFORMATION)"
      : `request_status=eq.${encodeURIComponent(status)}`;
    const response = await fetch(
      `${auth.url}/rest/v1/candidate_identity_review_requests?select=id,supabase_user_id,candidate_reference,claimant_name,claimant_message,request_status,reviewer_note,created_at,updated_at,reviewed_by,reviewed_at&${allowed}&order=created_at.asc&limit=100`,
      { headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}` }, cache: "no-store" }
    );
    if (!response.ok) throw new Error("Identity review queue could not be loaded.");
    return NextResponse.json({ ok: true, requests: await response.json() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const auth = await reviewer(request);
    if (auth instanceof NextResponse) return auth;
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }

    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    const decision = typeof body.decision === "string" ? body.decision : "";
    const candidateReference = typeof body.candidateReference === "string" ? body.candidateReference.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
        !["APPROVED", "REJECTED", "NEEDS_INFORMATION"].includes(decision) ||
        note.length < 3 || note.length > 1200 ||
        (decision === "APPROVED" && (candidateReference.length < 2 || candidateReference.length > 120))) {
      return NextResponse.json({ ok: false, error: "A valid request, decision, 3–1,200 character reviewer note, and exact candidate reference for approval are required." }, { status: 400 });
    }

    const response = await fetch(`${auth.url}/rest/v1/rpc/decide_candidate_identity_review`, {
      method: "POST",
      headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_request_id: requestId,
        p_reviewer_auth_user_id: auth.userId,
        p_decision: decision,
        p_candidate_reference: decision === "APPROVED" ? candidateReference : null,
        p_note: note
      }),
      cache: "no-store"
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (detail.includes("not authorised") || detail.includes("42501")) {
        return NextResponse.json({ ok: false, error: "Active platform identity-review permission is required." }, { status: 403 });
      }
      if (detail.includes("no longer open") || detail.includes("55000")) {
        return NextResponse.json({ ok: false, error: "This request is no longer open. Refresh the queue before acting." }, { status: 409 });
      }
      if (detail.includes("not found") || detail.includes("P0002")) {
        return NextResponse.json({ ok: false, error: "Request or candidate reference was not found. Verify the exact candidate reference." }, { status: 404 });
      }
      if (detail.includes("already linked") || detail.includes("23505")) {
        return NextResponse.json({ ok: false, error: "Identity conflict detected. No automatic relinking was performed; escalate for manual resolution." }, { status: 409 });
      }
      if (detail.includes("required") || detail.includes("22023")) {
        return NextResponse.json({ ok: false, error: "The decision details are invalid. No decision was recorded." }, { status: 400 });
      }
      throw new Error("Atomic identity decision failed.");
    }
    const result = await response.json() as Record<string, unknown>;
    return NextResponse.json({ ok: true, result, notice: decision === "APPROVED"
      ? "Identity link verified through the authorised review transaction."
      : decision === "REJECTED" ? "Identity review rejected and audited."
      : "Additional information requested and audited."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
