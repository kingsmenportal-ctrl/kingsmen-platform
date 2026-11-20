"use client";

type SupabaseUser = {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export type StoredSupabaseSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: SupabaseUser;
  [key: string]: unknown;
};

function getAuthConfig(): { url: string; anonKey: string; storageKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return null;

  try {
    const parsed = new URL(rawUrl);
    const projectRef = parsed.hostname.split(".")[0];
    if (!projectRef || !parsed.protocol.startsWith("https:") && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
      return null;
    }
    return {
      url: parsed.origin,
      anonKey,
      storageKey: `sb-${projectRef}-auth-token`
    };
  } catch {
    return null;
  }
}

export function saveSupabaseSession(value: unknown): boolean {
  if (typeof window === "undefined" || !value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.access_token !== "string" || !candidate.access_token.trim()) return false;

  const config = getAuthConfig();
  if (!config) return false;
  const expiresIn = typeof candidate.expires_in === "number" ? candidate.expires_in : 3600;
  const expiresAt = typeof candidate.expires_at === "number"
    ? candidate.expires_at
    : Math.floor(Date.now() / 1000) + expiresIn;
  const session: StoredSupabaseSession = {
    ...candidate,
    access_token: candidate.access_token,
    expires_in: expiresIn,
    expires_at: expiresAt
  };

  try {
    window.localStorage.setItem(config.storageKey, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearSupabaseSession(): void {
  if (typeof window === "undefined") return;
  const config = getAuthConfig();
  if (!config) return;
  try {
    window.localStorage.removeItem(config.storageKey);
  } catch {
    // A blocked browser storage implementation is treated as signed out.
  }
}

function readSupabaseSession(): StoredSupabaseSession | null {
  if (typeof window === "undefined") return null;
  const config = getAuthConfig();
  if (!config) return null;
  try {
    const raw = window.localStorage.getItem(config.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSupabaseSession;
    return typeof parsed.access_token === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Reads the browser session and refreshes it shortly before expiry when
 * Supabase Auth provides a refresh token. Only the public anon key is used.
 * The original access token is retained if refresh is temporarily unavailable;
 * the authenticated endpoint remains the authority for accepting/rejecting it.
 */
export async function getValidSupabaseAccessToken(): Promise<string | null> {
  const config = getAuthConfig();
  const session = readSupabaseSession();
  if (!config || !session?.access_token) return null;

  const expiresAt = typeof session.expires_at === "number" ? session.expires_at : 0;
  const shouldRefresh = expiresAt > 0 && expiresAt <= Math.floor(Date.now() / 1000) + 60;
  if (!shouldRefresh || typeof session.refresh_token !== "string" || !session.refresh_token) {
    return session.access_token;
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
      cache: "no-store"
    });
    const refreshed = await response.json().catch(() => null);
    if (response.ok && refreshed && typeof refreshed.access_token === "string") {
      saveSupabaseSession(refreshed);
      return refreshed.access_token as string;
    }
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      clearSupabaseSession();
      return null;
    }
  } catch {
    // Network failure does not delete the stored session; the API will validate it.
  }
  return session.access_token;
}
