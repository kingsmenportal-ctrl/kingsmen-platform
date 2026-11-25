"use client";

export type CandidateSessionState =
  | { status: "ready"; url: string; anonKey: string; token: string }
  | { status: "not_configured" | "missing" | "expired" | "unreadable" };

export function getCandidateSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") return null;
    return { url: parsed.toString().replace(/\\/+$/, ""), anonKey };
  } catch {
    return null;
  }
}

/**
 * Read the shared Supabase browser session in one place so application screens
 * agree on configuration, missing sessions and token expiry.
 */
export function getCandidateSessionState(): CandidateSessionState {
  const config = getCandidateSupabaseConfig();
  if (!config) return { status: "not_configured" };

  let raw: string | null;
  try {
    const projectRef = new URL(config.url).hostname.split(".")[0];
    if (!projectRef) return { status: "not_configured" };
    raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
  } catch {
    return { status: "unreadable" };
  }

  if (!raw) return { status: "missing" };

  let session: Record<string, unknown>;
  try {
    session = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { status: "unreadable" };
  }

  if (typeof session.access_token !== "string" || session.access_token.length <= 20) {
    return { status: "missing" };
  }
  if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) {
    return { status: "expired" };
  }

  return { ...config, status: "ready", token: session.access_token };
}

export function getCandidateAccessToken(): string | null {
  const state = getCandidateSessionState();
  return state.status === "ready" ? state.token : null;
}
