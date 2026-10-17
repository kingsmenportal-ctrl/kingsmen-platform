import { createDocumentUploadId, requireCandidateSession, supabaseAdminFetch, verifyPrivateDocumentsBucket } from "../../../../../lib/candidate-document-runtime";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string[]> = {
  CV: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
  ID_DOCUMENT: ["application/pdf"],
  MATRIC_CERTIFICATE: ["application/pdf"],
  ACADEMIC_RECORD: ["application/pdf"],
  PROOF_OF_ADDRESS: ["application/pdf"],
  BANK_LETTER: ["application/pdf"],
  PARENT_GUARDIAN_ID: ["application/pdf"],
  PAYSLIP: ["application/pdf"],
  AFFIDAVIT: ["application/pdf"],
  APPLICATION_PROOF: ["application/pdf"],
  NSFAS_DOCUMENT: ["application/pdf"],
  OTHER: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
};

function safeFilename(value: string): string {
  const basename = value.replace(/\\/g, "/").split("/").pop() || "document";
  const cleaned = basename.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 100);
  return cleaned || "document";
}

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) {
    return Response.json({ ok: false, code: auth.code, error: auth.message }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, code: "INVALID_JSON", error: "Request body must be valid JSON." }, { status: 400 });
  }

  const documentTypeCode = typeof body.documentTypeCode === "string" ? body.documentTypeCode : "";
  const filename = typeof body.filename === "string" ? body.filename : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase() : "";
  const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : Number.NaN;

  if (!documentTypeCode || !filename || !mimeType || !Number.isSafeInteger(sizeBytes)) {
    return Response.json({ ok: false, code: "INVALID_UPLOAD_METADATA", error: "Provide documentTypeCode, filename, mimeType, and integer sizeBytes." }, { status: 400 });
  }
  if (body.candidateId && body.candidateId !== auth.session.candidateId) {
    return Response.json({ ok: false, code: "CANDIDATE_SCOPE_MISMATCH", error: "The requested candidate does not match the signed-in account." }, { status: 403 });
  }
  if (!Object.hasOwn(ALLOWED_TYPES, documentTypeCode) || !ALLOWED_TYPES[documentTypeCode].includes(mimeType)) {
    return Response.json({ ok: false, code: "DOCUMENT_TYPE_MIME_NOT_ALLOWED", error: "This document type and file format combination is not allowed." }, { status: 415 });
  }
  const lowerFilename = filename.toLowerCase();
  const extensionMatches =
    (mimeType === "application/pdf" && lowerFilename.endsWith(".pdf")) ||
    (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && lowerFilename.endsWith(".docx")) ||
    (mimeType === "text/plain" && lowerFilename.endsWith(".txt"));
  if (!extensionMatches) {
    return Response.json({ ok: false, code: "FILENAME_MIME_MISMATCH", error: "The filename extension must match the declared file format (.pdf, .docx, or .txt)." }, { status: 415 });
  }

  if (sizeBytes < 1 || sizeBytes > MAX_UPLOAD_BYTES) {
    return Response.json({ ok: false, code: "FILE_SIZE_OUT_OF_RANGE", error: "Documents must be between 1 byte and 10 MiB for the configured private storage bucket." }, { status: 413 });
  }

  if (!(await verifyPrivateDocumentsBucket(auth.config))) {
    return Response.json({ ok: false, code: "DOCUMENT_BUCKET_NOT_PRIVATE", error: "The configured document bucket must exist and be private before uploads are enabled." }, { status: 503 });
  }

  const uploadId = createDocumentUploadId();
  const objectPath = `${auth.session.candidateId}/${uploadId}/${safeFilename(filename)}`;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const encodedBucket = encodeURIComponent(auth.config.documentsBucket);

  let signerResponse: Response;
  try {
    signerResponse = await supabaseAdminFetch(
      auth.config,
      `/storage/v1/object/upload/sign/${encodedBucket}/${encodedPath}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ upsert: false })
      }
    );
  } catch {
    return Response.json({ ok: false, code: "STORAGE_SIGNER_UNAVAILABLE", error: "Private document storage could not create an upload link." }, { status: 503 });
  }

  const signer = await signerResponse.json().catch(() => null) as { signedURL?: string; signedUrl?: string; url?: string; token?: string } | null;
  const rawSignedPath = signer?.signedURL || signer?.signedUrl || signer?.url;
  if (!signerResponse.ok || !rawSignedPath) {
    return Response.json({ ok: false, code: "STORAGE_SIGNING_FAILED", error: "Private document storage rejected the upload-link request." }, { status: 502 });
  }

  const signedUploadUrl = rawSignedPath.startsWith("http")
    ? rawSignedPath
    : `${auth.config.url}/storage/v1${rawSignedPath.startsWith("/") ? rawSignedPath : `/${rawSignedPath}`}`;

  const auditResponse = await supabaseAdminFetch(auth.config, "/rest/v1/document_storage_events", {
    method: "POST",
    headers: { "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      document_id: null,
      event_ref: `DOC-UPLOAD-ISSUED-${uploadId}`,
      event_type: "SIGNED_UPLOAD_CREATED",
      storage_provider: "SUPABASE",
      storage_bucket: auth.config.documentsBucket,
      storage_path: objectPath,
      file_size_bytes: sizeBytes,
      status: "OK",
      message: "Signed upload capability created for an authenticated candidate identity.",
      metadata: { upload_id: uploadId, candidate_id: auth.session.candidateId, authenticated_user_id: auth.session.userId }
    })
  });
  if (!auditResponse.ok) {
    return Response.json({ ok: false, code: "UPLOAD_AUDIT_FAILED", error: "Kingsmen could not record the upload intent, so the temporary upload link was not returned." }, { status: 502 });
  }

  return Response.json({
    ok: true,
    productionReady: false,
    candidateId: auth.session.candidateId,
    documentTypeCode,
    uploadId,
    storageBucket: auth.config.documentsBucket,
    storagePath: objectPath,
    mimeType,
    sizeBytes,
    signedUploadUrl,
    uploadToken: signer?.token || null,
    expiresInSeconds: null,
    rawPublicUrlAllowed: false,
    serviceRoleVisibleToBrowser: false,
    nextStep: "Upload the bytes to signedUploadUrl, then call the authenticated document completion route to verify the stored object and write document metadata."
  }, { headers: { "cache-control": "no-store" } });
}
