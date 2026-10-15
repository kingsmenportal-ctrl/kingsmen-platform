import { NextRequest, NextResponse } from "next/server";
import { candidateAccessCookie, getCandidateAuthUser } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCandidateAuthUser();
  const response = NextResponse.json({
    configured: session.configured,
    authenticated: Boolean(session.user),
    user: session.user ? { id: session.user.id, email: session.user.email } : null
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(candidateAccessCookie)?.value;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(candidateAccessCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (token && url && key) {
    try {
      await fetch(`${new URL(url).origin}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000)
      });
    } catch {
      // The local cookie is cleared even if the remote revoke endpoint is unavailable.
    }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
