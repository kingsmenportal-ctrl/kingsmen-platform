import { n05Candidate, n05ErrorResponse, n05Rest, n05SafeFilename, n05Ref, validateN05Upload, N05Error } from "../../../../../lib/n05-server";

export async function POST(request: Request) {
  try {
    const actor = await n05Candidate(request);
    const body = await request.json().catch(() => null) as any;
    if (!body || typeof body !== "object") throw new N05Error(400, "A JSON upload request is required.");
    validateN05Upload(body);

    let applicationId: string | null = null;
    if (body.applicationId !== undefined && body.applicationId !== null && body.applicationId !== "") {
      if (typeof body.applicationId !== "string") throw new N05Error(400, "Invalid application reference.");
      const appQuery = new URLSearchParams({ select: "id", id: "eq." + body.applicationId, candidate_id: "eq." + actor.candidateId, limit: "1" });
      const owned = await n05Rest("applications?" + appQuery);
      if (!Array.isArray(owned) || owned.length !== 1) throw new N05Error(403, "Application does not belong to the verified candidate.");
      applicationId = body.applicationId;
    }

    const bucketResponse = await fetch(actor.baseUrl + "/storage/v1/bucket/" + encodeURIComponent(actor.bucket), {
      headers: { apikey: actor.serviceKey, authorization: "Bearer " + actor.serviceKey },
      cache: "no-store"
    });
    if (!bucketResponse.ok) throw new N05Error(503, "Private storage bucket could not be verified.");
    const bucket = await bucketResponse.json() as { public?: boolean };
    if (bucket.public !== false) throw new N05Error(503, "Document bucket must be private.");

    const documentRef = n05Ref();
    const eventRef = n05Ref("evt");
    const safeName = n05SafeFilename(body.filename);
    const storagePath = actor.candidateId + "/" + body.documentTypeCode + "/" + documentRef + "/" + safeName;
    const record = {
      candidate_id: actor.candidateId,
      application_id: applicationId,
      document_ref: documentRef,
      document_type: body.documentTypeCode,
      display_name: body.documentTypeCode + " - " + body.filename.slice(0, 240),
      original_filename: body.filename,
      mime_type: body.mimeType,
      file_size_bytes: body.sizeBytes,
      storage_provider: "SUPABASE",
      storage_bucket: actor.bucket,
      storage_path: storagePath,
      protected_data: true,
      source_channel: "PORTAL",
      document_status: "PROCESSING",
      verification_status: "PENDING",
      extraction_status: "NOT_STARTED",
      source_confidence_band: "C",
      metadata: { upload_state: "SIGNED_URL_ISSUED", uploaded_by_auth_user_id: actor.authUserId }
    };
    await n05Rest("document_files", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify(record)
    });

    const objectPath = storagePath.split("/").map(encodeURIComponent).join("/");
    const signedResponse = await fetch(actor.baseUrl + "/storage/v1/object/upload/sign/" + encodeURIComponent(actor.bucket) + "/" + objectPath, {
      method: "POST",
      headers: {
        apikey: actor.serviceKey,
        authorization: "Bearer " + actor.serviceKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({ upsert: false }),
      cache: "no-store"
    });
    if (!signedResponse.ok) {
      await n05Rest("document_files?document_ref=eq." + encodeURIComponent(documentRef), {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ document_status: "REJECTED", metadata: { upload_state: "SIGNER_FAILED" } })
      }).catch(() => null);
      throw new N05Error(503, "Storage did not issue a signed upload capability.");
    }
    const signed = await signedResponse.json() as { url?: string; signedURL?: string; token?: string };
    const relative = signed.signedURL || signed.url;
    if (!relative) throw new N05Error(503, "Storage returned no signed upload URL.");
    const signedUploadUrl = relative.startsWith("http") ? relative : actor.baseUrl + "/storage/v1" + (relative.startsWith("/") ? relative : "/" + relative);

    await n05Rest("document_storage_events", {
      method: "POST",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        document_id: null,
        event_ref: eventRef,
        event_type: "SIGNED_UPLOAD_CREATED",
        storage_provider: "SUPABASE",
        storage_bucket: actor.bucket,
        storage_path: storagePath,
        file_size_bytes: body.sizeBytes,
        checksum_sha256: null,
        status: "OK",
        message: "Short-lived signed upload capability issued to verified candidate.",
        metadata: { document_ref: documentRef, candidate_id: actor.candidateId, expires_in_seconds: 900 }
      })
    });

    return Response.json({
      ok: true,
      productionReady: false,
      documentRef,
      uploadUrl: signedUploadUrl,
      uploadToken: signed.token || null,
      expiresInSeconds: 900,
      method: "PUT",
      requiredHeaders: { "Content-Type": body.mimeType },
      nextStep: "Upload bytes to the signed URL, then call /api/candidate/documents/finalize with documentRef.",
      note: "The document remains PROCESSING and unverified until finalization and safety review."
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return n05ErrorResponse(error);
  }
}
