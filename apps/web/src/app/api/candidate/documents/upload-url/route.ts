import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { resolveReviewedCandidate, truthVaultRequest, WorkspaceAuthError } from "@/lib/candidate-workspace-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BUCKET = "kingsmen-candidate-documents";
const MAX_BYTES = 10 * 1024 * 1024;
const types = new Set(["application/pdf", "image/jpeg", "image/png"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const filenameSafe = (value: string) => value.replace(/[\\/\u0000-\u001f\u007f]/g, "_").replace(/\s+/g, " ").trim().slice(0, 180) || "document";

function fail(error: unknown) {
  if (error instanceof WorkspaceAuthError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  return NextResponse.json({ ok: false, error: "Private document upload could not be prepared safely." }, { status: 503 });
}

export async function POST(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const filename = typeof body.filename === "string" ? filenameSafe(body.filename) : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const sizeBytes = body.sizeBytes;
    const preparationItemId = body.preparationItemId == null || body.preparationItemId === "" ? null : body.preparationItemId;
    if (!filename || !types.has(mimeType) || !Number.isSafeInteger(sizeBytes) || (sizeBytes as number) < 1 || (sizeBytes as number) > MAX_BYTES ||
        (preparationItemId !== null && (typeof preparationItemId !== "string" || !uuid.test(preparationItemId)))) {
      return NextResponse.json({ ok: false, error: "Only PDF, JPEG, or PNG files up to 10 MiB are accepted; filename, size, or checklist reference is invalid." }, { status: 400 });
    }
    if (preparationItemId) {
      const items = await truthVaultRequest<Array<{ id: string }>>(
        "candidate_application_preparation_items",
        `select=id&id=eq.${encodeURIComponent(preparationItemId as string)}&candidate_id=eq.${encodeURIComponent(candidateId)}&limit=1`
      );
      if (items.length !== 1) return NextResponse.json({ ok: false, error: "Preparation item was not found for this candidate." }, { status: 404 });
    }
    const documentId = randomUUID();
    const storagePath = `${candidateId}/${documentId}`;
    const inserted = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_private_documents",
      "select=id,candidate_id,preparation_item_id,storage_bucket,storage_path,original_filename,mime_type,size_bytes,status,created_at",
      "POST",
      { id: documentId, candidate_id: candidateId, preparation_item_id: preparationItemId, storage_bucket: BUCKET, storage_path: storagePath, original_filename: filename, mime_type: mimeType, size_bytes: sizeBytes, status: "UPLOAD_PENDING" }
    );
    if (inserted.length !== 1 || inserted[0].candidate_id !== candidateId) throw new WorkspaceAuthError("Document metadata was not persisted for this candidate.", 503);
    await truthVaultRequest("candidate_private_document_events", "", "POST", {
      document_id: documentId, candidate_id: candidateId, actor_type: "CANDIDATE", event_type: "UPLOAD_REQUESTED",
      from_status: null, to_status: "UPLOAD_PENDING", metadata: { mimeType, sizeBytes }
    });
    const configUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!configUrl || !serviceKey) throw new WorkspaceAuthError("Private storage signing is not configured.", 503);
    const signed = await fetch(`${configUrl}/storage/v1/object/upload/sign/${BUCKET}/${storagePath}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ upsert: false }), cache: "no-store"
    });
    if (!signed.ok) {
      await truthVaultRequest("candidate_private_documents", `id=eq.${documentId}&candidate_id=eq.${encodeURIComponent(candidateId)}`, "PATCH", { status: "UPLOAD_FAILED", updated_at: new Date().toISOString() });
      await truthVaultRequest("candidate_private_document_events", "", "POST", {
        document_id: documentId, candidate_id: candidateId, actor_type: "SYSTEM", event_type: "UPLOAD_FAILED",
        from_status: "UPLOAD_PENDING", to_status: "UPLOAD_FAILED", metadata: { reason: "signing_failed" }
      });
      throw new WorkspaceAuthError("Private storage could not issue an upload link.", 503);
    }
    const data = await signed.json() as { signedURL?: string; url?: string; token?: string };
    const raw = data.signedURL || data.url;
    if (!raw) throw new WorkspaceAuthError("Private storage returned no signed upload URL.", 503);
    return NextResponse.json({
      ok: true, source: "truth_vault", document: inserted[0],
      signedUploadUrl: new URL(raw, `${configUrl}/storage/v1/`).toString(),
      uploadToken: data.token || null, expiresInSeconds: 600,
      uploadHeaders: { "Content-Type": mimeType },
      boundary: "Private signed upload; candidate-reported until upload confirmation and authorised review."
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
