import { NextResponse } from "next/server";
import { resolveReviewedCandidate, truthVaultRequest, WorkspaceAuthError } from "@/lib/candidate-workspace-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = new Set([
  "SAVED", "PREPARING", "READY_TO_APPLY", "SUBMITTED_CANDIDATE_REPORTED",
  "RESPONSE_RECEIVED", "INTERVIEW", "OFFER_RECEIVED", "REJECTED", "CLOSED"
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(error: unknown) {
  if (error instanceof WorkspaceAuthError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }
  return NextResponse.json({ ok: false, error: "Application tracker request failed safely." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const rows = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_application_tracker",
      `select=id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at&candidate_id=eq.${encodeURIComponent(candidateId)}&order=updated_at.desc&limit=200`
    );
    const events = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_application_tracker_events",
      `select=id,tracker_id,previous_status,new_status,candidate_note,evidence_reference,changed_at&candidate_id=eq.${encodeURIComponent(candidateId)}&order=changed_at.desc&limit=500`
    );
    return NextResponse.json({ ok: true, source: "truth_vault", applications: rows, events }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const opportunityId = typeof body.savedOpportunityId === "string" ? body.savedOpportunityId : "";
    if (!uuid.test(opportunityId)) return NextResponse.json({ ok: false, error: "A valid saved opportunity ID is required." }, { status: 400 });
    const opportunity = await truthVaultRequest<Array<{ id: string }>>(
      "candidate_workspace_saved_opportunities",
      `select=id&id=eq.${encodeURIComponent(opportunityId)}&candidate_id=eq.${encodeURIComponent(candidateId)}&limit=1`
    );
    if (opportunity.length !== 1) return NextResponse.json({ ok: false, error: "Save this opportunity in your own workspace before tracking it." }, { status: 404 });
    const rows = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_application_tracker",
      "on_conflict=candidate_id,saved_opportunity_id",
      "POST",
      { candidate_id: candidateId, saved_opportunity_id: opportunityId, status: "SAVED", updated_at: new Date().toISOString() }
    );
    const tracker = rows[0];
    if (!tracker || tracker.candidate_id !== candidateId) throw new WorkspaceAuthError("Application tracker record was not persisted for this candidate.", 503);
    return NextResponse.json({ ok: true, source: "truth_vault", application: tracker }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" ? body.status : "";
    const candidateNote = typeof body.candidateNote === "string" ? body.candidateNote.trim() : "";
    const evidenceReference = typeof body.evidenceReference === "string" ? body.evidenceReference.trim() : "";
    if (!uuid.test(id) || !statuses.has(status) || candidateNote.length > 1200 || evidenceReference.length > 500 ||
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(candidateNote + evidenceReference)) {
      return NextResponse.json({ ok: false, error: "Application status, note, or evidence reference is invalid." }, { status: 400 });
    }
    if (status === "SUBMITTED_CANDIDATE_REPORTED" && !evidenceReference) {
      return NextResponse.json({ ok: false, error: "Add a confirmation or reference before recording that you report submitting. Kingsmen does not independently verify submission." }, { status: 400 });
    }
    const rows = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_application_tracker",
      `id=eq.${encodeURIComponent(id)}&candidate_id=eq.${encodeURIComponent(candidateId)}&select=id,candidate_id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at`,
      "PATCH",
      { status, candidate_note: candidateNote, evidence_reference: evidenceReference, updated_at: new Date().toISOString() }
    );
    if (rows.length !== 1 || rows[0].candidate_id !== candidateId) {
      return NextResponse.json({ ok: false, error: "Application tracker item was not found for this candidate." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, source: "truth_vault", application: rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!uuid.test(id)) return NextResponse.json({ ok: false, error: "A valid tracker ID is required." }, { status: 400 });
    const rows = await truthVaultRequest<Array<{ id: string }>>(
      "candidate_application_tracker",
      `id=eq.${encodeURIComponent(id)}&candidate_id=eq.${encodeURIComponent(candidateId)}&select=id`,
      "DELETE"
    );
    if (!rows.length) return NextResponse.json({ ok: false, error: "Tracker item was not found for this candidate." }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: true, source: "truth_vault" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
