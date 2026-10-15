import { cookies } from "next/headers";

const ACCESS_COOKIE = "__Host-kingsmen-access-token";

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    return { url: new URL(url).origin, anonKey };
  } catch {
    return null;
  }
}

export async function getCandidateAuthUser() {
  const config = supabaseConfig();
  if (!config) return { configured: false as const, user: null };
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return { configured: true as const, user: null };
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!response.ok) return { configured: true as const, user: null };
  const user = await response.json() as { id?: string; email?: string; aud?: string; role?: string };
  if (!user.id || user.role === "service_role") return { configured: true as const, user: null };
  return { configured: true as const, user };
}

export function supabaseAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    return { url: new URL(url).origin, anonKey };
  } catch {
    return null;
  }
}

export const candidateAccessCookie = ACCESS_COOKIE;
