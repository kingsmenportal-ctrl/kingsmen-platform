import { requireCandidateSession, supabaseAdminFetch, verifyPrivateDocumentsBucket } from "../../../../../lib/candidate-document-runtime";

type StoredDocument = {
  id: string;
  candidate_id: string;
  storage_bucket: string;
  storage_path: string;
  display_name: string;
  document_status: string;
  archived_at: string | null;
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
  documentUrl.searchParams.set("select", "id,candidate_id,storage_bucket,storage_path,display_name,document_status,archived_at");
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

  return Response.json({
    ok: true,
    documentId: document.id,
    displayName: document.display_name,
    signedReadUrl,
    expiresInSeconds: 600,
    rawPublicUrlAllowed: false
  }, { headers: { "cache-control": "no-store" } });
}
