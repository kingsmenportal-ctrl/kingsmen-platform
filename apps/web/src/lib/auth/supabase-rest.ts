import { cookies } from "next/headers";

const ACCESS_COOKIE = "kingsmen-access-token";
const REFRESH_COOKIE = "kingsmen-refresh-token";

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}

export function authConfigured() { return config() !== null; }

export function authUnavailable() {
  return Response.json(
    { ok: false, code: "IDENTITY_PROVIDER_NOT_CONFIGURED", error: "Secure account access is unavailable until the approved Supabase Auth project URL and publishable key are configured." },
    { status: 503, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}

export async function supabaseAuth(path: string, body?: unknown, accessToken?: string) {
  const cfg = config();
  if (!cfg) throw new Error("IDENTITY_PROVIDER_NOT_CONFIGURED");
  const response = await fetch(`${cfg.url}/auth/v1/${path.replace(/^\/+/, "")}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey: cfg.key,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function cookieOptions(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge };
}

export function hasValidAuthTokenPair(payload: unknown): payload is { access_token: string; refresh_token: string } {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Record<string, unknown>;
  return typeof value.access_token === "string" &&
    value.access_token.length >= 16 && value.access_token.length <= 16_384 &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.length >= 16 && value.refresh_token.length <= 4_096;
}

export async function setAuthCookies(accessToken: string, refreshToken: string, expiresIn?: number) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, cookieOptions(Math.max(60, Math.min(Number(expiresIn || 3600), 86400))));
  jar.set(REFRESH_COOKIE, refreshToken, cookieOptions(60 * 60 * 24 * 30));
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", cookieOptions(0));
  jar.set(REFRESH_COOKIE, "", cookieOptions(0));
}

export async function getVerifiedAuthUser() {
  const cfg = config();
  if (!cfg) return null;
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) return null;
  // Supabase Auth validates the access token server-side; never trust decoded client claims.
  const { response, payload } = await supabaseAuth("user", undefined, access);
  if (!response.ok || !payload || typeof payload.id !== "string") return null;
  return { id: payload.id as string, email: typeof payload.email === "string" ? payload.email : null };
}

export async function getSessionTokens() {
  const jar = await cookies();
  return { accessToken: jar.get(ACCESS_COOKIE)?.value || null, refreshToken: jar.get(REFRESH_COOKIE)?.value || null };
}
