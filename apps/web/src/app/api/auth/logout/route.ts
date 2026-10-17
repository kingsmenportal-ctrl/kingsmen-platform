import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { clearAuthCookies, getSessionTokens, supabaseAuth } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { ok: false, code: "CSRF_ORIGIN_REJECTED" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { accessToken } = await getSessionTokens();
  try {
    if (accessToken) await supabaseAuth("logout", {}, accessToken);
  } catch { /* Clear local session even if the provider is unavailable. */ }
  await clearAuthCookies();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
