import { randomUUID } from "node:crypto";

export type CandidateSession = {
  userId: string;
  candidateId: string;
};

type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  documentsBucket: string;
};

function config(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceRoleKey) return null;
  return {
    url,
    anonKey,
    serviceRoleKey,
    documentsBucket: process.env.SUPABASE_DOCUMENTS_BUCKET?.trim() || "candidate-documents"
  };
}

export function createDocumentUploadId(): string {
  return randomUUID();
}

export async function requireCandidateSession(request: Request): Promise<
  | { ok: true; config: SupabaseConfig; session: CandidateSession }
  | { ok: false; status: number; code: string; message: string }
> {
  const cfg = config();
  if (!cfg) {
    return {
      ok: false,
      status: 503,
      code: "SUPABASE_NOT_CONFIGURED",
      message: "Candidate data services are not configured on this deployment."
    };
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: "AUTHENTICATION_REQUIRED",
      message: "Sign in and send the current Supabase access token."
    };
  }

  let userResponse: Response;
  try {
    userResponse = await fetch(`${cfg.url}/auth/v1/user`, {
      method: "GET",
      headers: { apikey: cfg.anonKey, authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  } catch {
    return {
      ok: false,
      status: 503,
      code: "AUTH_PROVIDER_UNAVAILABLE",
      message: "Kingsmen could not verify the current sign-in session."
    };
  }

  if (!userResponse.ok) {
    return {
      ok: false,
      status: 401,
      code: "INVALID_SESSION",
      message: "The sign-in session is invalid or expired. Sign in again."
    };
  }

  const user = (await userResponse.json().catch(() => null)) as { id?: string } | null;
  if (!user?.id) {
    return {
      ok: false,
      status: 401,
      code: "INVALID_SESSION",
      message: "The identity provider returned no user identity."
    };
  }

  const linkUrl = new URL(`${cfg.url}/rest/v1/candidate_auth_identity_links`);
  linkUrl.searchParams.set("select", "candidate_id,supabase_user_id,link_status,verified_at,verified_by");
  linkUrl.searchParams.set("supabase_user_id", `eq.${user.id}`);
  linkUrl.searchParams.set("link_status", "eq.VERIFIED");
  linkUrl.searchParams.set("verified_at", "not.is.null");
  linkUrl.searchParams.set("verified_by", "not.is.null");
  linkUrl.searchParams.set("limit", "2");

  let linkResponse: Response;
  try {
    linkResponse = await fetch(linkUrl, {
      method: "GET",
      headers: {
        apikey: cfg.serviceRoleKey,
        authorization: `Bearer ${cfg.serviceRoleKey}`,
        accept: "application/json"
      },
      cache: "no-store"
    });
  } catch {
    return { ok: false, status: 503, code: "VERIFIED_IDENTITY_LOOKUP_UNAVAILABLE", message: "Kingsmen could not verify the candidate identity link." };
  }
  if (!linkResponse.ok) {
    return { ok: false, status: 503, code: "VERIFIED_IDENTITY_QUERY_FAILED", message: "Kingsmen could not verify the candidate identity link." };
  }
  const links = (await linkResponse.json().catch(() => null)) as Array<{
    candidate_id?: string; supabase_user_id?: string; link_status?: string; verified_at?: string | null; verified_by?: string | null;
  }> | null;
  if (!Array.isArray(links) || links.length !== 1 || !links[0]?.candidate_id ||
      links[0].supabase_user_id !== user.id || links[0].link_status !== "VERIFIED" ||
      !links[0].verified_at || !links[0].verified_by) {
    return {
      ok: false, status: 403,
      code: links && links.length > 1 ? "AMBIGUOUS_VERIFIED_IDENTITY" : "CANDIDATE_IDENTITY_NOT_VERIFIED",
      message: "A single authorised, verified candidate identity link is required before accessing candidate records."
    };
  }

  const candidateId = links[0].candidate_id;
  const accountUrl = new URL(`${cfg.url}/rest/v1/candidate_accounts`);
  accountUrl.searchParams.set("select", "candidate_id,auth_status,email_verified,account_recovery_required");
  accountUrl.searchParams.set("candidate_id", `eq.${candidateId}`);
  accountUrl.searchParams.set("limit", "2");

  let accountResponse: Response;
  try {
    accountResponse = await fetch(accountUrl, {
      method: "GET",
      headers: {
        apikey: cfg.serviceRoleKey,
        authorization: `Bearer ${cfg.serviceRoleKey}`,
        accept: "application/json"
      },
      cache: "no-store"
    });
  } catch {
    return { ok: false, status: 503, code: "CANDIDATE_ACCOUNT_LOOKUP_UNAVAILABLE", message: "Kingsmen could not check the linked candidate account status." };
  }
  if (!accountResponse.ok) {
    return { ok: false, status: 503, code: "CANDIDATE_ACCOUNT_QUERY_FAILED", message: "Kingsmen could not check the linked candidate account status." };
  }
  const accounts = (await accountResponse.json().catch(() => null)) as Array<{
    candidate_id?: string; auth_status?: string; email_verified?: boolean; account_recovery_required?: boolean;
  }> | null;
  if (!Array.isArray(accounts) || accounts.length !== 1 || accounts[0]?.candidate_id !== candidateId) {
    return { ok: false, status: 403, code: "CANDIDATE_ACCOUNT_NOT_FOUND_OR_AMBIGUOUS", message: "The verified identity has no unique candidate account. Contact authorised support." };
  }
  if (accounts[0].auth_status !== "ACTIVE" || accounts[0].email_verified !== true || accounts[0].account_recovery_required === true) {
    return { ok: false, status: 403, code: "CANDIDATE_ACCOUNT_NOT_ACTIVE", message: "The linked candidate account is not active or requires recovery." };
  }

  const candidateUrl = new URL(`${cfg.url}/rest/v1/candidates`);
  candidateUrl.searchParams.set("select", "id,is_active");
  candidateUrl.searchParams.set("id", `eq.${candidateId}`);
  candidateUrl.searchParams.set("limit", "1");
  let candidateResponse: Response;
  try {
    candidateResponse = await fetch(candidateUrl, {
      method: "GET",
      headers: {
        apikey: cfg.serviceRoleKey,
        authorization: `Bearer ${cfg.serviceRoleKey}`,
        accept: "application/json"
      },
      cache: "no-store"
    });
  } catch {
    return { ok: false, status: 503, code: "CANDIDATE_STATUS_LOOKUP_UNAVAILABLE", message: "Kingsmen could not check candidate account status." };
  }
  if (!candidateResponse.ok) {
    return { ok: false, status: 503, code: "CANDIDATE_STATUS_QUERY_FAILED", message: "Kingsmen could not check candidate account status." };
  }
  const candidateRows = await candidateResponse.json().catch(() => null) as Array<{ id?: string; is_active?: boolean }> | null;
  if (!Array.isArray(candidateRows) || candidateRows.length !== 1 || candidateRows[0].id !== candidateId || candidateRows[0].is_active !== true) {
    return { ok: false, status: 403, code: "CANDIDATE_RECORD_INACTIVE", message: "This candidate record is inactive or unavailable." };
  }

  return { ok: true, config: cfg, session: { userId: user.id, candidateId } };
}

export async function supabaseAdminFetch(
  cfg: SupabaseConfig,
  pathname: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${cfg.url}${pathname}`, {
    ...init,
    headers: {
      apikey: cfg.serviceRoleKey,
      authorization: `Bearer ${cfg.serviceRoleKey}`,
      ...(init.headers || {})
    },
    cache: "no-store"
  });
}
