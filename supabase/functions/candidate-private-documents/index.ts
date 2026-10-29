import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isAllowedDocumentSignature, sha256Hex } from "./document-signature.mjs";

const DOCUMENT_BUCKET = "kingsmen-candidate-documents";
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_JSON_BYTES = 16 * 1024;
const READ_URL_TTL_SECONDS = 60;
const VERIFIED_REVIEWER_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOCUMENT_TYPES = new Set([
  "CV", "ID_DOCUMENT", "MATRIC_CERTIFICATE", "ACADEMIC_RECORD", "PROOF_OF_ADDRESS",
  "BANK_LETTER", "PARENT_GUARDIAN_ID", "PAYSLIP", "AFFIDAVIT", "APPLICATION_PROOF",
  "NSFAS_DOCUMENT", "OTHER"
]);
const MIME_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png"
};

type CandidateContext = {
  userId: string;
  candidateId: string;
  admin: SupabaseClient;
};

function allowedOrigins(): Set<string> {
  return new Set(
    (Deno.env.get("KINGSMEN_ALLOWED_ORIGINS") ?? "https://kingsmen-portal-staging.netlify.app")
      .split(",").map((value) => value.trim()).filter(Boolean)
  );
}

function response(req: Request, body: unknown, status = 200): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin"
  });
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function fail(req: Request, status: number, code: string, detail?: string): Response {
  return response(req, { ok: false, status: code, ...(detail ? { detail } : {}) }, status);
}

async function readJsonLimited(req: Request): Promise<Record<string, unknown> | null> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return null;
  const declared = req.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_JSON_BYTES)) {
    throw new Error("REQUEST_TOO_LARGE");
  }
  const reader = req.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_JSON_BYTES) {
      await reader.cancel();
      throw new Error("REQUEST_TOO_LARGE");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("INVALID_JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("INVALID_JSON");
  return parsed as Record<string, unknown>;
}

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("VERIFIED_IDENTITY_REQUIRED")) return "IDENTITY_REVIEW_REQUIRED";
  if (message.includes("DOCUMENT_NOT_FOUND") || message.includes("DOCUMENT_NOT_FOUND_OR_NOT_READABLE")) return "DOCUMENT_NOT_FOUND";
  if (message.includes("DOCUMENT_NOT_PENDING")) return "DOCUMENT_NOT_PENDING";
  if (message.includes("DOCUMENT_ALREADY_FINALIZED")) return "DOCUMENT_ALREADY_FINALIZED";
  return "DOCUMENT_WORKFLOW_FAILED";
}

function errorStatus(code: string): number {
  if (code === "IDENTITY_REVIEW_REQUIRED") return 403;
  if (code === "DOCUMENT_NOT_FOUND") return 404;
  if (code === "DOCUMENT_NOT_PENDING" || code === "DOCUMENT_ALREADY_FINALIZED") return 409;
  return 500;
}

async function resolveCandidate(req: Request): Promise<CandidateContext | Response> {
  const authorization = req.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) return fail(req, 401, "AUTHENTICATION_REQUIRED");

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return fail(req, 503, "NOT_CONFIGURED");

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: authError } = await auth.auth.getUser(match[1]);
  if (authError || !userData.user) return fail(req, 401, "AUTHENTICATION_REQUIRED");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: link, error: linkError } = await admin.from("candidate_auth_identity_links")
    .select("candidate_id,link_status,verified_at,verified_by")
    .eq("supabase_user_id", userData.user.id).maybeSingle();
  if (linkError) return fail(req, 503, "IDENTITY_LOOKUP_FAILED");

  const verifiedAt = Date.parse(link?.verified_at ?? "");
  const linkIsVerified = Boolean(
    link &&
    link.link_status === "VERIFIED" &&
    Number.isFinite(verifiedAt) &&
    verifiedAt <= Date.now() &&
    typeof link.verified_by === "string" &&
    VERIFIED_REVIEWER_UUID.test(link.verified_by)
  );
  if (!linkIsVerified) return fail(req, 403, "IDENTITY_REVIEW_REQUIRED");

  const candidateId = String(link.candidate_id);
  const { data: candidate, error: candidateError } = await admin.from("candidates")
    .select("id,is_active").eq("id", candidateId).maybeSingle();
  if (candidateError) return fail(req, 503, "CANDIDATE_LOOKUP_FAILED");
  if (!candidate || candidate.is_active !== true) return fail(req, 403, "CANDIDATE_INACTIVE");

  return { userId: userData.user.id, candidateId, admin };
}

