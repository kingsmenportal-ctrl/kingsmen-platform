import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

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

type StorageObject = {
  name?: string;
  metadata?: { size?: number | string; mimetype?: string; contentType?: string; [key: string]: unknown };
};

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

  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  const documentTypeCode = typeof body.documentTypeCode === "string" ? body.documentTypeCode : "";
  const storagePath = typeof body.storagePath === "string" ? body.storagePath : "";
  const expectedPrefix = `${auth.session.candidateId}/${uploadId}/`;

  if (!/^[0-9a-f-]{36}$/i.test(uploadId) || !Object.hasOwn(ALLOWED_TYPES, documentTypeCode) || !storagePath.startsWith(expectedPrefix)) {
    return Response.json({ ok: false, code: "INVALID_COMPLETION_REQUEST", error: "A valid uploadId, document type, and candidate-owned storage path are required." }, { status: 400 });
  }
  if (body.candidateId && body.candidateId !== auth.session.candidateId) {
    return Response.json({ ok: false, code: "CANDIDATE_SCOPE_MISMATCH", error: "The requested candidate does not match the signed-in account." }, { status: 403 });
  }

  const filename = storagePath.slice(expectedPrefix.length);
  if (!filename || filename.includes("/") || filename.includes("..")) {
    return Response.json({ ok: false, code: "INVALID_STORAGE_PATH", error: "The stored object path is invalid." }, { status: 400 });
  }

  const listPath = `/storage/v1/object/list/${encodeURIComponent(auth.config.documentsBucket)}`;
  let storageResponse: Response;
  try {
    storageResponse = await supabaseAdminFetch(auth.config, listPath, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prefix: `${auth.session.candidateId}/${uploadId}/`,
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" }
      })
    });
  } catch {
    return Response.json({ ok: false, code: "STORAGE_CHECK_UNAVAILABLE", error: "Kingsmen could not verify the uploaded object." }, { status: 503 });
  }

  if (!storageResponse.ok) {
    return Response.json({ ok: false, code: "STORAGE_CHECK_FAILED", error: "Private storage did not confirm the uploaded object." }, { status: 502 });
  }

  const objects = await storageResponse.json().catch(() => null) as StorageObject[] | null;
  const object = Array.isArray(objects)
    ? objects.find((item) => item.name === filename || item.name === storagePath)
    : undefined;
  if (!object) {
    return Response.json({ ok: false, code: "UPLOADED_OBJECT_NOT_FOUND", error: "Upload the file to the signed URL before completing the document record." }, { status: 409 });
  }

  const mimeType = String(object.metadata?.mimetype || object.metadata?.contentType || "").toLowerCase();
  const sizeBytes = Number(object.metadata?.size);
  if (!ALLOWED_TYPES[documentTypeCode]?.includes(mimeType) || !Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 10 * 1024 * 1024) {
    return Response.json({ ok: false, code: "STORED_FILE_METADATA_REJECTED", error: "Stored file type or size is outside Kingsmen's document policy." }, { status: 415 });
  }

  const documentRef = `DOC-${uploadId}`;
  const documentUrl = new URL(`${auth.config.url}/rest/v1/document_files`);
  documentUrl.searchParams.set("on_conflict", "document_ref");
  let documentResponse: Response;
  try {
    documentResponse = await supabaseAdminFetch(auth.config, `/rest/v1/document_files?${documentUrl.searchParams.toString()}`, {
      method: "POST",
      headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({
        candidate_id: auth.session.candidateId,
        document_ref: documentRef,
        document_type: documentTypeCode,
        display_name: filename,
        original_filename: filename,
        mime_type: mimeType,
        file_size_bytes: sizeBytes,
        storage_provider: "SUPABASE",
        storage_bucket: auth.config.documentsBucket,
        storage_path: storagePath,
        protected_data: true,
        source_channel: "PORTAL",
        document_status: "UPLOADED",
        verification_status: "PENDING",
        extraction_status: "NOT_STARTED",
        source_confidence_band: "C",
        metadata: { upload_id: uploadId, uploaded_by_auth_user_id: auth.session.userId }
      })
    });
  } catch {
    return Response.json({ ok: false, code: "DOCUMENT_METADATA_WRITE_UNAVAILABLE", error: "The file is stored but Kingsmen could not write its document record. Retry completion." }, { status: 503 });
  }

  if (!documentResponse.ok) {
    return Response.json({ ok: false, code: "DOCUMENT_METADATA_WRITE_FAILED", error: "The file is stored but its document record could not be created. Retry completion or contact support." }, { status: 502 });
  }

  const returnedRows = await documentResponse.json().catch(() => []);
  let document = Array.isArray(returnedRows) ? returnedRows[0] : undefined;
  if (!document) {
    const existingUrl = new URL(`${auth.config.url}/rest/v1/document_files`);
    existingUrl.searchParams.set("select", "id,document_ref,document_type,display_name,mime_type,file_size_bytes,document_status,verification_status,uploaded_at");
    existingUrl.searchParams.set("document_ref", `eq.${documentRef}`);
    existingUrl.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
    existingUrl.searchParams.set("limit", "1");
    const existingResponse = await supabaseAdminFetch(auth.config, `/rest/v1/document_files?${existingUrl.searchParams.toString()}`);
    const existingRows = existingResponse.ok ? await existingResponse.json().catch(() => []) : [];
    document = Array.isArray(existingRows) ? existingRows[0] : undefined;
  }

  if (!document) {
    return Response.json({ ok: false, code: "DOCUMENT_RECORD_NOT_CONFIRMED", error: "The upload completed, but Kingsmen could not confirm its document record." }, { status: 502 });
  }

  const eventUrl = `/rest/v1/document_storage_events?on_conflict=event_ref`;
  const eventResponse = await supabaseAdminFetch(auth.config, eventUrl, {
    method: "POST",
    headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      document_id: document.id,
      event_ref: `DOC-UPLOAD-COMPLETE-${uploadId}`,
      event_type: "UPLOAD_COMPLETED",
      storage_provider: "SUPABASE",
      storage_bucket: auth.config.documentsBucket,
      storage_path: storagePath,
      file_size_bytes: sizeBytes,
      status: "OK",
      message: "Candidate-owned object existence and stored metadata checked by the server.",
      metadata: { upload_id: uploadId, authenticated_user_id: auth.session.userId }
    })
  });

  if (!eventResponse.ok) {
    return Response.json({ ok: false, code: "DOCUMENT_AUDIT_EVENT_FAILED", error: "The document record exists, but its storage audit event failed. Retry completion to finish the audit record.", document }, { status: 502 });
  }

  return Response.json({
    ok: true,
    productionReady: false,
    document,
    review: { status: "PENDING", note: "Upload does not mean the document is verified. Verification and outcome decisions remain restricted to authorised review workflows." }
  }, { status: 201, headers: { "cache-control": "no-store" } });
}
