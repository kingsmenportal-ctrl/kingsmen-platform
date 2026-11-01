/**
 * Candidate identity resolution for API read routes.
 *
 * This deliberately uses only the public Supabase anon key plus the caller's
 * bearer token. The user's JWT must validate with Supabase Auth, and the
 * caller-scoped identity RPC must derive the link only from auth.uid().
 * Missing configuration, network errors, duplicate links, or unverified links
 * fail closed; never fall back to a service-role lookup or a caller-supplied ID.
 */
export type CandidateIdentityResolution =
  | { ok: true; supabaseUserId: string; candidateId: string }
  | { ok: false; status: 401 | 403 | 503; code: string };

type SupabaseUser = { id?: unknown };
type IdentityLink = { candidate_id?: unknown; link_status?: unknown };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BEARER_TOKEN_LENGTH = 8192;
const SUPABASE_REQUEST_TIMEOUT_MS = 8000;

function safeSupabaseOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    const localHost = parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]";
    const secureProtocol = parsed.protocol === "https:";
    const localDevelopmentProtocol = parsed.protocol === "http:" && localHost;
    if (!secureProtocol && !localDevelopmentProtocol) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (parsed.pathname !== "/" && parsed.pathname !== "") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export async function resolveCandidateIdentity(
  authorization: string | undefined,
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch
): Promise<CandidateIdentityResolution> {
  const url = safeSupabaseOrigin(env.SUPABASE_URL);
  const anonKey = env.SUPABASE_ANON_KEY?.trim();
  const match = authorization?.match(/^Bearer\\s+(\\S+)$/i);
  if (!match || match[1].length > MAX_BEARER_TOKEN_LENGTH) {
    return { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED" };
  }
  if (!url || !anonKey) {
    return { ok: false, status: 503, code: "IDENTITY_AUTHORIZATION_NOT_CONFIGURED" };
  }

  const token = match[1];
  try {
    const userResponse = await fetcher(`${url}/auth/v1/user`, {
      method: "GET",
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS)
    });
    if (!userResponse.ok) {
      return { ok: false, status: 401, code: "INVALID_AUTHENTICATION" };
    }
    const user = await userResponse.json() as SupabaseUser;
    if (typeof user.id !== "string" || !UUID_PATTERN.test(user.id)) {
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
        body: "{}",
        signal: AbortSignal.timeout(SUPABASE_REQUEST_TIMEOUT_MS)
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
        typeof link.candidate_id !== "string" || !UUID_PATTERN.test(link.candidate_id)) {
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
