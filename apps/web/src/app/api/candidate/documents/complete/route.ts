import { NextResponse } from "next/server";
import { resolveReviewedCandidate, truthVaultRequest, WorkspaceAuthError } from "@/lib/candidate-workspace-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BUCKET = "kingsmen-candidate-documents";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const documentId = typeof body.documentId === "string" ? body.documentId : "";
    if (!uuid.test(documentId)) return NextResponse.json({ ok: false, error: "A valid document ID is required." }, { status: 400 });
    const rows = await truthVaultRequest<Array<Record<string, unknown>>>("candidate_private_documents",
      `select=id,candidate_id,storage_bucket,storage_path,mime_type,size_bytes,status&id=eq.${encodeURIComponent(documentId)}&candidate_id=eq.${encodeURIComponent(candidateId)}&limit=1`);
    const doc = rows[0];
    if (!doc) return NextResponse.json({ ok: false, error: "Document was not found for this candidate." }, { status: 404 });
    if (doc.status !== "UPLOAD_PENDING" || doc.storage_bucket !== BUCKET || !String(doc.storage_path).startsWith(`${candidateId}/`)) {
      return NextResponse.json({ ok: false, error: "Only an owned pending upload can be confirmed." }, { status: 409 });
    }
    const configUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!configUrl || !serviceKey) throw new WorkspaceAuthError("Private storage verification is not configured.", 503);
    const info = await fetch(`${configUrl}/storage/v1/object/info/${BUCKET}/${doc.storage_path}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store"
    });
    if (!info.ok) return NextResponse.json({ ok: false, error: "The uploaded object is not available in private storage yet." }, { status: 409 });
    const object = await info.json() as Record<string, unknown>;
    const metadata = object.metadata && typeof object.metadata === "object" ? object.metadata as Record<string, unknown> : {};
    const actualSize = Number(object.size ?? metadata.size);
    const actualType = String(object.mimetype ?? object.contentType ?? metadata.mimetype ?? "");
    if (!Number.isFinite(actualSize) || actualSize < 1 || actualSize > 10 * 1024 * 1024 ||
        actualSize !== Number(doc.size_bytes) || (actualType && actualType !== doc.mime_type)) {
      await truthVaultRequest("candidate_private_documents", `id=eq.${documentId}&candidate_id=eq.${encodeURIComponent(candidateId)}`, "PATCH",
        { status: "UPLOAD_FAILED", updated_at: new Date().toISOString() });
      await truthVaultRequest("candidate_private_document_events", "", "POST", {
        document_id: documentId, candidate_id: candidateId, actor_type: "SYSTEM", event_type: "UPLOAD_FAILED",
        from_status: "UPLOAD_PENDING", to_status: "UPLOAD_FAILED", metadata: { reason: "uploaded_object_metadata_mismatch" }
      });
      return NextResponse.json({ ok: false, error: "Stored file size or type did not match the upload request; it is not marked uploaded." }, { status: 422 });
    }
    const updated = await truthVaultRequest<Array<Record<string, unknown>>>("candidate_private_documents",
      `id=eq.${documentId}&candidate_id=eq.${encodeURIComponent(candidateId)}&status=eq.UPLOAD_PENDING&select=id,status,uploaded_at`, "PATCH",
      { status: "UPLOADED_CANDIDATE_REPORTED", uploaded_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    if (updated.length !== 1) return NextResponse.json({ ok: false, error: "Upload state changed before confirmation; refresh document status." }, { status: 409 });
    await truthVaultRequest("candidate_private_document_events", "", "POST", {
      document_id: documentId, candidate_id: candidateId, actor_type: "CANDIDATE", event_type: "UPLOAD_CONFIRMED",
      from_status: "UPLOAD_PENDING", to_status: "UPLOADED_CANDIDATE_REPORTED", metadata: { sizeBytes: actualSize, mimeType: String(doc.mime_type) }
    });
    return NextResponse.json({ ok: true, source: "truth_vault", document: updated[0],
      verificationBoundary: "Upload confirmation proves object presence and matching metadata only; it does not verify authenticity or qualification." },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkspaceAuthError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: "Upload confirmation failed safely." }, { status: 503 });
  }
}
