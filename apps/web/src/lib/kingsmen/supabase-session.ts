"use client";

export type KingsmenSupabaseBrowserConfig = { url: string; anonKey: string; storageKey: string };

type StoredSession = {
  access_token?: unknown; refresh_token?: unknown; token_type?: unknown;
  expires_in?: unknown; expires_at?: unknown; user?: unknown;
};
type AuthResponse = {
  access_token?: unknown; refresh_token?: unknown; token_type?: unknown;
  expires_in?: unknown; expires_at?: unknown; user?: unknown;
  msg?: string; message?: string; error?: string; error_description?: string;
};

export function getKingsmenSupabaseBrowserConfig(): KingsmenSupabaseBrowserConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    if (!projectRef || !/^[a-z0-9.-]+$/i.test(projectRef)) return null;
    return { url, anonKey, storageKey: "sb-" + projectRef + "-auth-token" };
  } catch { return null; }
}

function readSession(config: KingsmenSupabaseBrowserConfig): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(config.storageKey);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value as StoredSession : null;
  } catch { return null; }
}

function persistSession(config: KingsmenSupabaseBrowserConfig, value: AuthResponse): void {
  if (typeof window === "undefined" || typeof value.access_token !== "string" || !value.access_token) {
    throw new Error("Supabase did not return a usable signed-in session.");
  }
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = typeof value.expires_in === "number" && Number.isFinite(value.expires_in) ? value.expires_in : 3600;
  const expiresAt = typeof value.expires_at === "number" && Number.isFinite(value.expires_at) ? value.expires_at : now + expiresIn;
  const session: Record<string, unknown> = {
    access_token: value.access_token,
    token_type: typeof value.token_type === "string" ? value.token_type : "bearer",
    expires_in: expiresIn,
    expires_at: expiresAt
  };
  if (typeof value.refresh_token === "string" && value.refresh_token) session.refresh_token = value.refresh_token;
  if (value.user && typeof value.user === "object") session.user = value.user;
  window.localStorage.setItem(config.storageKey, JSON.stringify(session));
}

export function saveKingsmenSupabaseSessionFromTokens(value: AuthResponse): void {
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config) throw new Error("Kingsmen sign-in is not configured for this deployment.");
  persistSession(config, value);
}

export function acceptKingsmenSupabaseAuthCallback(hash: string): { type: string | null; error: string | null; hasSession: boolean } {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const error = params.get("error_description") || params.get("error");
  const type = params.get("type");
  if (error) return { type, error: error.replace(/\+/g, " "), hasSession: false };
  const accessToken = params.get("access_token");
  if (!accessToken) return { type, error: "This link is missing its sign-in token or has expired. Request a new link and try again.", hasSession: false };
  const expiresIn = Number(params.get("expires_in") || "3600");
  const expiresAt = Number(params.get("expires_at") || String(Math.floor(Date.now() / 1000) + expiresIn));
  saveKingsmenSupabaseSessionFromTokens({
    access_token: accessToken,
    refresh_token: params.get("refresh_token") || undefined,
    token_type: params.get("token_type") || "bearer",
    expires_in: Number.isFinite(expiresIn) ? expiresIn : 3600,
    expires_at: Number.isFinite(expiresAt) ? expiresAt : Math.floor(Date.now() / 1000) + 3600
  });
  return { type, error: null, hasSession: true };
}

async function authRequest(config: KingsmenSupabaseBrowserConfig, path: string, method: "GET" | "POST" | "PUT", payload?: Record<string, unknown>, token?: string): Promise<AuthResponse> {
  const headers: Record<string, string> = { apikey: config.anonKey, "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  let response: Response;
  try {
    response = await fetch(config.url + "/auth/v1/" + path, {
      method, headers, ...(payload ? { body: JSON.stringify(payload) } : {}), cache: "no-store"
    });
  } catch {
    throw new Error("Kingsmen could not reach the sign-in service. Check your connection and try again.");
  }
  const body = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok) {
    const message = body.msg || body.message || body.error_description || body.error;
    throw new Error(typeof message === "string" ? message : "Authentication failed (" + response.status + ").");
  }
  return body;
}

export async function signInKingsmenWithPassword(email: string, password: string): Promise<void> {
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config) throw new Error("Kingsmen sign-in is not configured for this deployment.");
  const result = await authRequest(config, "token?grant_type=password", "POST", { email: email.trim().toLowerCase(), password });
  persistSession(config, result);
}

export async function registerKingsmenWithPassword(email: string, password: string): Promise<{ sessionCreated: boolean }> {
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config) throw new Error("Kingsmen registration is not configured for this deployment.");
  const redirectTo = window.location.origin + "/auth/callback";
  const result = await authRequest(config, "signup?redirect_to=" + encodeURIComponent(redirectTo), "POST", {
    email: email.trim().toLowerCase(), password
  });
  if (typeof result.access_token === "string" && result.access_token) {
    persistSession(config, result);
    return { sessionCreated: true };
  }
  return { sessionCreated: false };
}

export async function requestKingsmenPasswordReset(email: string): Promise<void> {
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config) throw new Error("Kingsmen password reset is not configured for this deployment.");
  const redirectTo = window.location.origin + "/auth/callback";
  await authRequest(config, "recover?redirect_to=" + encodeURIComponent(redirectTo), "POST", { email: email.trim().toLowerCase() });
}

export async function updateKingsmenPassword(password: string): Promise<void> {
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config) throw new Error("Kingsmen password recovery is not configured for this deployment.");
  const token = await getKingsmenSupabaseAccessToken();
  if (!token) throw new Error("The recovery session expired. Request a new password-reset email.");
  await authRequest(config, "user", "PUT", { password }, token);
}

export async function signOutKingsmen(): Promise<void> {
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config) return;
  const token = await getKingsmenSupabaseAccessToken();
  try {
    if (token) await authRequest(config, "logout", "POST", undefined, token);
  } finally {
    if (typeof window !== "undefined") window.localStorage.removeItem(config.storageKey);
  }
}

/** Return the configured-project token, refreshing it when it is close to expiry. */
export async function getKingsmenSupabaseAccessToken(): Promise<string | null> {
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config || typeof window === "undefined") return null;
  const session = readSession(config);
  const token = typeof session?.access_token === "string" ? session.access_token : "";
  if (!token) return null;
  const expiresAt = typeof session?.expires_at === "number" ? session.expires_at : 0;
  const now = Date.now();
  if (!expiresAt || expiresAt * 1000 > now + 60_000) return token;
  const refreshToken = typeof session?.refresh_token === "string" ? session.refresh_token : "";
  if (!refreshToken) {
    if (expiresAt * 1000 > now) return token;
    window.localStorage.removeItem(config.storageKey);
    return null;
  }
  try {
    const refreshed = await authRequest(config, "token?grant_type=refresh_token", "POST", { refresh_token: refreshToken });
    persistSession(config, refreshed);
    return typeof refreshed.access_token === "string" ? refreshed.access_token : null;
  } catch {
    if (expiresAt * 1000 > now) return token;
    window.localStorage.removeItem(config.storageKey);
    return null;
  }
}
