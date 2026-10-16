/**
 * User-context Supabase REST adapter.
 *
 * Calls Supabase Auth to validate the caller's access token, then calls PostgREST with
 * that same token so auth.uid() and RLS evaluate as the real user. Never substitute the
 * service-role key for a user's bearer token.
 */
export type SupabaseUser = { id: string; email?: string };
export type SupabaseConfig = { url: string; anonKey: string };

export function supabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("SUPABASE_USER_AUTH_NOT_CONFIGURED");
  return { url: url.replace(/\/$/, ""), anonKey };
}

export async function authenticateSupabaseUser(accessToken: string): Promise<SupabaseUser> {
  if (!accessToken || accessToken.length > 8192) throw new Error("UNAUTHENTICATED");
  const config = supabaseConfig();
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.anonKey, authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("UNAUTHENTICATED");
  const payload = await response.json() as { id?: unknown; email?: unknown };
  if (typeof payload.id !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.id)) throw new Error("UNAUTHENTICATED");
  return { id: payload.id, ...(typeof payload.email === "string" ? { email: payload.email } : {}) };
}

export async function supabaseUserRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const config = supabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(init.headers ?? {})
    },
    signal: init.signal ?? AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    // Do not return provider response bodies; they can contain SQL/schema details.
    throw new Error(response.status === 401 || response.status === 403 ? "FORBIDDEN" : "DATABASE_OPERATION_FAILED");
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export function bearerToken(header: string | undefined): string {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  if (!match) throw new Error("UNAUTHENTICATED");
  return match[1];
}
