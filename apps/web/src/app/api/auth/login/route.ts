import { NextRequest, NextResponse } from "next/server";
import { candidateAccessCookie, supabaseAuthConfig } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const config = supabaseAuthConfig();
  if (!config) return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 1024) {
    return NextResponse.json({ error: "Enter a valid email and password of at least 8 characters." }, { status: 400 });
  }
  let authResponse: Response;
  try {
    authResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ error: "Authentication service is temporarily unavailable." }, { status: 503 });
  }
  const data = await authResponse.json().catch(() => ({})) as {
    access_token?: string; expires_in?: number; user?: { id?: string; email?: string };
    msg?: string; message?: string; error_description?: string;
  };
  if (!authResponse.ok || !data.access_token || !data.user?.id) {
    return NextResponse.json({ error: "Sign-in failed. Check your details and email verification." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email } });
  response.cookies.set(candidateAccessCookie, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.min(Math.max(data.expires_in || 3600, 60), 86400)
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
