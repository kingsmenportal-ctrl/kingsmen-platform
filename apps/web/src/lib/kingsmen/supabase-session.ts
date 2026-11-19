"use client";

export type KingsmenSupabaseBrowserConfig = {
  url: string;
  anonKey: string;
  storageKey: string;
};

export function getKingsmenSupabaseBrowserConfig(): KingsmenSupabaseBrowserConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  try {
    const hostname = new URL(url).hostname;
    const projectRef = hostname.split(".")[0];
    if (!projectRef || !/^[a-z0-9.-]+$/i.test(projectRef)) return null;
    return { url, anonKey, storageKey: `sb-${projectRef}-auth-token` };
  } catch {
    return null;
  }
}

/**
 * Reads only the Supabase session belonging to the project configured for this
 * frontend. It deliberately does not scan/fall back to other project sessions.
 */
export function getKingsmenSupabaseAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const config = getKingsmenSupabaseBrowserConfig();
  if (!config) return null;

  try {
    const raw = window.localStorage.getItem(config.storageKey);
    if (!raw) return null;
    const session: unknown = JSON.parse(raw);
    if (!session || typeof session !== "object") return null;
    const token = (session as { access_token?: unknown }).access_token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}
