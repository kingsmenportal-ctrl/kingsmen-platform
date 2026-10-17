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

export async function verifyStoredDocumentSignature(
  cfg: SupabaseConfig,
  storagePath: string,
  mimeType: string,
  expectedSizeBytes: number
): Promise<{ ok: boolean; reason: string }> {
  if (!Number.isSafeInteger(expectedSizeBytes) || expectedSizeBytes < 1 || expectedSizeBytes > 10 * 1024 * 1024) {
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
  if (bytes.byteLength !== expectedSizeBytes || bytes.byteLength > 10 * 1024 * 1024) {
    return { ok: false, reason: "Stored byte count does not match the Storage metadata." };
  }

  if (mimeType === "application/pdf") {
    const signature = new TextDecoder().decode(bytes.slice(0, 5));
    return signature === "%PDF-" ? { ok: true, reason: "PDF signature matched." } : { ok: false, reason: "File content does not have a PDF signature." };
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const zipMagic = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
      ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06) || (bytes[2] === 0x07 && bytes[3] === 0x08));
    return zipMagic ? { ok: true, reason: "DOCX ZIP container signature matched; archive content and malware remain unverified." } : { ok: false, reason: "File content does not have a DOCX ZIP container signature." };
  }
  if (mimeType === "text/plain") {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (bytes.some((byte) => byte === 0)) return { ok: false, reason: "Text document contains binary null bytes." };
      return { ok: true, reason: "UTF-8 text encoding validated." };
    } catch {
      return { ok: false, reason: "Text document is not valid UTF-8." };
    }
  }
  return { ok: false, reason: "Unsupported document signature policy." };
}
