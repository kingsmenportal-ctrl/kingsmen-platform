import { createHash, randomUUID } from "node:crypto";

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
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)?.trim();
  if (!url || !anonKey || !serviceRoleKey) return null;
  return {
    url,
    anonKey,
    serviceRoleKey,
    documentsBucket: process.env.SUPABASE_DOCUMENTS_BUCKET?.trim() || process.env.SUPABASE_STORAGE_BUCKET?.trim() || "candidate-documents"
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

  const user = (await userResponse.json().catch(() => null)) as { id?: string; email_confirmed_at?: string | null; confirmed_at?: string | null } | null;
  if (!user?.id) {
    return {
      ok: false,
      status: 401,
      code: "INVALID_SESSION",
      message: "The identity provider returned no user identity."
    };
  }

  if (!(user.email_confirmed_at || user.confirmed_at)) {
    return { ok: false, status: 403, code: "EMAIL_CONFIRMATION_REQUIRED", message: "Confirm your email address before accessing candidate records." };
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

export async function verifyPrivateDocumentsBucket(cfg: SupabaseConfig): Promise<boolean> {
  let response: Response;
  try {
    response = await supabaseAdminFetch(cfg, `/storage/v1/bucket/${encodeURIComponent(cfg.documentsBucket)}`);
  } catch {
    return false;
  }
  if (!response.ok) return false;
  const bucket = await response.json().catch(() => null) as {
    id?: string;
    name?: string;
    public?: boolean;
    file_size_limit?: number | string | null;
    allowed_mime_types?: string[] | null;
  } | null;
  const requiredMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];
  const configuredLimit = Number(bucket?.file_size_limit);
  return !!bucket &&
    bucket.public === false &&
    (bucket.id === cfg.documentsBucket || bucket.name === cfg.documentsBucket) &&
    Number.isFinite(configuredLimit) &&
    configuredLimit === 15 * 1024 * 1024 &&
    Array.isArray(bucket.allowed_mime_types) &&
    requiredMimeTypes.every((mime) => bucket.allowed_mime_types?.includes(mime));
}

export async function verifyStoredDocumentSignature(
  cfg: SupabaseConfig,
  storagePath: string,
  mimeType: string,
  expectedSizeBytes: number
): Promise<{ ok: boolean; reason: string; checksumSha256?: string }> {
  if (!Number.isSafeInteger(expectedSizeBytes) || expectedSizeBytes < 1 || expectedSizeBytes > 15 * 1024 * 1024) {
    return { ok: false, reason: "Stored object size is outside the configured limit." };
  }
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  let response: Response;
  try {
    response = await supabaseAdminFetch(
      cfg,
      `/storage/v1/object/authenticated/${encodeURIComponent(cfg.documentsBucket)}/${encodedPath}`
    );
  } catch {
    return { ok: false, reason: "Stored bytes could not be read for signature validation." };
  }
  if (!response.ok) return { ok: false, reason: "Stored bytes could not be read for signature validation." };
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== expectedSizeBytes || bytes.byteLength > 15 * 1024 * 1024) {
    return { ok: false, reason: "Stored byte count does not match the Storage metadata." };
  }

  const checksumSha256 = createHash("sha256").update(bytes).digest("hex");

  if (mimeType === "application/pdf") {
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    return signature === "%PDF-" ? { ok: true, reason: "PDF signature matched.", checksumSha256 } : { ok: false, reason: "File content does not have a PDF signature." };
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const zipMagic = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
      ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06) || (bytes[2] === 0x07 && bytes[3] === 0x08));
    return zipMagic ? { ok: true, reason: "DOCX ZIP container signature matched; archive content and malware remain unverified.", checksumSha256 } : { ok: false, reason: "File content does not have a DOCX ZIP container signature." };
  }
  if (mimeType === "text/plain") {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (bytes.some((byte) => byte === 0)) return { ok: false, reason: "Text document contains binary null bytes." };
      return { ok: true, reason: "UTF-8 text encoding validated.", checksumSha256 };
    } catch {
      return { ok: false, reason: "Text document is not valid UTF-8." };
    }
  }
  return { ok: false, reason: "Unsupported document signature policy." };
}
