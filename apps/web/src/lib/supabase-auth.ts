import { cookies } from "next/headers";

const ACCESS_COOKIE = "kingsmen-access-token";
const AUTH_LOOKUP_TIMEOUT_MS = 5_000;

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return null;
    return { url: parsed.origin, anonKey };
  } catch {
    return null;
  }
}

export async function getCandidateAuthUser() {
  const config = supabaseConfig();
  if (!config) return { configured: false as const, user: null };
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  // Avoid sending malformed or unexpectedly large cookie values to the Auth service.
  if (!token || token.length > 8_192 || !/^[A-Za-z0-9._~-]+$/.test(token)) {
    return { configured: true as const, user: null };
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(AUTH_LOOKUP_TIMEOUT_MS)
    });
    if (!response.ok) return { configured: true as const, user: null };
    const user = await response.json() as { id?: string; email?: string; aud?: string; role?: string; app_metadata?: { role?: unknown; roles?: unknown }; user_metadata?: Record<string, unknown> };
    if (!user.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id) || user.role === "service_role") return { configured: true as const, user: null };
    return { configured: true as const, user };
  } catch {
    // Auth-service outages/timeouts fail closed rather than breaking API handlers.
    return { configured: true as const, user: null };
  }
}

export function supabaseAuthConfig() {
  return supabaseConfig();
}

export const candidateAccessCookie = ACCESS_COOKIE;
