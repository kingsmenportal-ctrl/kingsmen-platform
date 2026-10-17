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

  const mappingUrl = new URL(`${cfg.url}/rest/v1/candidate_accounts`);
  mappingUrl.searchParams.set("select", "candidate_id,auth_user_id");
  mappingUrl.searchParams.set("auth_user_id", `eq.${user.id}`);
  mappingUrl.searchParams.set("limit", "2");

  let mappingResponse: Response;
  try {
    mappingResponse = await fetch(mappingUrl, {
      method: "GET",
      headers: {
        apikey: cfg.serviceRoleKey,
        authorization: `Bearer ${cfg.serviceRoleKey}`,
        accept: "application/json"
      },
      cache: "no-store"
    });
  } catch {
    return {
      ok: false,
      status: 503,
      code: "CANDIDATE_MAPPING_UNAVAILABLE",
      message: "Kingsmen could not resolve the signed-in candidate account."
    };
  }

  if (!mappingResponse.ok) {
    return {
      ok: false,
      status: 503,
      code: "CANDIDATE_MAPPING_QUERY_FAILED",
      message: "Kingsmen could not resolve the signed-in candidate account."
    };
  }

  const mappings = (await mappingResponse.json().catch(() => [])) as Array<{ candidate_id?: string; auth_user_id?: string }>;
  if (mappings.length !== 1 || !mappings[0]?.candidate_id || mappings[0].auth_user_id !== user.id) {
    return {
      ok: false,
      status: 403,
      code: "CANDIDATE_IDENTITY_NOT_LINKED",
      message: "This signed-in user does not have exactly one linked candidate account."
    };
  }

  return {
    ok: true,
    config: cfg,
    session: { userId: user.id, candidateId: mappings[0].candidate_id }
  };
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

export async function verifyPrivateDocumentsBucket(cfg: SupabaseConfig): Promise<boolean> {
  let response: Response;
  try {
    response = await supabaseAdminFetch(cfg, `/storage/v1/bucket/${encodeURIComponent(cfg.documentsBucket)}`);
  } catch {
    return false;
  }
  if (!response.ok) return false;
  const bucket = await response.json().catch(() => null) as { id?: string; name?: string; public?: boolean } | null;
  return !!bucket && bucket.public === false &&
    (bucket.id === cfg.documentsBucket || bucket.name === cfg.documentsBucket);
}
