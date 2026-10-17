import { randomUUID } from "node:crypto";

const MAX_BYTES = 10 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"]
};
const DOCUMENT_TYPES = new Set([
  "CV", "ID_DOCUMENT", "MATRIC_CERTIFICATE", "ACADEMIC_RECORD",
  "PROOF_OF_ADDRESS", "BANK_LETTER", "PARENT_GUARDIAN_ID", "PAYSLIP",
  "AFFIDAVIT", "APPLICATION_PROOF", "NSFAS_DOCUMENT", "OTHER"
]);

export class N05Error extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function n05Config() {
  const baseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || "";
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "kingsmen-documents";
  if (!baseUrl || !anonKey || !serviceKey) throw new N05Error(503, "Private document storage is not configured.");
  if (process.env.SUPABASE_RLS_REQUIRED === "false" || process.env.SIGNED_UPLOADS_REQUIRED === "false") {
    throw new N05Error(503, "Required storage security controls are disabled.");
  }
  return { baseUrl, anonKey, serviceKey, bucket };
}

export async function n05Candidate(request: Request) {
  const config = n05Config();
  const auth = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(auth)) throw new N05Error(401, "A valid candidate session is required.");
  const token = auth.replace(/^Bearer\s+/i, "");
  const identityResponse = await fetch(config.baseUrl + "/auth/v1/user", {
    headers: { apikey: config.anonKey, authorization: "Bearer " + token },
    cache: "no-store"
  });
  if (!identityResponse.ok) throw new N05Error(401, "Candidate session is invalid or expired.");
  const identity = await identityResponse.json() as { id?: string };
  if (!identity.id) throw new N05Error(401, "Candidate identity could not be verified.");

  const query = new URLSearchParams({
    select: "candidate_id",
    supabase_user_id: "eq." + identity.id,
    link_status: "eq.VERIFIED",
    limit: "2"
  });
  const linkResponse = await fetch(config.baseUrl + "/rest/v1/candidate_auth_identity_links?" + query, {
    headers: { apikey: config.serviceKey, authorization: "Bearer " + config.serviceKey },
    cache: "no-store"
  });
  if (!linkResponse.ok) throw new N05Error(503, "Candidate identity binding could not be checked.");
  const links = await linkResponse.json() as Array<{ candidate_id: string }>;
  if (links.length !== 1 || !links[0]?.candidate_id) {
    throw new N05Error(403, "This account does not have one uniquely verified candidate identity.");
  }
  return { ...config, authUserId: identity.id, candidateId: links[0].candidate_id };
}

export function validateN05Upload(input: { documentTypeCode: unknown; filename: unknown; mimeType: unknown; sizeBytes: unknown }) {
  if (typeof input.documentTypeCode !== "string" || !DOCUMENT_TYPES.has(input.documentTypeCode)) {
    throw new N05Error(400, "Unsupported document type.");
  }
  if (typeof input.filename !== "string" || input.filename.length < 1 || input.filename.length > 240 ||
      /[\\/\\u0000-\\u001f\\u007f]/.test(input.filename) || input.filename === "." || input.filename === "..") {
    throw new N05Error(400, "Invalid filename.");
  }
  if (typeof input.mimeType !== "string" || !MIME_EXTENSIONS[input.mimeType]) {
    throw new N05Error(400, "Only PDF, JPEG, PNG, and WebP documents are accepted.");
  }
  const lower = input.filename.toLowerCase();
  if (!MIME_EXTENSIONS[input.mimeType].some(ext => lower.endsWith(ext))) {
    throw new N05Error(400, "Filename extension does not match the declared MIME type.");
  }
  if (typeof input.sizeBytes !== "number" || !Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > MAX_BYTES) {
    throw new N05Error(400, "Document must be between 1 byte and 10 MiB.");
  }
}

export async function n05Rest(path: string, init: RequestInit = {}) {
  const config = n05Config();
  const response = await fetch(config.baseUrl + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: config.serviceKey,
      authorization: "Bearer " + config.serviceKey,
      "content-type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  const text = await response.text();
  if (!response.ok) throw new N05Error(503, "Document metadata operation failed (" + response.status + ").");
  return text ? JSON.parse(text) as any : null;
}

export function n05Ref(prefix = "doc") { return prefix + "_" + randomUUID(); }
export function n05SafeFilename(name: string) {
  return name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "document";
}
export function n05ErrorResponse(error: unknown) {
  if (error instanceof N05Error) return Response.json({ ok: false, error: error.message, productionReady: false }, { status: error.status });
  return Response.json({ ok: false, error: "Document operation failed safely. No success was recorded.", productionReady: false }, { status: 503 });
}
