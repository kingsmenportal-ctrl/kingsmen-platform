"use client";

export type KingsmenSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: { id: string; email?: string; email_confirmed_at?: string | null };
};

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.KINGSMEN_PUBLIC_SUPABASE_URL)?.trim().replace(/\/+$/, "");
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.KINGSMEN_PUBLIC_SUPABASE_KEY)?.trim();
  if (!url || !anonKey) throw new Error("Sign-in is not configured on this deployment. Set the public Supabase URL and anon/publishable key in the Netlify build environment.");
  const projectRef = new URL(url).hostname.split(".")[0];
  return { url, anonKey, storageKey: `sb-${projectRef}-auth-token` };
}

function readStoredSession(): KingsmenSession | null {
  if (typeof window === "undefined") return null;
  try {
    const cfg = config();
    const raw = window.localStorage.getItem(cfg.storageKey);
    if (!raw) return null;
    const session = JSON.parse(raw) as KingsmenSession;
    if (!session.access_token || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

export function readKingsmenSession(): KingsmenSession | null {
  const session = readStoredSession();
  if (!session) return null;
  if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000)) return null;
  return session;
}

export async function getKingsmenSession(): Promise<KingsmenSession | null> {
  const session = readStoredSession();
  if (!session) return null;
  const expiresAt = session.expires_at || 0;
  if (expiresAt > Math.floor(Date.now() / 1000) + 60) return session;
  if (!session.refresh_token) { clearKingsmenSession(); return null; }
  try {
    const cfg = config();
    const response = await fetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: cfg.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
      cache: "no-store"
    });
    const next = await response.json().catch(() => ({})) as Partial<KingsmenSession>;
    if (!response.ok || !next.access_token || !next.user?.id) { clearKingsmenSession(); return null; }
    const normalized = { ...session, ...next } as KingsmenSession;
    storeKingsmenSession(normalized);
    return readKingsmenSession();
  } catch {
    return session.expires_at && session.expires_at > Math.floor(Date.now() / 1000) ? session : null;
  }
}

export async function signOutKingsmen() {
  const session = readStoredSession();
  if (session?.access_token) {
    try {
      const cfg = config();
      await fetch(`${cfg.url}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: cfg.anonKey, authorization: `Bearer ${session.access_token}` },
        cache: "no-store"
      });
    } catch {}
  }
  clearKingsmenSession();
}

export function storeKingsmenSession(session: KingsmenSession) {
  const cfg = config();
  const expiresIn = Number(session.expires_in || 3600);
  const normalized = { ...session, expires_at: session.expires_at || Math.floor(Date.now() / 1000) + expiresIn };
  window.localStorage.setItem(cfg.storageKey, JSON.stringify(normalized));
  window.dispatchEvent(new Event("kingsmen-auth-change"));
}

export function clearKingsmenSession() {
  try {
    window.localStorage.removeItem(config().storageKey);
  } catch {}
  window.dispatchEvent(new Event("kingsmen-auth-change"));
}

export async function supabaseAuth(path: "signup" | "token?grant_type=password" | "logout", payload?: Record<string, unknown>) {
  const cfg = config();
  const response = await fetch(`${cfg.url}/auth/v1/${path}`, {
    method: path === "logout" ? "POST" : "POST",
    headers: { apikey: cfg.anonKey, "content-type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data.msg === "string" ? data.msg : typeof data.message === "string" ? data.message : typeof data.error_description === "string" ? data.error_description : "Authentication could not be completed.";
    throw new Error(message);
  }
  return data as Record<string, unknown>;
}

export async function linkCandidateAccount(candidateReference = "", displayName = "") {
  const session = readKingsmenSession();
  if (!session) throw new Error("Sign in again before linking your candidate account.");
  const response = await fetch("/api/auth/link-candidate", {
    method: "POST",
    headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ candidateReference, displayName }),
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 202) throw new Error(typeof result.error === "string" ? result.error : "Candidate account linking could not be completed.");
  return result as { linked?: boolean; status?: string; message?: string };
}
