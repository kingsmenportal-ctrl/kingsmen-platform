import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { readAuthJson } from "@/lib/auth/request-body";
import { authUnavailable, setAuthCookies, supabaseAuth } from "@/lib/auth/supabase-rest";
import { hasValidAuthTokenPair } from "@/lib/auth/token-bounds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Cross-origin request rejected." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const parsed = await readAuthJson(request);
  if (!parsed.ok) {
    const message = parsed.code === "JSON_REQUIRED" ? "Send a JSON request." : parsed.code === "REQUEST_TOO_LARGE" ? "Request is too large." : "Invalid request.";
    return NextResponse.json({ ok: false, code: parsed.code, error: message }, { status: parsed.status, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
  }
  const body = parsed.value;
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const password = typeof value.password === "string" ? value.password : "";
  if (!email || !password || email.length > 320 || password.length > 1024) {
    return NextResponse.json({ ok: false, error: "Enter a valid email and password." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { response, payload } = await supabaseAuth("token?grant_type=password", { email, password });
    if (!response.ok || !hasValidAuthTokenPair(payload)) {
      return NextResponse.json({ ok: false, error: "Sign-in failed. Check your details or confirm your email address." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    await setAuthCookies(payload.access_token, payload.refresh_token, Number(payload.expires_in || 3600));
    return NextResponse.json({ ok: true, user: { id: payload.user?.id, email: payload.user?.email } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "IDENTITY_PROVIDER_NOT_CONFIGURED") return authUnavailable();
    return NextResponse.json({ ok: false, error: "Authentication provider is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
