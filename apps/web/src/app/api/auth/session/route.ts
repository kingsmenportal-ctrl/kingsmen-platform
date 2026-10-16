import { NextResponse } from "next/server";
import { getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getVerifiedAuthUser();
    if (!user) return NextResponse.json({ ok: true, authenticated: false }, { headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ ok: true, authenticated: true, user }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, code: "AUTH_SESSION_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
