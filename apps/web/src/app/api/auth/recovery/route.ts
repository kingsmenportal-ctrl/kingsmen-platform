import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { authUnavailable, supabaseAuth } from "@/lib/auth/supabase-rest";

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
  if (!email || email.length > 320) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const { response } = await supabaseAuth("recover", { email });
    if (!response.ok) return NextResponse.json({ ok: false, error: "Recovery request could not be submitted." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    // Do not reveal whether the account exists.
    return NextResponse.json({ ok: true, message: "If an account exists for that address, recovery instructions will be sent." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "IDENTITY_PROVIDER_NOT_CONFIGURED") return authUnavailable();
    return NextResponse.json({ ok: false, error: "Recovery provider is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
