import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthUser = { id?: string };

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !anon || !service) throw new Error("Identity review service is not configured.");
  return { url, anon, service };
}

async function authenticatedUser(request: Request) {
  const { url, anon, service } = config();
  const token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { response: NextResponse.json({ ok: false, error: "Sign in to request candidate identity review." }, { status: 401 }) };
  const result = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store"
  });
  if (!result.ok) return { response: NextResponse.json({ ok: false, error: "Your session is invalid or expired." }, { status: 401 }) };
  const user = await result.json() as AuthUser;
  if (!user.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
    return { response: NextResponse.json({ ok: false, error: "Your account could not be verified." }, { status: 401 }) };
  }
  return { userId: user.id, url, service };
}

function fail(error: unknown) {
  return NextResponse.json({
    ok: false,
    error: error instanceof Error && error.message === "Identity review service is not configured."
      ? error.message : "Identity review request failed safely."
  }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const auth = await authenticatedUser(request);
    if ("response" in auth) return auth.response;
    const result = await fetch(
      `${auth.url}/rest/v1/candidate_identity_review_requests?select=id,candidate_reference,claimant_name,claimant_message,candidate_response,request_status,reviewer_note,created_at,updated_at&supabase_user_id=eq.${encodeURIComponent(auth.userId)}&order=created_at.desc&limit=20`,
      { headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}` }, cache: "no-store" }
    );
    if (!result.ok) throw new Error("Identity review read failed.");
    return NextResponse.json({ ok: true, requests: await result.json() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticatedUser(request);
    if ("response" in auth) return auth.response;
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide a valid JSON request." }, { status: 400 }); }

    const candidateReference = typeof body.candidateReference === "string" ? body.candidateReference.trim() : "";
    const claimantName = typeof body.claimantName === "string" ? body.claimantName.trim() : "";
    const claimantMessage = typeof body.message === "string" ? body.message.trim() : "";
    if (candidateReference.length < 2 || candidateReference.length > 120 ||
        claimantName.length < 2 || claimantName.length > 160 || claimantMessage.length > 1200 ||
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(candidateReference + claimantName + claimantMessage)) {
      return NextResponse.json({ ok: false, error: "Enter a candidate reference (2–120 characters), claimant name (2–160 characters), and message up to 1,200 characters." }, { status: 400 });
    }

    const result = await fetch(`${auth.url}/rest/v1/candidate_identity_review_requests?select=id,candidate_reference,claimant_name,claimant_message,request_status,created_at`, {
      method: "POST",
      headers: {
        apikey: auth.service, Authorization: `Bearer ${auth.service}`,
        "Content-Type": "application/json", Prefer: "return=representation"
      },
      body: JSON.stringify({
        supabase_user_id: auth.userId,
        candidate_reference: candidateReference,
        claimant_name: claimantName,
        claimant_message: claimantMessage,
        request_status: "PENDING"
      }),
      cache: "no-store"
    });
    if (result.status === 409 || result.status === 422) {
      return NextResponse.json({ ok: false, error: "You already have an open identity review request. Check its status before submitting another." }, { status: 409 });
    }
    if (!result.ok) {
      const detail = await result.text().catch(() => "");
      if (detail.includes("candidate_identity_review_one_open_request_per_user") || detail.includes("duplicate key")) {
        return NextResponse.json({ ok: false, error: "You already have an open identity review request. Check its status before submitting another." }, { status: 409 });
      }
      throw new Error("Identity review request could not be persisted.");
    }
    const rows = await result.json() as Array<Record<string, unknown>>;
    if (rows.length !== 1 || rows[0].request_status !== "PENDING") throw new Error("Identity review request was not persisted.");
    return NextResponse.json({
      ok: true,
      request: rows[0],
      notice: "Your request is awaiting authorised review. Submitting this form does not verify your identity or link your account to a candidate record."
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}


export async function PATCH(request: Request) {
  try {
    const auth = await authenticatedUser(request);
    if ("response" in auth) return auth.response;
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide a valid JSON response." }, { status: 400 }); }
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
        message.length < 3 || message.length > 1200) {
      return NextResponse.json({ ok: false, error: "A valid request ID and 3–1,200 character response are required." }, { status: 400 });
    }
    const result = await fetch(`${auth.url}/rest/v1/rpc/respond_candidate_identity_review`, {
      method: "POST",
      headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_request_id: requestId, p_candidate_auth_user_id: auth.userId, p_message: message }),
      cache: "no-store"
    });
    if (!result.ok) {
      const detail = await result.text().catch(() => "");
      if (detail.includes("not found") || detail.includes("P0002")) {
        return NextResponse.json({ ok: false, error: "Review request was not found for this account." }, { status: 404 });
      }
      if (detail.includes("not awaiting candidate information") || detail.includes("55000")) {
        return NextResponse.json({ ok: false, error: "This request is not awaiting additional information. Refresh its status." }, { status: 409 });
      }
      if (detail.includes("22023") || detail.includes("required")) {
        return NextResponse.json({ ok: false, error: "The response is invalid." }, { status: 400 });
      }
      throw new Error("Candidate response could not be recorded.");
    }
    return NextResponse.json({ ok: true, result: await result.json(), notice: "Your response was recorded and the request returned to the authorised review queue." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
