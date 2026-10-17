import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports only whether the server verified the Supabase Auth session.
 * This deliberately does not claim that a candidate profile or application
 * record is linked; that requires an explicit identity mapping.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store", Pragma: "no-cache" };

  if (!authConfigured()) {
    return NextResponse.json(
      { ok: false, authenticated: false, candidateRecordLinked: false, status: "UNAVAILABLE", code: "IDENTITY_PROVIDER_NOT_CONFIGURED" },
      { status: 503, headers }
    );
  }

  try {
    const user = await getVerifiedAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: true, authenticated: false, candidateRecordLinked: false, status: "SIGNED_OUT" },
        { status: 401, headers }
      );
    }

    const apiBase = process.env.KINGSMEN_API_BASE_URL;
    const internalKey = process.env.KINGSMEN_WEB_INTERNAL_API_KEY;
    if (!apiBase || !internalKey) {
      return NextResponse.json(
        { ok: false, authenticated: true, candidateRecordLinked: false, status: "UNAVAILABLE", code: "CANDIDATE_LINK_SERVICE_NOT_CONFIGURED" },
        { status: 503, headers }
      );
    }

    let apiUrl: URL;
    try {
      apiUrl = new URL("/api/internal/candidate/session", apiBase);
      if (apiUrl.protocol !== "https:" && apiUrl.hostname !== "localhost" && apiUrl.hostname !== "127.0.0.1") {
        throw new Error("INTERNAL_API_URL_MUST_USE_HTTPS");
      }
    } catch {
      return NextResponse.json(
        { ok: false, authenticated: true, candidateRecordLinked: false, status: "UNAVAILABLE", code: "CANDIDATE_LINK_SERVICE_URL_INVALID" },
        { status: 503, headers }
      );
    }

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kingsmen-Internal-Key": internalKey },
      body: JSON.stringify({ supabaseUserId: user.id }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const payload = await apiResponse.json().catch(() => ({})) as {
      ok?: boolean;
      candidateRecordLinked?: boolean;
    };
    if (!apiResponse.ok || payload.ok !== true || typeof payload.candidateRecordLinked !== "boolean") {
      return NextResponse.json(
        { ok: false, authenticated: true, candidateRecordLinked: false, status: "UNAVAILABLE", code: "CANDIDATE_LINK_CHECK_FAILED" },
        { status: 503, headers }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        authenticated: true,
        candidateRecordLinked: payload.candidateRecordLinked,
        status: payload.candidateRecordLinked ? "AUTHENTICATED_LINKED" : "AUTHENTICATED_PROFILE_NOT_LINKED"
      },
      { status: 200, headers }
    );
  } catch {
    return NextResponse.json(
      { ok: false, authenticated: false, candidateRecordLinked: false, status: "UNAVAILABLE", code: "SESSION_VERIFICATION_FAILED" },
      { status: 503, headers }
    );
  }
}
