import { NextResponse } from "next/server";
import { resolveReviewedCandidate, truthVaultRequest, WorkspaceAuthError } from "@/lib/candidate-workspace-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const taskIds = new Set(["profile", "documents", "pathway", "evidence"]);
const pathways = new Set(["", "higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]);

function failure(error: unknown) {
  if (error instanceof WorkspaceAuthError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }
  return NextResponse.json({ ok: false, error: "Candidate workspace request failed safely." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const [readinessRows, opportunities] = await Promise.all([
      truthVaultRequest<Array<{ completed_tasks: string[]; priority_pathway: string; revision: number; updated_at: string }>>(
        "candidate_workspace_readiness",
        `select=completed_tasks,priority_pathway,revision,updated_at&candidate_id=eq.${encodeURIComponent(candidateId)}&limit=1`
      ),
      truthVaultRequest<Array<{ id: string; title: string; organisation: string; official_url: string; pathway: string; closing_date: string | null; created_at: string }>>(
        "candidate_workspace_saved_opportunities",
        `select=id,title,organisation,official_url,pathway,closing_date,created_at&candidate_id=eq.${encodeURIComponent(candidateId)}&order=created_at.desc&limit=100`
      )
    ]);
    const readiness = readinessRows[0] ?? { completed_tasks: [], priority_pathway: "", revision: 0, updated_at: null };
    return NextResponse.json({
      ok: true,
      source: "truth_vault",
      readiness: { tasks: readiness.completed_tasks, pathway: readiness.priority_pathway, revision: readiness.revision, updatedAt: readiness.updated_at },
      opportunities: opportunities.map((item) => ({
        id: item.id, title: item.title, organisation: item.organisation, url: item.official_url,
        pathway: item.pathway, closingDate: item.closing_date ?? "", savedAt: item.created_at
      }))
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const body = await request.json();
    if (!body || !Array.isArray(body.tasks) || body.tasks.some((id: unknown) => typeof id !== "string" || !taskIds.has(id)) ||
        typeof body.pathway !== "string" || !pathways.has(body.pathway)) {
      return NextResponse.json({ ok: false, error: "Readiness tasks or pathway are invalid." }, { status: 400 });
    }
    const rows = await truthVaultRequest<Array<{ candidate_id: string; completed_tasks: string[]; priority_pathway: string; revision: number; updated_at: string }>>(
      "candidate_workspace_readiness",
      "on_conflict=candidate_id",
      "POST",
      { candidate_id: candidateId, completed_tasks: [...new Set(body.tasks)], priority_pathway: body.pathway, updated_at: new Date().toISOString(), revision: 1 }
    );
    const saved = rows[0];
    if (!saved || saved.candidate_id !== candidateId) throw new WorkspaceAuthError("Readiness was not persisted for this candidate.", 503);
    return NextResponse.json({ ok: true, source: "truth_vault", readiness: { tasks: saved.completed_tasks, pathway: saved.priority_pathway, revision: saved.revision, updatedAt: saved.updated_at } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const organisation = typeof body?.organisation === "string" ? body.organisation.trim() : "";
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    const pathway = typeof body?.pathway === "string" ? body.pathway : "";
    const closingDate = typeof body?.closingDate === "string" ? body.closingDate : "";
    let url: URL;
    try { url = new URL(rawUrl); } catch { return NextResponse.json({ ok: false, error: "Enter a valid official opportunity URL." }, { status: 400 }); }
    if (!title || title.length > 180 || !organisation || organisation.length > 180 ||
        !["http:", "https:"].includes(url.protocol) || !pathways.has(pathway) || !pathway ||
        (closingDate && !/^\d{4}-\d{2}-\d{2}$/.test(closingDate))) {
      return NextResponse.json({ ok: false, error: "Opportunity details are invalid." }, { status: 400 });
    }
    const rows = await truthVaultRequest<Array<{ id: string; candidate_id: string; title: string; organisation: string; official_url: string; pathway: string; closing_date: string | null; created_at: string }>>(
      "candidate_workspace_saved_opportunities",
      "on_conflict=candidate_id,official_url",
      "POST",
      { candidate_id: candidateId, title, organisation, official_url: url.toString(), pathway, closing_date: closingDate || null, updated_at: new Date().toISOString() }
    );
    const saved = rows[0];
    if (!saved || saved.candidate_id !== candidateId) throw new WorkspaceAuthError("Opportunity was not persisted for this candidate.", 503);
    return NextResponse.json({ ok: true, source: "truth_vault", opportunity: { id: saved.id, title: saved.title, organisation: saved.organisation, url: saved.official_url, pathway: saved.pathway, closingDate: saved.closing_date ?? "", savedAt: saved.created_at } }, { status: 201 });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  try {
    const { candidateId } = await resolveReviewedCandidate(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ ok: false, error: "A valid saved opportunity ID is required." }, { status: 400 });
    }
    const rows = await truthVaultRequest<Array<{ id: string }>>(
      "candidate_workspace_saved_opportunities",
      `id=eq.${encodeURIComponent(id)}&candidate_id=eq.${encodeURIComponent(candidateId)}&select=id`,
      "DELETE"
    );
    if (!rows.length) return NextResponse.json({ ok: false, error: "Saved opportunity not found for this candidate." }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: true, source: "truth_vault" });
  } catch (error) { return failure(error); }
}
