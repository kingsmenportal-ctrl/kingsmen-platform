export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };
const cookieName = "km_candidate_access_token";

function authConfig() {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/+$/, ""),
    anonKey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "cross_origin_request_rejected" }, { status: 403, headers: noStore });
  }
  const { url, anonKey } = authConfig();
  if (!url || !anonKey) {
    return Response.json({ error: "candidate_email_auth_not_configured" }, { status: 503, headers: noStore });
  }
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return Response.json({ error: "valid_email_required" }, { status: 400, headers: noStore });
  }

  if (action === "send_code") {
    try {
      await fetch(url + "/auth/v1/otp", {
        method: "POST",
        headers: { apikey: anonKey, "content-type": "application/json" },
        body: JSON.stringify({ email, create_user: false }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000)
      });
      return Response.json({ ok: true, message: "If an existing Kingsmen account matches this email, a sign-in code has been sent." }, { status: 200, headers: noStore });
    } catch {
      return Response.json({ error: "candidate_email_auth_unavailable" }, { status: 503, headers: noStore });
    }
  }

  if (action !== "verify_code") return Response.json({ error: "unsupported_auth_action" }, { status: 400, headers: noStore });
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!/^\d{6,8}$/.test(code)) return Response.json({ error: "valid_email_code_required" }, { status: 400, headers: noStore });

  try {
    const response = await fetch(url + "/auth/v1/verify", {
      method: "POST",
      headers: { apikey: anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, token: code, type: "email" }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || typeof result?.access_token !== "string" || typeof result?.user?.id !== "string") {
      return Response.json({ error: "email_code_invalid_or_expired" }, { status: 401, headers: noStore });
    }
    const maxAge = Math.max(60, Math.min(Number(result.expires_in ?? 3600), 3600));
    const headers = new Headers(noStore);
    headers.append("set-cookie", cookieName + "=" + result.access_token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + maxAge);
    return Response.json({ ok: true, user: { id: result.user.id, email: result.user.email ?? email }, expiresIn: maxAge }, { status: 200, headers });
  } catch {
    return Response.json({ error: "candidate_email_auth_unavailable" }, { status: 503, headers: noStore });
  }
}

export async function DELETE(request: Request) {
  const headers = new Headers(noStore);
  headers.append("set-cookie", cookieName + "=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return Response.json({ ok: true }, { status: 200, headers });
}
