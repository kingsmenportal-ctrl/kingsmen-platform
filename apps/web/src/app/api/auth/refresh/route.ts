import { NextResponse } from "next/server";
import { authUnavailable, clearAuthCookies, getSessionTokens, setAuthCookies, supabaseAuth } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { refreshToken } = await getSessionTokens();
  if (!refreshToken) return NextResponse.json({ ok: false, authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const { response, payload } = await supabaseAuth("token?grant_type=refresh_token", { refresh_token: refreshToken });
    if (!response.ok || typeof payload.access_token !== "string" || typeof payload.refresh_token !== "string") {
      await clearAuthCookies();
      return NextResponse.json({ ok: false, authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    await setAuthCookies(payload.access_token, payload.refresh_token, Number(payload.expires_in || 3600));
    return NextResponse.json({ ok: true, authenticated: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "IDENTITY_PROVIDER_NOT_CONFIGURED") return authUnavailable();
    return NextResponse.json({ ok: false, code: "AUTH_SESSION_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
