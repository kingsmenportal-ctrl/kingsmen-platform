import { NextResponse } from "next/server";
import { authConfigured, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Application records require a trusted Supabase-user-to-candidate mapping
 * and candidate-scoped query. Never infer ownership from email or localStorage.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };

  if (!authConfigured()) {
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "IDENTITY_PROVIDER_NOT_CONFIGURED" },
      { status: 503, headers }
    );
  }

  try {
    const user = await getVerifiedAuthUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, status: "SIGNED_OUT", code: "CANDIDATE_AUTH_REQUIRED" },
        { status: 401, headers }
      );
    }

    // The internal API key is server-only. The API independently verifies this
    // service credential and resolves the explicit verified identity link.
    const apiBase = process.env.KINGSMEN_API_BASE_URL;
    const internalKey = process.env.KINGSMEN_WEB_INTERNAL_API_KEY;
    if (!apiBase || !internalKey) {
      return NextResponse.json(
        { ok: false, status: "UNAVAILABLE", code: "APPLICATION_SERVICE_NOT_CONFIGURED" },
        { status: 503, headers }
      );
    }
    let apiUrl: URL;
    try {
      apiUrl = new URL("/api/internal/candidate/applications", apiBase);
      if (apiUrl.protocol !== "https:" && apiUrl.hostname !== "localhost" && apiUrl.hostname !== "127.0.0.1") {
        throw new Error("INTERNAL_API_URL_MUST_USE_HTTPS");
      }
    } catch {
      return NextResponse.json(
        { ok: false, status: "UNAVAILABLE", code: "APPLICATION_SERVICE_URL_INVALID" },
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
      ok?: boolean; code?: string; applications?: unknown[];
    };
    if (apiResponse.status === 403 && payload.code === "CANDIDATE_PROFILE_LINK_REQUIRED") {
      return NextResponse.json(
        { ok: false, status: "UNAVAILABLE", code: "CANDIDATE_PROFILE_LINK_REQUIRED" },
        { status: 503, headers }
      );
    }
    if (!apiResponse.ok || payload.ok !== true || !Array.isArray(payload.applications)) {
      return NextResponse.json(
        { ok: false, status: "UNAVAILABLE", code: "APPLICATION_SERVICE_UNAVAILABLE" },
        { status: 503, headers }
      );
    }
    return NextResponse.json({ ok: true, applications: payload.applications }, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { ok: false, status: "UNAVAILABLE", code: "APPLICATION_ACCESS_CHECK_FAILED" },
      { status: 503, headers }
    );
  }
}
