import { createDocumentUploadId, requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string[]> = {
  CV: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ID_DOCUMENT: ["application/pdf", "image/jpeg", "image/png"],
  MATRIC_CERTIFICATE: ["application/pdf", "image/jpeg", "image/png"],
  ACADEMIC_RECORD: ["application/pdf", "image/jpeg", "image/png"],
  PROOF_OF_ADDRESS: ["application/pdf", "image/jpeg", "image/png"],
  BANK_LETTER: ["application/pdf", "image/jpeg", "image/png"],
  PARENT_GUARDIAN_ID: ["application/pdf", "image/jpeg", "image/png"],
  PAYSLIP: ["application/pdf", "image/jpeg", "image/png"],
  AFFIDAVIT: ["application/pdf", "image/jpeg", "image/png"],
  APPLICATION_PROOF: ["application/pdf", "image/jpeg", "image/png"],
  NSFAS_DOCUMENT: ["application/pdf", "image/jpeg", "image/png"],
  OTHER: ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
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
  if (sizeBytes < 1 || sizeBytes > MAX_UPLOAD_BYTES) {
    return Response.json({ ok: false, code: "FILE_SIZE_OUT_OF_RANGE", error: "Documents must be between 1 byte and 15 MiB." }, { status: 413 });
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

  return Response.json({
    ok: true,
    productionReady: true,
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
