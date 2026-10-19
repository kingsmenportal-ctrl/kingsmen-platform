export type AuthenticatedPortalUser = { id: string; email: string; emailConfirmed: boolean; accessToken: string };
type PortalSupabaseConfig = { url: string; anonKey: string };

export function portalSupabaseConfig(): PortalSupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
}

export async function requirePortalUser(request: Request): Promise<
  | { ok: true; config: PortalSupabaseConfig; user: AuthenticatedPortalUser }
  | { ok: false; status: number; code: string; message: string }
> {
  const cfg = portalSupabaseConfig();
  if (!cfg) return { ok: false, status: 503, code: "SUPABASE_NOT_CONFIGURED", message: "Portal identity services are not configured." };
  const accessToken = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!accessToken) return { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED", message: "Sign in to continue." };
  let response: Response;
  try { response = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.anonKey, authorization: `Bearer ${accessToken}` }, cache: "no-store" }); }
  catch { return { ok: false, status: 503, code: "AUTH_PROVIDER_UNAVAILABLE", message: "The identity provider could not be reached." }; }
  if (!response.ok) return { ok: false, status: 401, code: "INVALID_SESSION", message: "Your session is invalid or expired. Sign in again." };
  const raw = await response.json().catch(() => null) as { id?: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null } | null;
  if (!raw?.id || !raw.email) return { ok: false, status: 401, code: "INVALID_IDENTITY", message: "The identity provider returned an incomplete user record." };
  const emailConfirmed = Boolean(raw.email_confirmed_at || raw.confirmed_at);
  if (!emailConfirmed) return { ok: false, status: 403, code: "EMAIL_CONFIRMATION_REQUIRED", message: "Confirm your email address before using organisation tools." };
  return { ok: true, config: cfg, user: { id: raw.id, email: raw.email.toLowerCase(), emailConfirmed, accessToken } };
}

export async function supabaseUserFetch(cfg: PortalSupabaseConfig, accessToken: string, pathname: string, init: RequestInit = {}) {
  return fetch(`${cfg.url}${pathname}`, {
    ...init,
    headers: { apikey: cfg.anonKey, authorization: `Bearer ${accessToken}`, ...(init.headers || {}) },
    cache: "no-store"
  });
}
