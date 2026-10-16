import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { authUnavailable, setAuthCookies, supabaseAuth } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Cross-origin request rejected." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
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
