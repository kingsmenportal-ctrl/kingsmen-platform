"use client";

export function getCandidateAccessToken(): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || typeof window === "undefined") return null;
  try {
    const projectRef = new URL(base).hostname.split(".")[0];
    if (!projectRef) return null;
    const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!raw) return null;
    const session = JSON.parse(raw) as Record<string, unknown>;
    return typeof session.access_token === "string" && session.access_token.length > 20
      ? session.access_token
      : null;
  } catch {
    return null;
  }
}

export function getCandidateSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") return null;
    return { url: parsed.toString().replace(/\/+$/, ""), anonKey };
  } catch {
    return null;
  }
}