async function verifyBucket(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin.storage.getBucket(DOCUMENT_BUCKET);
  if (error || !data) return false;
  const bucket = data as unknown as Record<string, unknown>;
  const isPublic = bucket.public === true;
  const limit = Number(bucket.file_size_limit ?? bucket.fileSizeLimit ?? 0);
  const mimeTypes = bucket.allowed_mime_types ?? bucket.allowedMimeTypes;
  return !isPublic && limit >= MAX_DOCUMENT_BYTES &&
    Array.isArray(mimeTypes) &&
    ["application/pdf", "image/jpeg", "image/png"].every((mime) => mimeTypes.includes(mime));
}

async function uploadUrl(req: Request, body: Record<string, unknown>, ctx: CandidateContext): Promise<Response> {
  const documentType = typeof body.documentTypeCode === "string" ? body.documentTypeCode : "";
  const filename = typeof body.filename === "string" ? body.filename.normalize("NFKC").trim() : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase().trim() : "";
  const sizeBytes = body.sizeBytes;
  if (!DOCUMENT_TYPES.has(documentType)) return fail(req, 400, "DOCUMENT_TYPE_NOT_ALLOWED");
  if (!filename || filename.length > 180 || /[/\\\u0000-\u001f\u007f]/.test(filename)) {
    return fail(req, 400, "DOCUMENT_FILENAME_INVALID");
  }
  if (!(mimeType in MIME_EXTENSION)) return fail(req, 415, "DOCUMENT_MIME_NOT_ALLOWED");
  const requiredExtension = MIME_EXTENSION[mimeType];
  const extensionOkay = requiredExtension === "jpg"
    ? /\.(jpe?g)$/i.test(filename)
    : filename.toLowerCase().endsWith("." + requiredExtension);
  if (!extensionOkay) return fail(req, 415, "DOCUMENT_EXTENSION_MISMATCH");
  if (!Number.isSafeInteger(sizeBytes) || Number(sizeBytes) < 1 || Number(sizeBytes) > MAX_DOCUMENT_BYTES) {
    return fail(req, 413, "DOCUMENT_SIZE_OUT_OF_RANGE");
  }
  if (!(await verifyBucket(ctx.admin))) return fail(req, 503, "DOCUMENT_STORAGE_NOT_CONFIGURED");

  const documentId = crypto.randomUUID();
  const extension = MIME_EXTENSION[mimeType];
  const storagePath = `${ctx.candidateId}/${documentId}/file.${extension}`;
  const { data: signedUpload, error: signError } = await ctx.admin.storage
    .from(DOCUMENT_BUCKET).createSignedUploadUrl(storagePath, { upsert: false });
  if (signError || !signedUpload?.signedUrl || !signedUpload?.token) {
    return fail(req, 503, "SIGNED_UPLOAD_CREATION_FAILED");
  }

  const { data: record, error: recordError } = await ctx.admin.rpc(
    "create_candidate_private_document_upload_request",
    {
      p_supabase_user_id: ctx.userId,
      p_candidate_id: ctx.candidateId,
      p_document_id: documentId,
      p_document_type: documentType,
      p_storage_path: storagePath,
      p_original_filename: filename,
      p_mime_type: mimeType,
      p_size_bytes: Number(sizeBytes)
    }
  );
  if (recordError || !record) {
    // The signed capability is deliberately not returned. It expires without a durable owner row.
    const code = errorCode(recordError);
    return fail(req, errorStatus(code), code);
  }

  return response(req, {
    ok: true,
    action: "upload-url-created",
    document: {
      id: documentId,
      documentType,
      filename,
      mimeType,
      sizeBytes: Number(sizeBytes),
      status: "UPLOAD_PENDING"
    },
    signedUploadUrl: signedUpload.signedUrl,
    signedUploadToken: signedUpload.token,
    uploadPath: storagePath,
    uploadExpiresInSeconds: 7200,
    rawPublicUrlAllowed: false,
    serviceRoleVisibleToBrowser: false
  }, 201);
}

