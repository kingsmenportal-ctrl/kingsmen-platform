import { n05Candidate, n05ErrorResponse, n05Rest, n05Ref, N05Error } from "../../../../lib/n05-server";

export async function POST(request: Request) {
  try {
    const actor = await n05Candidate(request);
    const body = await request.json().catch(() => null) as any;
    if (!body || typeof body.documentRef !== "string" || body.documentRef.length > 100) {
      throw new N05Error(400, "documentRef is required.");
    }

    const query = new URLSearchParams({
      select: "id,candidate_id,document_ref,document_type,original_filename,mime_type,file_size_bytes,storage_bucket,storage_path,document_status,metadata",
      document_ref: "eq." + body.documentRef,
      candidate_id: "eq." + actor.candidateId,
      limit: "1"
    });
    const rows = await n05Rest("document_files?" + query);
    if (!Array.isArray(rows) || rows.length !== 1) throw new N05Error(404, "Document upload was not found for this candidate.");
    const document = rows[0] as any;
    if (document.document_status === "PROCESSING") {
      const encodedPath = String(document.storage_path).split("/").map(encodeURIComponent).join("/");
      const info = await fetch(actor.baseUrl + "/storage/v1/object/info/" + encodeURIComponent(document.storage_bucket) + "/" + encodedPath, {
        headers: { apikey: actor.serviceKey, authorization: "Bearer " + actor.serviceKey },
        cache: "no-store"
      });
      if (!info.ok) throw new N05Error(409, "Storage has not confirmed the uploaded bytes. Retry after the transfer completes.");
      const objectInfo = await info.json() as any;
      const metadata = objectInfo.metadata || objectInfo;
      const actualSize = Number(metadata.size ?? objectInfo.size ?? NaN);
      const actualMime = String(metadata.mimetype ?? metadata.contentType ?? objectInfo.mimetype ?? objectInfo.contentType ?? "");
      if (!Number.isFinite(actualSize) || actualSize < 1 || actualSize > 10 * 1024 * 1024 ||
          actualSize !== Number(document.file_size_bytes)) {
        throw new N05Error(422, "Stored file size does not match the declared upload size; document remains unverified.");
      }
      if (actualMime && actualMime !== document.mime_type) {
        throw new N05Error(422, "Stored content type does not match the declared type; document remains unverified.");
      }

      await n05Rest("document_files?id=eq." + encodeURIComponent(document.id) + "&candidate_id=eq." + encodeURIComponent(actor.candidateId), {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({
          document_status: "UPLOADED",
          metadata: { upload_state: "BYTES_CONFIRMED", storage_confirmed_size: actualSize, storage_reported_mime: actualMime || null }
        })
      });
      await n05Rest("document_storage_events", {
        method: "POST",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({
          document_id: document.id,
          event_ref: n05Ref("evt"),
          event_type: "UPLOAD_COMPLETED",
          storage_provider: "SUPABASE",
          storage_bucket: document.storage_bucket,
          storage_path: document.storage_path,
          file_size_bytes: actualSize,
          checksum_sha256: null,
          status: "OK",
          message: "Storage confirmed object existence and declared size; file content remains unverified.",
          metadata: { candidate_id: actor.candidateId, document_ref: document.document_ref, content_signature_scan: "NOT_CONFIGURED" }
        })
      });
    }

    return Response.json({
      ok: true,
      productionReady: false,
      documentRef: document.document_ref,
      documentStatus: "UPLOADED",
      verificationStatus: "PENDING",
      contentSafetyStatus: "REVIEW_REQUIRED",
      readyForApplicationUse: false,
      message: "Upload bytes confirmed. The document is private and remains unverified until content-signature and malware/safety review are implemented."
    }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return n05ErrorResponse(error);
  }
}
