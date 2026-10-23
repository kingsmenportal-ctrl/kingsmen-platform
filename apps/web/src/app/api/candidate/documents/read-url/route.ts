import { NextResponse } from "next/server";
import { resolveReviewedCandidate, truthVaultRequest, WorkspaceAuthError } from "@/lib/candidate-workspace-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BUCKET = "kingsmen-candidate-documents";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(error: unknown) {
  if (error instanceof WorkspaceAuthError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  return NextResponse.json({ ok: false, error: "Private document read link could not be issued safely." }, { status: 503 });
}
export async function POST(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const documentId = typeof body.documentId === "string" ? body.documentId : "";
    if (!uuid.test(documentId)) return NextResponse.json({ ok: false, error: "A valid document ID is required." }, { status: 400 });
    const rows = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_private_documents",
      `select=id,candidate_id,storage_bucket,storage_path,original_filename,mime_type,size_bytes,status&id=eq.${encodeURIComponent(documentId)}&candidate_id=eq.${encodeURIComponent(candidateId)}&limit=1`
    );
    const doc = rows[0];
    if (!doc) return NextResponse.json({ ok: false, error: "Document was not found for this candidate." }, { status: 404 });
    if (doc.storage_bucket !== BUCKET || !String(doc.storage_path).startsWith(`${candidateId}/`) ||
        !["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(String(doc.status))) {
      return NextResponse.json({ ok: false, error: "This document is not yet available for reading." }, { status: 409 });
    }
    const configUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!configUrl || !serviceKey) throw new WorkspaceAuthError("Private storage signing is not configured.", 503);
    const signed = await fetch(`${configUrl}/storage/v1/object/sign/${BUCKET}/${doc.storage_path}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 600 }), cache: "no-store"
    });
    if (!signed.ok) throw new WorkspaceAuthError("Private storage could not issue a read link.", 503);
    const data = await signed.json() as { signedURL?: string; signedUrl?: string };
    const raw = data.signedURL || data.signedUrl;
    if (!raw) throw new WorkspaceAuthError("Private storage returned no signed read URL.", 503);
    await truthVaultRequest("candidate_private_document_events", "", "POST", {
      document_id: documentId, candidate_id: candidateId, actor_type: "CANDIDATE", event_type: "READ_LINK_ISSUED",
      from_status: String(doc.status), to_status: String(doc.status), metadata: { expiresInSeconds: 600 }
    });
    return NextResponse.json({ ok: true, documentId, signedReadUrl: (raw.startsWith("http://") || raw.startsWith("https://")) ? raw : configUrl + "/storage/v1/" + raw.replace(/^\/+/, ""), expiresInSeconds: 600 }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