async function finalizeUpload(req: Request, body: Record<string, unknown>, ctx: CandidateContext): Promise<Response> {
  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId)) {
    return fail(req, 400, "DOCUMENT_ID_INVALID");
  }
  const { data: doc, error: docError } = await ctx.admin.from("candidate_private_documents")
    .select("id,candidate_id,created_by_auth_user_id,storage_bucket,storage_path,mime_type,size_bytes,status,sha256_hex")
    .eq("id", documentId).eq("candidate_id", ctx.candidateId)
    .eq("created_by_auth_user_id", ctx.userId).maybeSingle();
  if (docError) return fail(req, 503, "DOCUMENT_LOOKUP_FAILED");
  if (!doc) return fail(req, 404, "DOCUMENT_NOT_FOUND");
  if (doc.storage_bucket !== DOCUMENT_BUCKET) return fail(req, 409, "DOCUMENT_STORAGE_BUCKET_MISMATCH");
  if (doc.status === "UPLOADED_CANDIDATE_REPORTED" || doc.status === "UNDER_REVIEW" || doc.status === "VERIFIED") {
    return response(req, { ok: true, documentId, status: doc.status, idempotent: true });
  }
  if (doc.status !== "UPLOAD_PENDING") return fail(req, 409, "DOCUMENT_NOT_PENDING");

  const { data: file, error: fileError } = await ctx.admin.storage.from(DOCUMENT_BUCKET).download(doc.storage_path);
  if (fileError || !file) return fail(req, 409, "UPLOAD_NOT_AVAILABLE");
  const actualSize = file.size;
  let bytes = new Uint8Array(0);
  let signatureValid = false;
  let digest = "0".repeat(64);
  if (actualSize >= 1 && actualSize <= MAX_DOCUMENT_BYTES) {
    bytes = new Uint8Array(await file.arrayBuffer());
    signatureValid = isAllowedDocumentSignature(bytes, doc.mime_type);
    digest = await sha256Hex(bytes);
  }
  const { data: result, error: finalizeError } = await ctx.admin.rpc(
    "finalize_candidate_private_document_upload",
    {
      p_supabase_user_id: ctx.userId,
      p_candidate_id: ctx.candidateId,
      p_document_id: documentId,
      p_actual_size_bytes: actualSize,
      p_sha256_hex: digest,
      p_signature_valid: signatureValid
    }
  );
  if (finalizeError || !result) {
    const code = errorCode(finalizeError);
    return fail(req, errorStatus(code), code);
  }
  if (result.status === "UPLOAD_FAILED") {
    const { error: removeError } = await ctx.admin.storage.from(DOCUMENT_BUCKET).remove([doc.storage_path]);
    if (removeError) {
      // The object remains private and is marked failed; it is never served by this API.
      console.error("candidate-document cleanup failed", { code: removeError.name, documentId });
    }
    return response(req, { ok: false, documentId, status: "UPLOAD_FAILED", reasonCode: result.reasonCode }, 422);
  }
  return response(req, { ok: true, ...result });
}

