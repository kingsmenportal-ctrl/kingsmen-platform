/**
 * Candidate identity resolution for API read routes.
 *
 * This deliberately uses only the public Supabase anon key plus the caller's
 * bearer token. The user's JWT must validate with Supabase Auth, and the
 * identity-link lookup must be visible under the caller's own RLS permissions.
 * Missing configuration, network errors, duplicate links, or unverified links
 * fail closed; never fall back to a service-role lookup or a caller-supplied ID.
 */
export type CandidateIdentityResolution =
  | { ok: true; supabaseUserId: string; candidateId: string }
  | { ok: false; status: 401 | 403 | 503; code: string };

type SupabaseUser = { id?: unknown };
type IdentityLink = { candidate_id?: unknown; link_status?: unknown };

export async function resolveCandidateIdentity(
  authorization: string | undefined,
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch
): Promise<CandidateIdentityResolution> {
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = env.SUPABASE_ANON_KEY;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED" };
  if (!url || !anonKey) {
    return { ok: false, status: 503, code: "IDENTITY_AUTHORIZATION_NOT_CONFIGURED" };
  }

  const token = match[1];
  try {
    const userResponse = await fetcher(`${url}/auth/v1/user`, {
      method: "GET",
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` }
    });
    if (!userResponse.ok) {
      return { ok: false, status: 401, code: "INVALID_AUTHENTICATION" };
    }
    const user = await userResponse.json() as SupabaseUser;
    if (typeof user.id !== "string" || !user.id.trim()) {
      return { ok: false, status: 401, code: "INVALID_AUTHENTICATION" };
    }

    // The table is intentionally not directly readable by anon/authenticated.
    // This no-argument RPC returns only the current auth.uid()'s verified link,
    // and only when exactly one link row exists for that identity.
    const linkResponse = await fetcher(
      `${url}/rest/v1/rpc/resolve_my_candidate_identity`,
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: "{}"
      }
    );
    if (!linkResponse.ok) {
      return { ok: false, status: 503, code: "IDENTITY_LINK_LOOKUP_FAILED" };
    }
    const links = await linkResponse.json() as IdentityLink[];
    if (!Array.isArray(links) || links.length !== 1) {
      return { ok: false, status: 403, code: "VERIFIED_IDENTITY_LINK_REQUIRED" };
    }
    const link = links[0];
    if (link.link_status !== "VERIFIED" ||
        typeof link.candidate_id !== "string" || !link.candidate_id.trim()) {
      return { ok: false, status: 403, code: "VERIFIED_IDENTITY_LINK_REQUIRED" };
    }
    return { ok: true, supabaseUserId: user.id, candidateId: link.candidate_id };
  } catch {
    return { ok: false, status: 503, code: "IDENTITY_AUTHORIZATION_UNAVAILABLE" };
  }
}

/** Ownership predicate shared by candidate and application read routes. */
export function candidateOwnsResource(
  identity: CandidateIdentityResolution,
  resourceCandidateId: string | null | undefined
): boolean {
  return identity.ok && typeof resourceCandidateId === "string" &&
    resourceCandidateId.length > 0 && identity.candidateId === resourceCandidateId;
}
