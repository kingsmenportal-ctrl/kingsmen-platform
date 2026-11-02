const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SupabaseBearerAuthentication =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 503; code: string; message: string };

function configuredSupabase(): { url: string; anonKey: string } | null {
  const rawUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) return null;
    return { url: parsed.toString().replace(/\/+$/, ""), anonKey };
  } catch {
    return null;
  }
}

/**
 * Validates a Supabase access token with Auth. Candidate ownership is resolved
 * separately through the backend-only verified Auth-user -> candidate ledger.
 * Candidate IDs supplied by HTTP clients are never used to establish identity.
 */
export async function authenticateSupabaseBearer(
  authorizationHeader: string | undefined
): Promise<SupabaseBearerAuthentication> {
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorizationHeader ?? "");
  if (!match || match[1].length < 20 || match[1].length > 8192) {
    return { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED", message: "A valid sign-in session is required." };
  }

  const config = configuredSupabase();
  if (!config) {
    return { ok: false, status: 503, code: "AUTHENTICATION_NOT_CONFIGURED", message: "Authenticated candidate reads are not configured." };
  }

  try {
    const response = await fetch(config.url + "/auth/v1/user", {
      method: "GET",
      headers: {
        apikey: config.anonKey,
        Authorization: "Bearer " + match[1],
        Accept: "application/json"
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000)
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, status: 401, code: "INVALID_SESSION", message: "The sign-in session is invalid or expired." };
    }
    if (!response.ok) {
      return { ok: false, status: 503, code: "AUTH_PROVIDER_UNAVAILABLE", message: "The sign-in service could not verify this session." };
    }
    const body = await response.json() as { id?: unknown };
    if (typeof body?.id !== "string" || !UUID_PATTERN.test(body.id)) {
      return { ok: false, status: 401, code: "INVALID_SESSION", message: "The sign-in session did not resolve to a valid Auth identity." };
    }
    return { ok: true, userId: body.id };
  } catch {
    return { ok: false, status: 503, code: "AUTH_PROVIDER_UNAVAILABLE", message: "The sign-in service could not verify this session." };
  }
}
