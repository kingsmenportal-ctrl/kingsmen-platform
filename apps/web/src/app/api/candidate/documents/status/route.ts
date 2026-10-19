import { NextResponse } from "next/server";
import { resolveReviewedCandidate, truthVaultRequest, WorkspaceAuthError } from "@/lib/candidate-workspace-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const url = new URL(request.url);
    const documentId = url.searchParams.get("documentId");
    const filter = documentId ? `&id=eq.${encodeURIComponent(documentId)}` : "";
    const [documents, events] = await Promise.all([
      truthVaultRequest<Array<Record<string, unknown>>>("candidate_private_documents",
        `select=id,preparation_item_id,original_filename,mime_type,size_bytes,status,uploaded_at,created_at,updated_at&candidate_id=eq.${encodeURIComponent(candidateId)}${filter}&order=created_at.desc&limit=100`),
      truthVaultRequest<Array<Record<string, unknown>>>("candidate_private_document_events",
        `select=id,document_id,event_type,from_status,to_status,created_at&candidate_id=eq.${encodeURIComponent(candidateId)}${filter ? `&document_id=eq.${encodeURIComponent(documentId!)}` : ""}&order=created_at.desc&limit=300`)
    ]);
    return NextResponse.json({ ok: true, source: "truth_vault", documents, events,
      verificationBoundary: "UPLOAD_PENDING and UPLOADED_CANDIDATE_REPORTED are not independently verified. Only an authorised reviewer can change review status." },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkspaceAuthError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    return NextResponse.json({ ok: false, error: "Document status could not be loaded safely." }, { status: 503 });
  }
}
