import "server-only";

import { getCandidateAuthUser } from "@/lib/supabase-auth";

export type FounderAccess =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

const FOUNDER_ROLES = new Set(["founder", "admin", "super_admin"]);

function normalizedEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Founder authorization trusts only Supabase app_metadata (server-managed) or
 * an explicit server-side email allowlist. user_metadata and request headers
 * are intentionally never treated as an authorization source.
 */
export async function requireFounderAccess(): Promise<FounderAccess> {
  const session = await getCandidateAuthUser();
  if (!session.configured) {
    return { ok: false, status: 503, error: "Founder authentication is not configured." };
  }
  if (!session.user?.id) {
    return { ok: false, status: 401, error: "Sign in is required." };
  }

  const user = session.user as typeof session.user & {
    email?: string;
    app_metadata?: { role?: unknown; roles?: unknown };
  };
  const email = normalizedEmail(user.email);
  const metadata = user.app_metadata;
  const singleRole = typeof metadata?.role === "string" ? metadata.role.toLowerCase() : "";
  const roles = Array.isArray(metadata?.roles)
    ? metadata.roles.filter((role): role is string => typeof role === "string").map((role) => role.toLowerCase())
    : [];
  const hasTrustedRole = FOUNDER_ROLES.has(singleRole) || roles.some((role) => FOUNDER_ROLES.has(role));

  const allowlist = (process.env.KINGSMEN_FOUNDER_EMAILS || "")
    .split(",")
    .map(normalizedEmail)
    .filter(Boolean);
  const explicitlyAllowed = Boolean(email) && allowlist.includes(email);

  if (!hasTrustedRole && !explicitlyAllowed) {
    return { ok: false, status: 403, error: "Founder access is not granted to this account." };
  }

  return { ok: true, userId: user.id, email };
}

export function founderPrivateJson(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  return Response.json(body, { ...init, headers });
}

export function founderAccessDenied(access: Extract<FounderAccess, { ok: false }>): Response {
  return founderPrivateJson({ ok: false, error: access.error }, { status: access.status });
}
