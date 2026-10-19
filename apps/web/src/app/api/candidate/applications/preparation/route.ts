import { NextResponse } from "next/server";
import { resolveReviewedCandidate, truthVaultRequest, WorkspaceAuthError } from "@/lib/candidate-workspace-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const types = new Set(["DOCUMENT", "TASK"]);
const statuses = new Set(["NOT_STARTED", "IN_PROGRESS", "READY_CANDIDATE_REPORTED"]);
const controls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

function fail(error: unknown) {
  if (error instanceof WorkspaceAuthError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  return NextResponse.json({ ok: false, error: "Application preparation request failed safely." }, { status: 503 });
}
function text(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length <= max && !controls.test(value) ? value.trim() : null;
}
function validUrl(value: string) {
  if (!value) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
async function ownTracker(trackerId: string, candidateId: string) {
  if (!uuid.test(trackerId)) return false;
  const rows = await truthVaultRequest<Array<{ id: string }>>(
    "candidate_application_tracker",
    `select=id&id=eq.${encodeURIComponent(trackerId)}&candidate_id=eq.${encodeURIComponent(candidateId)}&limit=1`
  );
  return rows.length === 1;
}

export async function GET(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const trackerId = new URL(request.url).searchParams.get("trackerId") ?? "";
    if (trackerId && !await ownTracker(trackerId, candidateId)) {
      return NextResponse.json({ ok: false, error: "Application tracker item was not found for this candidate." }, { status: 404 });
    }
    const filter = trackerId ? `&tracker_id=eq.${encodeURIComponent(trackerId)}` : "";
    const [items, events] = await Promise.all([
      truthVaultRequest<Array<Record<string, unknown>>>(
        "candidate_application_preparation_items",
        `select=id,tracker_id,item_type,title,candidate_note,official_source_url,evidence_reference,status,required_by_candidate,due_date,created_at,updated_at&candidate_id=eq.${encodeURIComponent(candidateId)}${filter}&order=created_at.asc&limit=500`
      ),
      truthVaultRequest<Array<Record<string, unknown>>>(
        "candidate_application_preparation_events",
        `select=id,item_id,tracker_id,previous_status,new_status,item_title,evidence_reference,changed_at&candidate_id=eq.${encodeURIComponent(candidateId)}${filter}&order=changed_at.desc&limit=1000`
      )
    ]);
    return NextResponse.json({ ok: true, source: "truth_vault", items, events, verificationBoundary: "Candidate-reported readiness is not independent document or institution verification." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const trackerId = typeof body.trackerId === "string" ? body.trackerId : "";
    const itemType = typeof body.itemType === "string" ? body.itemType : "";
    const title = text(body.title, 160);
    const note = text(body.candidateNote ?? "", 1200);
    const sourceUrl = text(body.officialSourceUrl ?? "", 1000);
    const evidenceReference = text(body.evidenceReference ?? "", 1000);
    const dueDate = body.dueDate === "" || body.dueDate == null ? null : typeof body.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : "invalid";
    if (!uuid.test(trackerId) || !types.has(itemType) || !title || title.length < 2 || note === null || sourceUrl === null || evidenceReference === null ||
        !validUrl(sourceUrl) || dueDate === "invalid" || (body.requiredByCandidate !== undefined && typeof body.requiredByCandidate !== "boolean")) {
      return NextResponse.json({ ok: false, error: "Checklist type, title, notes, HTTPS source, evidence reference or due date is invalid." }, { status: 400 });
    }
    if (!await ownTracker(trackerId, candidateId)) return NextResponse.json({ ok: false, error: "Application tracker item was not found for this candidate." }, { status: 404 });
    const status = typeof body.status === "string" && statuses.has(body.status) ? body.status : "NOT_STARTED";
    if (status === "READY_CANDIDATE_REPORTED" && !evidenceReference) {
      return NextResponse.json({ ok: false, error: "Add an evidence reference before reporting this item ready." }, { status: 400 });
    }
    const rows = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_application_preparation_items",
      "select=id,tracker_id,candidate_id,item_type,title,candidate_note,official_source_url,evidence_reference,status,required_by_candidate,due_date,created_at,updated_at",
      "POST",
      {
        tracker_id: trackerId, candidate_id: candidateId, item_type: itemType, title, candidate_note: note,
        official_source_url: sourceUrl, evidence_reference: evidenceReference, status,
        required_by_candidate: body.requiredByCandidate !== false, due_date: dueDate, updated_at: new Date().toISOString()
      }
    );
    if (!rows[0] || rows[0].candidate_id !== candidateId || rows[0].tracker_id !== trackerId) {
      throw new WorkspaceAuthError("Checklist item was not persisted for this candidate.", 503);
    }
    return NextResponse.json({ ok: true, source: "truth_vault", item: rows[0] }, { status: 201, headers: { "Cache-Control": "no-store" } });
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
    const title = text(body.title, 160);
    const note = text(body.candidateNote, 1200);
    const sourceUrl = text(body.officialSourceUrl, 1000);
    const evidenceReference = text(body.evidenceReference, 1000);
    const dueDate = body.dueDate === "" || body.dueDate == null ? null : typeof body.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : "invalid";
    if (!uuid.test(id) || !statuses.has(status) || !title || title.length < 2 || note === null || sourceUrl === null ||
        evidenceReference === null || !validUrl(sourceUrl) || dueDate === "invalid" ||
        (body.requiredByCandidate !== undefined && typeof body.requiredByCandidate !== "boolean")) {
      return NextResponse.json({ ok: false, error: "Checklist update is invalid." }, { status: 400 });
    }
    if (status === "READY_CANDIDATE_REPORTED" && !evidenceReference) {
      return NextResponse.json({ ok: false, error: "Add an evidence reference before reporting this item ready." }, { status: 400 });
    }
    const rows = await truthVaultRequest<Array<Record<string, unknown>>>(
      "candidate_application_preparation_items",
      `id=eq.${encodeURIComponent(id)}&candidate_id=eq.${encodeURIComponent(candidateId)}&select=id,tracker_id,candidate_id,item_type,title,candidate_note,official_source_url,evidence_reference,status,required_by_candidate,due_date,updated_at`,
      "PATCH",
      {
        status, title, candidate_note: note, official_source_url: sourceUrl, evidence_reference: evidenceReference,
        due_date: dueDate, required_by_candidate: body.requiredByCandidate !== false, updated_at: new Date().toISOString()
      }
    );
    if (rows.length !== 1 || rows[0].candidate_id !== candidateId) {
      return NextResponse.json({ ok: false, error: "Checklist item was not found for this candidate." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, source: "truth_vault", item: rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!uuid.test(id)) return NextResponse.json({ ok: false, error: "A valid checklist item ID is required." }, { status: 400 });
    const rows = await truthVaultRequest<Array<{ id: string }>>(
      "candidate_application_preparation_items",
      `id=eq.${encodeURIComponent(id)}&candidate_id=eq.${encodeURIComponent(candidateId)}&select=id`,
      "DELETE"
    );
    if (!rows.length) return NextResponse.json({ ok: false, error: "Checklist item was not found for this candidate." }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: true, source: "truth_vault" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
