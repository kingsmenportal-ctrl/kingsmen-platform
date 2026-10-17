import { n05Candidate, n05ErrorResponse, n05Rest, n05Ref, N05Error } from "../../../../lib/n05-server";

export async function POST(request: Request) {
  try {
    const actor = await n05Candidate(request);
    const body = await request.json().catch(() => null) as any;
    if (!body || typeof body.documentRef !== "string" || body.documentRef.length > 100) {
      throw new N05Error(400, "documentRef is required.");
    }
    const query = new URLSearchParams({
      select: "id,candidate_id,document_ref,storage_bucket,storage_path,document_status,verification_status",
      document_ref: "eq." + body.documentRef,
      candidate_id: "eq." + actor.candidateId,
      limit: "1"
    });
    const rows = await n05Rest("document_files?" + query);
    if (!Array.isArray(rows) || rows.length !== 1) throw new N05Error(404, "Document was not found for this candidate.");
    const document = rows[0] as any;
    if (!["UPLOADED", "READY"].includes(document.document_status) || ["REJECTED", "EXPIRED"].includes(document.verification_status)) {
      throw new N05Error(409, "Document is not available for download.");
    }
    const bucketResponse = await fetch(actor.baseUrl + "/storage/v1/bucket/" + encodeURIComponent(document.storage_bucket), {
      headers: { apikey: actor.serviceKey, authorization: "Bearer " + actor.serviceKey },
      cache: "no-store"
    });
    if (!bucketResponse.ok || (await bucketResponse.json() as any).public !== false) {
      throw new N05Error(503, "Private storage could not be verified.");
    }
    const encodedPath = String(document.storage_path).split("/").map(encodeURIComponent).join("/");
    const signedResponse = await fetch(actor.baseUrl + "/storage/v1/object/sign/" + encodeURIComponent(document.storage_bucket) + "/" + encodedPath, {
      method: "POST",
      headers: { apikey: actor.serviceKey, authorization: "Bearer " + actor.serviceKey, "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: 600 }),
      cache: "no-store"
    });
    if (!signedResponse.ok) throw new N05Error(503, "Storage did not issue a signed read capability.");
    const signed = await signedResponse.json() as { signedURL?: string; url?: string };
    const relative = signed.signedURL || signed.url;
    if (!relative) throw new N05Error(503, "Storage returned no signed read URL.");
    const signedReadUrl = relative.startsWith("http") ? relative : actor.baseUrl + "/storage/v1" + (relative.startsWith("/") ? relative : "/" + relative);

    await n05Rest("document_storage_events", {
      method: "POST",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        document_id: document.id,
        event_ref: n05Ref("evt"),
        event_type: "FILE_ACCESSED",
        storage_provider: "SUPABASE",
        storage_bucket: document.storage_bucket,
        storage_path: document.storage_path,
        file_size_bytes: 0,
        checksum_sha256: null,
        status: "OK",
        message: "Short-lived owner-scoped signed read capability issued.",
        metadata: { candidate_id: actor.candidateId, document_ref: document.document_ref, expires_in_seconds: 600 }
      })
    });
    return Response.json({ ok: true, productionReady: false, documentRef: document.document_ref, signedReadUrl, expiresInSeconds: 600, rawPublicUrlAllowed: false }, {
      headers: { "Cache-Control": "no-store", "Pragma": "no-cache" }
    });
  } catch (error) {
    return n05ErrorResponse(error);
  }
}
