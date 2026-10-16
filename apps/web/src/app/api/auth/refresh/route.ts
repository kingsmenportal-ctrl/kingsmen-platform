import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { authConfigured, authUnavailable, clearAuthCookies, getSessionTokens, setAuthCookies, supabaseAuth } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { ok: false, code: "CSRF_ORIGIN_REJECTED" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!authConfigured()) return authUnavailable();
  const { refreshToken } = await getSessionTokens();
  if (!refreshToken || refreshToken.length > 4096) {
    await clearAuthCookies();
    return NextResponse.json({ ok: false, code: "AUTH_SESSION_REQUIRED", authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
  }
  try {
    const { response, payload } = await supabaseAuth("token?grant_type=refresh_token", { refresh_token: refreshToken });
    if (!response.ok || typeof payload.access_token !== "string" || payload.access_token.length < 16 || payload.access_token.length > 16384 || typeof payload.refresh_token !== "string" || payload.refresh_token.length < 16 || payload.refresh_token.length > 4096) {
      await clearAuthCookies();
      return NextResponse.json({ ok: false, code: "AUTH_SESSION_EXPIRED", authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }
    const expiresIn = Number(payload.expires_in);
    await setAuthCookies(payload.access_token, payload.refresh_token, Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600);
    return NextResponse.json({ ok: true, authenticated: true }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
  } catch (error) {
    if (error instanceof Error && error.message === "IDENTITY_PROVIDER_NOT_CONFIGURED") return authUnavailable();
    // Preserve the local refresh cookie during transient provider/network failures.
    return NextResponse.json({ ok: false, code: "AUTH_REFRESH_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
  }
}
