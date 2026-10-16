import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { readAuthJson } from "@/lib/auth/request-body";
import { authUnavailable, setAuthCookies, supabaseAuth } from "@/lib/auth/supabase-rest";

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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 || password.length < 12 || password.length > 1024) {
    return NextResponse.json({ ok: false, error: "Enter a valid email and a password of at least 12 characters." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { response, payload } = await supabaseAuth("signup", { email, password });
    if (!response.ok) return NextResponse.json({ ok: false, error: "Registration could not be completed. Check the details or try again later." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (typeof payload.access_token === "string" && typeof payload.refresh_token === "string") {
      await setAuthCookies(payload.access_token, payload.refresh_token, Number(payload.expires_in || 3600));
      return NextResponse.json({ ok: true, confirmationRequired: false }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: true, confirmationRequired: true, message: "Check your email to confirm your account before signing in." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "IDENTITY_PROVIDER_NOT_CONFIGURED") return authUnavailable();
    return NextResponse.json({ ok: false, error: "Registration provider is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
