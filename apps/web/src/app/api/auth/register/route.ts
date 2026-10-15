import { NextRequest, NextResponse } from "next/server";
import { supabaseAuthConfig } from "@/lib/supabase-auth";

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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 1024) {
    return NextResponse.json({ error: "Enter a valid email and use a password with at least 12 characters." }, { status: 400 });
  }
  let authResponse: Response;
  try {
    authResponse = await fetch(`${config.url}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ error: "Registration service is temporarily unavailable." }, { status: 503 });
  }
  const data = await authResponse.json().catch(() => ({})) as {
    user?: { id?: string; email?: string }; access_token?: string;
    msg?: string; message?: string; error_description?: string;
  };
  if (!authResponse.ok || !data.user?.id) {
    return NextResponse.json({ error: "Registration could not be completed. Check the details or try signing in." }, { status: 400 });
  }
  // Do not auto-link a Supabase identity to an existing candidate record by email.
  // Candidate provisioning and identity binding must be an explicit verified flow.
  return NextResponse.json({
    ok: true,
    requiresEmailVerification: !data.access_token,
    message: data.access_token
      ? "Account created. Candidate profile access is enabled only after verified account provisioning."
      : "Check your email to verify your account before signing in."
  }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
