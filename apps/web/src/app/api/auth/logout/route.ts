import { NextResponse } from "next/server";
import { clearAuthCookies, getSessionTokens, supabaseAuth } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { accessToken } = await getSessionTokens();
  try {
    if (accessToken) await supabaseAuth("logout", {}, accessToken);
  } catch { /* Clear local session even if the provider is unavailable. */ }
  await clearAuthCookies();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
