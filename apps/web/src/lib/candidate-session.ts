"use client";

export type CandidateSupabaseConfig = {
  url: string;
  anonKey: string;
  projectRef: string;
  storageKey: string;
};

export type CandidateSessionState =
  | (CandidateSupabaseConfig & { status: "ready"; token: string; email: string | null })
  | { status: "not_configured" | "missing" | "expired" | "unreadable" };

export function getCandidateSupabaseConfig(): CandidateSupabaseConfig | null {
  const sourceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sourceUrl || !anonKey) return null;
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") return null;
    const projectRef = parsed.hostname.split(".")[0];
    if (!projectRef) return null;
    const url = parsed.toString().replace(/\/+$/, "");
    return {
      url,
      anonKey,
      projectRef,
      storageKey: `sb-${projectRef}-auth-token`
    };
  } catch {
    return null;
  }
}

/**
 * Read the shared candidate browser session in one place so every candidate
 * screen agrees on project configuration, the session storage key, token
 * validity and missing/expired/unreadable states.
 */
export function getCandidateSessionState(): CandidateSessionState {
  const config = getCandidateSupabaseConfig();
  if (!config) return { status: "not_configured" };

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(config.storageKey);
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

  const user = session.user && typeof session.user === "object"
    ? session.user as Record<string, unknown>
    : null;
  const email = typeof user?.email === "string" ? user.email : null;
  return { ...config, status: "ready", token: session.access_token, email };
}

export function getCandidateAccessToken(): string | null {
  const state = getCandidateSessionState();
  return state.status === "ready" ? state.token : null;
}
