import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = "kingsmen-candidate-documents";
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_EXT: Record<string,string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const origins = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888",
]);

function isAllowedOrigin(origin: string): boolean {
  return origins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}
function reply(status: number, body: Record<string,unknown>, origin: string | null) {
  const headers: Record<string,string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Pragma": "no-cache",
    "Vary": "Origin",
  };
  if (origin && isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
function safeFilename(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFKC").replace(/[\/\\\x00-\x1f\x7f]/g, "_").trim().slice(0,180);
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return reply(403, { error: "Origin not allowed." }, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    ...(origin && isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  }});
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." }, origin);
  if (!URL || !ANON || !SERVICE) return reply(503, { error: "Private document service is not configured." }, origin);
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
  if (!token) return reply(401, { error: "A signed-in account is required." }, origin);
  const auth = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid or expired. Sign in again." }, origin);
  let p: Record<string,unknown>;
  try { p = await req.json(); } catch { return reply(400, { error: "Request body must be valid JSON." }, origin); }
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  // Reviewer queue and read access are gated independently of candidate identity.
  // Never return storage paths or file bytes; downloads are short-lived and audited.
  if (p.action === "list_review_queue" || p.action === "create_reviewer_download_url") {
    const reviewerRoles = await admin.from("platform_reviewers")
      .select("role_code").eq("auth_user_id", authData.user.id)
      .eq("is_active", true).is("revoked_at", null)
      .in("role_code", ["EVIDENCE_VERIFIER", "PLATFORM_ADMIN"]);
    if (reviewerRoles.error) {
      console.error("document reviewer permission lookup failed", reviewerRoles.error.code ?? "unknown");
      return reply(503, { error: "Could not verify reviewer permissions." }, origin);
    }
    if (!(reviewerRoles.data ?? []).length) {
      return reply(403, { code: "DOCUMENT_REVIEWER_REQUIRED", error: "An active evidence-verifier permission is required." }, origin);
    }
    if (p.action === "list_review_queue") {
      const { data, error } = await admin.from("candidate_private_documents")
        .select("id,candidate_id,preparation_item_id,original_filename,mime_type,size_bytes,status,uploaded_at,created_at,updated_at")
        .in("status", ["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW"])
        .order("created_at", { ascending: true }).limit(100);
      if (error) {
        console.error("private document review queue failed", error.code ?? "unknown");
        return reply(503, { error: "Could not load the private document review queue." }, origin);
      }
      return reply(200, { ready: true, documents: data ?? [], limit: 100,
        message: "Review queue metadata loaded; file contents and storage paths are not returned." }, origin);
    }
    const id = typeof p.document_id === "string" ? p.document_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "A valid document identifier is required." }, origin);
    const { data: doc, error } = await admin.from("candidate_private_documents")
      .select("id,candidate_id,storage_bucket,storage_path,status")
      .eq("id", id).maybeSingle();
    if (error || !doc) return reply(404, { error: "Private document record not found." }, origin);
    if (doc.storage_bucket !== BUCKET || !String(doc.storage_path).startsWith(String(doc.candidate_id) + "/") ||
        !["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(doc.status)) {
      return reply(409, { error: "This document is not available for reviewer download." }, origin);
    }
    const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: true });
    if (signError || !signed) return reply(503, { error: "Could not create a temporary reviewer download link." }, origin);
    const { error: auditError } = await admin.from("candidate_private_document_events").insert({
      document_id: id, candidate_id: doc.candidate_id, actor_type: "REVIEWER",
      event_type: "READ_LINK_ISSUED", from_status: doc.status, to_status: doc.status,
      metadata: { source: "authenticated_reviewer_endpoint", reviewer_auth_user_id: authData.user.id, expires_in_seconds: 60 },
    });
    if (auditError) {
      console.error("reviewer document download audit failed", auditError.code ?? "unknown");
      return reply(503, { error: "A download link could not be issued because its audit record could not be saved. Retry shortly." }, origin);
    }
    return reply(200, { ready: true, signed_download_url: signed.signedUrl, expires_in_seconds: 60 }, origin);
  }

  // Reviewer actions are handled before candidate-link resolution: reviewers are
  // authorised by the platform reviewer registry, never by candidate identity.
  if (p.action === "review_document") {
    const reviewerRoles = await admin.from("platform_reviewers")
      .select("role_code").eq("auth_user_id", authData.user.id)
      .eq("is_active", true).is("revoked_at", null)
      .in("role_code", ["EVIDENCE_VERIFIER", "PLATFORM_ADMIN"]);
    if (reviewerRoles.error) {
      console.error("document reviewer permission lookup failed", reviewerRoles.error.code ?? "unknown");
      return reply(503, { error: "Could not verify reviewer permissions." }, origin);
    }
    if (!(reviewerRoles.data ?? []).length) {
      return reply(403, { code: "DOCUMENT_REVIEWER_REQUIRED", error: "An active evidence-verifier permission is required." }, origin);
    }
    const documentId = typeof p.document_id === "string" ? p.document_id : "";
    const decision = typeof p.decision === "string" ? p.decision : "";
    const note = typeof p.reviewer_note === "string" ? p.reviewer_note.trim() : "";
    const evidenceReference = typeof p.evidence_reference === "string" ? p.evidence_reference.trim() : "";
    if (!/^[0-9a-f-]{36}$/i.test(documentId)) {
      return reply(400, { error: "A valid document identifier is required." }, origin);
    }
    if (!["START_REVIEW", "VERIFIED", "CORRECTION_REQUIRED", "REJECTED"].includes(decision)) {
      return reply(400, { error: "Decision must be START_REVIEW, VERIFIED, CORRECTION_REQUIRED or REJECTED." }, origin);
    }
    if (decision !== "START_REVIEW" &&
        (note.length < 3 || note.length > 1200 || evidenceReference.length < 3 || evidenceReference.length > 500)) {
      return reply(400, { error: "Final decisions require a reviewer note (3–1200 characters) and evidence reference (3–500 characters)." }, origin);
    }
    const { data: result, error: reviewError } = await admin.rpc("review_candidate_private_document", {
      p_document_id: documentId,
      p_reviewer_auth_user_id: authData.user.id,
      p_decision: decision,
      p_reviewer_note: note,
      p_evidence_reference: evidenceReference,
    });
    if (reviewError) {
      const code = reviewError.code ?? "";
      const status = code === "42501" ? 403 : code === "P0002" ? 404 :
        code === "22023" ? 400 : code === "40001" ? 409 : 503;
      if (status === 503) console.error("document review transaction failed", code || "unknown");
      return reply(status, { error: status === 403 ? "Reviewer permission is required." :
        status === 404 ? "Private document record not found." :
        status === 409 ? "The document is not in a state eligible for this decision." :
        status === 400 ? "The reviewer decision or evidence fields are invalid." :
        "Could not persist the review decision and audit history." }, origin);
    }
    return reply(200, { ready: true, review: result, message: "Reviewer decision and audit history were persisted transactionally." }, origin);
  }

  const { data: link, error: linkError } = await admin.from("candidate_auth_identity_links")
    .select("candidate_id").eq("supabase_user_id", authData.user.id)
    .eq("link_status", "VERIFIED").not("verified_at", "is", null).limit(1).maybeSingle();
  if (linkError) {
    console.error("private document identity lookup failed", linkError.code ?? "unknown");
    return reply(503, { error: "Could not verify candidate access." }, origin);
  }
  if (!link?.candidate_id) return reply(403, {
    code: "IDENTITY_NOT_VERIFIED",
    error: "Private documents are locked until an authorised reviewer verifies your candidate identity.",
  }, origin);
  const candidateId = String(link.candidate_id);

  if (p.action === "list") {
    const { data, error } = await admin.from("candidate_private_documents")
      .select("id,preparation_item_id,application_id,evidence_purpose,original_filename,mime_type,size_bytes,status,uploaded_at,created_at,updated_at")
      .eq("candidate_id", candidateId).order("created_at", { ascending: false });
    if (error) {
      console.error("private document list failed", error.code ?? "unknown");
      return reply(503, { error: "Could not load private document records." }, origin);
    }
    const { data: applications, error: applicationsError } = await admin.from("candidate_applications")
      .select("id,application_ref,pathway_type,status,created_at")
      .eq("candidate_id", candidateId).order("created_at", { ascending: false }).limit(100);
    if (applicationsError) {
      console.error("candidate-owned application list failed", applicationsError.code ?? "unknown");
      return reply(503, { error: "Could not load applications for document linking." }, origin);
    }
    return reply(200, { ready: true, documents: data ?? [], applications: applications ?? [],
      message: "Candidate-owned private document and application metadata loaded; file contents and storage paths are not returned." }, origin);
  }

  if (p.action === "create_upload") {
    const filename = safeFilename(p.filename);
    const mime = typeof p.mime_type === "string" ? p.mime_type : "";
    const size = Number(p.size_bytes);
    const evidencePurpose = typeof p.evidence_purpose === "string" ? p.evidence_purpose : "CANDIDATE_DOCUMENT";
    const evidencePurposes = new Set(["CANDIDATE_DOCUMENT","PRE_SUBMISSION_CHECKLIST","PROVIDER_SUBMISSION_RECEIPT","PROVIDER_REFERENCE","PROVIDER_STATUS_NOTICE","PROVIDER_OUTCOME_NOTICE"]);
    if (!filename || filename.length > 180 || !MIME_EXT[mime] || !Number.isSafeInteger(size) || size < 1 || size > MAX_BYTES || !evidencePurposes.has(evidencePurpose)) {
      return reply(400, { error: "Provide a filename, PDF/JPEG/PNG MIME type, and file size from 1 byte to 10 MiB." }, origin);
    }
    let preparationItemId: string | null = null;
    if (p.preparation_item_id !== undefined && p.preparation_item_id !== null && p.preparation_item_id !== "") {
      if (typeof p.preparation_item_id !== "string" || !/^[0-9a-f-]{36}$/i.test(p.preparation_item_id)) {
        return reply(400, { error: "Preparation item identifier is invalid." }, origin);
      }
      const { data: item, error } = await admin.from("candidate_application_preparation_items")
        .select("id").eq("id", p.preparation_item_id).eq("candidate_id", candidateId).maybeSingle();
      if (error || !item) return reply(404, { error: "That preparation item was not found in your verified workspace." }, origin);
      preparationItemId = item.id;
    }
    let applicationId: string | null = null;
    if (p.application_id !== undefined && p.application_id !== null && p.application_id !== "") {
      if (typeof p.application_id !== "string" || !/^[0-9a-f-]{36}$/i.test(p.application_id)) {
        return reply(400, { error: "Application identifier is invalid." }, origin);
      }
      const { data: application, error: applicationError } = await admin.from("candidate_applications")
        .select("id").eq("id", p.application_id).eq("candidate_id", candidateId).maybeSingle();
      if (applicationError || !application) return reply(404, { error: "That application was not found in your verified workspace." }, origin);
      applicationId = application.id;
    }
    if (["PROVIDER_SUBMISSION_RECEIPT","PROVIDER_REFERENCE","PROVIDER_STATUS_NOTICE","PROVIDER_OUTCOME_NOTICE"].includes(evidencePurpose) && !applicationId) {
      return reply(400, { error: "Provider submission, status and outcome evidence must be linked to a specific application." }, origin);
    }
    const id = crypto.randomUUID();
    const path = candidateId + "/" + id + "." + MIME_EXT[mime];
    const { data: record, error: insertError } = await admin.from("candidate_private_documents").insert({
      id, candidate_id: candidateId, created_by_auth_user_id: authData.user.id,
      preparation_item_id: preparationItemId, application_id: applicationId, evidence_purpose: evidencePurpose,
      storage_bucket: BUCKET, storage_path: path, original_filename: filename,
      mime_type: mime, size_bytes: size, status: "UPLOAD_PENDING",
    }).select("id,status,evidence_purpose,original_filename,mime_type,size_bytes,application_id,created_at").single();
    if (insertError || !record) {
      console.error("private document record create failed", insertError?.code ?? "unknown");
      return reply(503, { error: "Could not create a private document record." }, origin);
    }
    const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (signError || !signed) {
      await admin.from("candidate_private_documents").delete().eq("id", id).eq("candidate_id", candidateId).eq("status", "UPLOAD_PENDING");
      console.error("private document upload ticket failed", signError?.message ?? "unknown");
      return reply(503, { error: "Could not prepare a secure upload. No file has been uploaded." }, origin);
    }
    return reply(201, {
      ready: true, document: record, bucket: BUCKET, path,
      signed_upload_url: signed.signedUrl, upload_token: signed.token,
      expires_in_seconds: 120,
      next_action: "Upload the file to the returned signed URL, then call finalize_upload with this document_id. The record remains unverified until a reviewer acts.",
    }, origin);
  }

  if (p.action === "finalize_upload") {
    const id = typeof p.document_id === "string" ? p.document_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "A valid document identifier is required." }, origin);
    const { data: doc, error: docError } = await admin.from("candidate_private_documents")
      .select("id,candidate_id,storage_bucket,storage_path,original_filename,mime_type,size_bytes,status")
      .eq("id", id).eq("candidate_id", candidateId).maybeSingle();
    if (docError || !doc) return reply(404, { error: "Private document record not found." }, origin);
    if (doc.status === "UPLOADED_CANDIDATE_REPORTED" || doc.status === "UNDER_REVIEW" || doc.status === "VERIFIED") {
      const { data: audit, error: auditReadError } = await admin.from("candidate_private_document_events")
        .select("id").eq("document_id", id).eq("event_type", "UPLOAD_CONFIRMED").limit(1);
      if (auditReadError) {
        console.error("private document audit lookup failed", auditReadError.code ?? "unknown");
        return reply(503, { error: "The document is finalized, but its audit record could not be checked. Retry shortly." }, origin);
      }
      if (!(audit ?? []).length) {
        const { error: auditRepairError } = await admin.from("candidate_private_document_events").insert({
          document_id: id, candidate_id: candidateId, actor_type: "CANDIDATE",
          event_type: "UPLOAD_CONFIRMED", from_status: "UPLOAD_PENDING",
          to_status: doc.status, metadata: { source: "authenticated_candidate_endpoint", recovered: true },
        });
        if (auditRepairError) {
          console.error("private document audit recovery failed", auditRepairError.code ?? "unknown");
          return reply(503, { error: "The document is finalized, but its audit record could not be restored. Retry shortly." }, origin);
        }
      }
      return reply(200, { ready: true, document: { id: doc.id, status: doc.status }, already_finalized: true }, origin);
    }
    if (doc.status !== "UPLOAD_PENDING" || doc.storage_bucket !== BUCKET || !String(doc.storage_path).startsWith(candidateId + "/")) {
      return reply(409, { error: "This document is not eligible for upload finalization." }, origin);
    }
    const folder = String(doc.storage_path).split("/")[0];
    const basename = String(doc.storage_path).split("/")[1];
    const { data: objects, error: listError } = await admin.storage.from(BUCKET).list(folder, { search: basename, limit: 10 });
    if (listError) {
      console.error("private document object check failed", listError.message);
      return reply(503, { error: "Could not verify that the uploaded file exists. Retry shortly." }, origin);
    }
    const object = (objects ?? []).find((entry: any) => entry.name === basename);
    if (!object) return reply(409, { error: "The file is not present in private storage yet. Upload it before finalizing." }, origin);
    const { data: storedFile, error: downloadError } = await admin.storage.from(BUCKET).download(doc.storage_path);
    if (downloadError || !storedFile) {
      console.error("private document content check failed", downloadError?.message ?? "unknown");
      return reply(503, { error: "Could not inspect the uploaded file safely. Retry shortly." }, origin);
    }
    const bytes = await storedFile.arrayBuffer();
    const actualSize = bytes.byteLength;
    const head = new Uint8Array(bytes.slice(0, 8));
    const startsWith = (signature: number[]) => signature.every((value, index) => head[index] === value);
    const signatureValid = doc.mime_type === "application/pdf"
      ? new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-"
      : doc.mime_type === "image/jpeg"
        ? startsWith([0xff, 0xd8, 0xff])
        : doc.mime_type === "image/png"
          ? startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
          : false;
    if (!Number.isFinite(actualSize) || actualSize < 1 || actualSize > MAX_BYTES || actualSize !== Number(doc.size_bytes) || !signatureValid) {
      const { error: removeError } = await admin.storage.from(BUCKET).remove([doc.storage_path]);
      const { error: failError } = await admin.from("candidate_private_documents").update({ status: "UPLOAD_FAILED", updated_at: new Date().toISOString() })
        .eq("id", id).eq("candidate_id", candidateId).eq("status", "UPLOAD_PENDING");
      const { error: failAuditError } = await admin.from("candidate_private_document_events").insert({
        document_id: id, candidate_id: candidateId, actor_type: "SYSTEM",
        event_type: "UPLOAD_FAILED", from_status: "UPLOAD_PENDING", to_status: "UPLOAD_FAILED",
        metadata: { reason: "size_or_file_signature_invalid", object_removed: !removeError },
      });
      if (removeError || failError || failAuditError) console.error("invalid upload cleanup incomplete", removeError?.message ?? failError?.code ?? failAuditError?.code ?? "unknown");
      return reply(409, { error: "The uploaded file size or file signature did not match the declared PDF/JPEG/PNG type. The upload was rejected." }, origin);
    }
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256Hex = Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin.from("candidate_private_documents")
      .update({ status: "UPLOADED_CANDIDATE_REPORTED", sha256_hex: sha256Hex, uploaded_at: now, updated_at: now })
      .eq("id", id).eq("candidate_id", candidateId).eq("status", "UPLOAD_PENDING")
      .select("id,original_filename,mime_type,size_bytes,status,uploaded_at").maybeSingle();
    if (updateError || !updated) {
      console.error("private document finalize failed", updateError?.code ?? "unknown");
      return reply(503, { error: "The file is present, but its record could not be finalized. Retry shortly." }, origin);
    }
    const { error: auditError } = await admin.from("candidate_private_document_events").insert({
      document_id: id, candidate_id: candidateId, actor_type: "CANDIDATE",
      event_type: "UPLOAD_CONFIRMED", from_status: "UPLOAD_PENDING",
      to_status: "UPLOADED_CANDIDATE_REPORTED", metadata: { source: "authenticated_candidate_endpoint" },
    });
    if (auditError) {
      console.error("private document audit insert failed", auditError.code ?? "unknown");
      // Keep the record retryable if audit persistence failed. If this conditional
      // rollback also fails, the idempotent retry path repairs the missing audit.
      const { error: rollbackError } = await admin.from("candidate_private_documents")
        .update({ status: "UPLOAD_PENDING", uploaded_at: null, updated_at: new Date().toISOString() })
        .eq("id", id).eq("candidate_id", candidateId).eq("status", "UPLOADED_CANDIDATE_REPORTED");
      if (rollbackError) console.error("private document audit rollback failed", rollbackError.code ?? "unknown");
      return reply(503, { error: "The file is present, but its audit record could not be saved. Retry finalization shortly." }, origin);
    }
    return reply(200, { ready: true, document: updated, message: "Upload recorded as candidate-reported. It is not independently verified." }, origin);
  }

  if (p.action === "create_download_url") {
    const id = typeof p.document_id === "string" ? p.document_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "A valid document identifier is required." }, origin);
    const { data: doc, error } = await admin.from("candidate_private_documents")
      .select("id,storage_bucket,storage_path,status").eq("id", id).eq("candidate_id", candidateId).maybeSingle();
    if (error || !doc) return reply(404, { error: "Private document record not found." }, origin);
    if (doc.storage_bucket !== BUCKET || !String(doc.storage_path).startsWith(candidateId + "/") ||
        !["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(doc.status)) {
      return reply(409, { error: "This document is not available for download." }, origin);
    }
    const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: true });
    if (signError || !signed) return reply(503, { error: "Could not create a temporary download link." }, origin);
    const { error: auditError } = await admin.from("candidate_private_document_events").insert({
      document_id: id, candidate_id: candidateId, actor_type: "CANDIDATE",
      event_type: "READ_LINK_ISSUED", from_status: doc.status, to_status: doc.status,
      metadata: { source: "authenticated_candidate_endpoint", expires_in_seconds: 60 },
    });
    if (auditError) {
      console.error("private document download audit failed", auditError.code ?? "unknown");
      return reply(503, { error: "A download link could not be issued because its audit record could not be saved. Retry shortly." }, origin);
    }
    return reply(200, { ready: true, signed_download_url: signed.signedUrl, expires_in_seconds: 60 }, origin);
  }

  return reply(400, { error: "Unsupported document action. Use list, create_upload, finalize_upload, create_download_url, list_review_queue, create_reviewer_download_url, or review_document." }, origin);
});