async function readUrl(req: Request, body: Record<string, unknown>, ctx: CandidateContext): Promise<Response> {
  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId)) {
    return fail(req, 400, "DOCUMENT_ID_INVALID");
  }
  const { data: doc, error: lookupError } = await ctx.admin.from("candidate_private_documents")
    .select("id,candidate_id,created_by_auth_user_id,storage_bucket,storage_path,original_filename,mime_type,size_bytes,status")
    .eq("id", documentId).eq("candidate_id", ctx.candidateId)
    .eq("created_by_auth_user_id", ctx.userId).maybeSingle();
  if (lookupError) return fail(req, 503, "DOCUMENT_LOOKUP_FAILED");
  if (!doc) return fail(req, 404, "DOCUMENT_NOT_FOUND");
  if (doc.storage_bucket !== DOCUMENT_BUCKET ||
      !["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED"].includes(doc.status)) {
    return fail(req, 403, "DOCUMENT_NOT_READABLE");
  }

  const { data: signedRead, error: signError } = await ctx.admin.storage
    .from(DOCUMENT_BUCKET).createSignedUrl(doc.storage_path, READ_URL_TTL_SECONDS, { download: doc.original_filename });
  if (signError || !signedRead?.signedUrl) return fail(req, 503, "SIGNED_READ_CREATION_FAILED");

  const { error: auditError } = await ctx.admin.rpc("record_candidate_private_document_read_link", {
    p_supabase_user_id: ctx.userId,
    p_candidate_id: ctx.candidateId,
    p_document_id: documentId,
    p_link_lifetime_seconds: READ_URL_TTL_SECONDS
  });
  if (auditError) {
    // Do not return a signed URL if its audit record could not be committed.
    return fail(req, 503, "READ_LINK_AUDIT_FAILED");
  }
  return response(req, {
    ok: true,
    documentId,
    signedReadUrl: signedRead.signedUrl,
    expiresInSeconds: READ_URL_TTL_SECONDS,
    rawPublicUrlAllowed: false
  });
}

async function listDocuments(req: Request, ctx: CandidateContext): Promise<Response> {
  const { data, error } = await ctx.admin.from("candidate_private_documents")
    .select("id,document_type,original_filename,mime_type,size_bytes,status,sha256_hex,uploaded_at,created_at,updated_at")
    .eq("candidate_id", ctx.candidateId)
    .eq("created_by_auth_user_id", ctx.userId)
    .order("created_at", { ascending: false }).limit(100);
  if (error) return fail(req, 503, "DOCUMENT_LIST_FAILED");
  return response(req, {
    ok: true,
    documents: (data ?? []).map((doc) => ({
      id: doc.id,
      documentType: doc.document_type,
      filename: doc.original_filename,
      mimeType: doc.mime_type,
      sizeBytes: Number(doc.size_bytes),
      status: doc.status,
      checksumRecorded: Boolean(doc.sha256_hex),
      uploadedAt: doc.uploaded_at,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    })),
    candidateCanVerify: false,
    candidateCanReject: false,
    candidateCanDelete: false,
    rawPublicUrlAllowed: false
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true }, 200);
  if (!["GET", "POST"].includes(req.method)) return fail(req, 405, "METHOD_NOT_ALLOWED");
  if (req.method === "GET") {
    const context = await resolveCandidate(req);
    if (context instanceof Response) return context;
    return await listDocuments(req, context);
  }

  let body: Record<string, unknown> | null;
  try {
    body = await readJsonLimited(req);
  } catch (error) {
    return fail(req, error instanceof Error && error.message === "REQUEST_TOO_LARGE" ? 413 : 400,
      error instanceof Error ? error.message : "INVALID_JSON");
  }
  if (!body) return fail(req, 415, "JSON_CONTENT_TYPE_REQUIRED");

  const action = typeof body.action === "string" ? body.action : "";
  const context = await resolveCandidate(req);
  if (context instanceof Response) return context;

  try {
    switch (action) {
      case "upload-url": return await uploadUrl(req, body, context);
      case "finalize-upload": return await finalizeUpload(req, body, context);
      case "read-url": return await readUrl(req, body, context);
      default: return fail(req, 400, "ACTION_NOT_SUPPORTED");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    console.error("candidate document workflow failed", { action, code: errorCode(error) });
    const code = message === "DOCUMENT_STORAGE_NOT_CONFIGURED" ? message : errorCode(error);
    return fail(req, errorStatus(code), code);
  }
});
