import "server-only";

type SupabaseUser = { id: string; email?: string };

const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export class WorkspaceAuthError extends Error {
  constructor(message: string, readonly status = 401) { super(message); }
}

function requiredConfig() {
  const url = supabaseUrl().replace(/\/$/, "");
  if (!url || !anonKey() || !serviceKey()) {
    throw new WorkspaceAuthError("Candidate workspace persistence is not configured.", 503);
  }
  return { url, anon: anonKey(), service: serviceKey() };
}

export async function resolveReviewedCandidate(request: Request): Promise<{ candidateId: string; authUserId: string }> {
  const config = requiredConfig();
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new WorkspaceAuthError("Sign in to access your Kingsmen workspace.");

  const authResponse = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.anon, Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!authResponse.ok) throw new WorkspaceAuthError("Your session is invalid or expired.");
  const user = await authResponse.json() as SupabaseUser;
  if (!user?.id) throw new WorkspaceAuthError("Your session could not be verified.");

  const identityResponse = await fetch(
    `${config.url}/rest/v1/candidate_auth_identity_links?select=candidate_id,link_status,verified_at,supabase_user_id&supabase_user_id=eq.${encodeURIComponent(user.id)}&link_status=eq.VERIFIED&verified_at=not.is.null&limit=1`,
    { headers: { apikey: config.service, Authorization: `Bearer ${config.service}` }, cache: "no-store" }
  );
  if (!identityResponse.ok) throw new WorkspaceAuthError("Candidate identity could not be verified.", 503);
  const links = await identityResponse.json() as Array<{ candidate_id: string; supabase_user_id: string }>;
  if (links.length !== 1 || links[0].supabase_user_id !== user.id || !links[0].candidate_id) {
    throw new WorkspaceAuthError("Your account is not linked to a verified candidate record through authorised review.", 403);
  }
  return { candidateId: links[0].candidate_id, authUserId: user.id };
}

export async function truthVaultRequest<T>(table: string, query: string, method = "GET", body?: unknown): Promise<T> {
  const config = requiredConfig();
  const response = await fetch(`${config.url}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      apikey: config.service,
      Authorization: `Bearer ${config.service}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" || method === "PATCH" ? "resolution=merge-duplicates,return=representation" : "return=representation"
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new WorkspaceAuthError(`Truth Vault request failed (${response.status}): ${detail.slice(0, 180)}`, 503);
  }
  if (response.status === 204) return [] as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : []) as T;
}
