import { createDocumentUploadId, requireCandidateSession, supabaseAdminFetch, verifyPrivateDocumentsBucket } from "../../../../../lib/candidate-document-runtime";

type StoredDocument = {
  id: string;
  candidate_id: string;
  storage_bucket: string;
  storage_path: string;
  display_name: string;
  document_status: string;
  malware_scan_status?: string;
  archived_at: string | null;
  file_size_bytes: number | string;
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

  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  if (!documentId) {
    return Response.json({ ok: false, code: "DOCUMENT_ID_REQUIRED", error: "documentId is required." }, { status: 400 });
  }
  if (body.candidateId && body.candidateId !== auth.session.candidateId) {
    return Response.json({ ok: false, code: "CANDIDATE_SCOPE_MISMATCH", error: "The requested candidate does not match the signed-in account." }, { status: 403 });
  }

  const documentUrl = new URL(`${auth.config.url}/rest/v1/document_files`);
  documentUrl.searchParams.set("select", "id,candidate_id,storage_bucket,storage_path,display_name,document_status,malware_scan_status,archived_at,file_size_bytes");
  documentUrl.searchParams.set("id", `eq.${documentId}`);
  documentUrl.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  documentUrl.searchParams.set("archived_at", "is.null");
  documentUrl.searchParams.set("limit", "1");

  const documentResponse = await supabaseAdminFetch(auth.config, `/rest/v1/document_files?${documentUrl.searchParams.toString()}`);
  if (!documentResponse.ok) {
    return Response.json({ ok: false, code: "DOCUMENT_LOOKUP_FAILED", error: "Kingsmen could not load this document record." }, { status: 502 });
  }

  const rows = await documentResponse.json().catch(() => null) as StoredDocument[] | null;
  const document = Array.isArray(rows) ? rows[0] : undefined;
  if (!document || document.candidate_id !== auth.session.candidateId) {
    return Response.json({ ok: false, code: "DOCUMENT_NOT_FOUND", error: "No active document with that ID belongs to this candidate." }, { status: 404 });
  }
  if (document.document_status === "DELETED" || document.document_status === "ARCHIVED") {
    return Response.json({ ok: false, code: "DOCUMENT_NOT_READABLE", error: "This document is archived or deleted." }, { status: 410 });
  }
  // Fail closed: owner identity alone never bypasses quarantine. Only a persisted clean scan
  // result plus the READY state permits the server to mint a signed download URL.
  if (document.malware_scan_status !== "CLEAN" || document.document_status !== "READY") {
    return Response.json({
      ok: false,
      code: "DOCUMENT_QUARANTINED",
      error: "This document is not available for download until the configured malware scanner reports CLEAN and the release state is persisted.",
      malwareScanStatus: document.malware_scan_status || "PENDING",
      downloadable: false
    }, { status: 423, headers: { "cache-control": "no-store" } });
  }

  if (document.storage_bucket !== auth.config.documentsBucket) {
    return Response.json({ ok: false, code: "DOCUMENT_BUCKET_MISMATCH", error: "The document is not in the configured private candidate bucket." }, { status: 409 });
  }

  if (!(await verifyPrivateDocumentsBucket(auth.config))) {
    return Response.json({ ok: false, code: "DOCUMENT_BUCKET_NOT_PRIVATE", error: "The configured document bucket must exist and be private before downloads are enabled." }, { status: 503 });
  }

  const encodedPath = document.storage_path.split("/").map(encodeURIComponent).join("/");
  const signedResponse = await supabaseAdminFetch(
    auth.config,
    `/storage/v1/object/sign/${encodeURIComponent(document.storage_bucket)}/${encodedPath}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: 600 })
    }
  );
  const signed = await signedResponse.json().catch(() => null) as { signedURL?: string; signedUrl?: string; url?: string } | null;
  const rawSignedPath = signed?.signedURL || signed?.signedUrl || signed?.url;
  if (!signedResponse.ok || !rawSignedPath) {
    return Response.json({ ok: false, code: "SIGNED_READ_FAILED", error: "Private storage could not create a temporary document link." }, { status: 502 });
  }

  const signedReadUrl = rawSignedPath.startsWith("http")
    ? rawSignedPath
    : `${auth.config.url}/storage/v1${rawSignedPath.startsWith("/") ? rawSignedPath : `/${rawSignedPath}`}`;

  const auditResponse = await supabaseAdminFetch(auth.config, "/rest/v1/document_storage_events", {
    method: "POST",
    headers: { "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      document_id: document.id,
      event_ref: `DOC-READ-${createDocumentUploadId()}`,
      event_type: "FILE_ACCESSED",
      storage_provider: "SUPABASE",
      storage_bucket: document.storage_bucket,
      storage_path: document.storage_path,
      file_size_bytes: Number(document.file_size_bytes) || 0,
      status: "OK",
      message: "Temporary signed read URL issued to the authenticated owner of this document.",
      metadata: { authenticated_user_id: auth.session.userId, candidate_id: auth.session.candidateId }
    })
  });
  if (!auditResponse.ok) {
    return Response.json({ ok: false, code: "DOCUMENT_READ_AUDIT_FAILED", error: "Kingsmen could not record the document access event, so no temporary link was returned." }, { status: 502 });
  }

  return Response.json({
    ok: true,
    documentId: document.id,
    displayName: document.display_name,
    signedReadUrl,
    expiresInSeconds: 600,
    rawPublicUrlAllowed: false
  }, { headers: { "cache-control": "no-store" } });
}
