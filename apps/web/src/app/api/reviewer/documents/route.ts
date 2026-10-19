import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Auth = { userId: string; url: string; anon: string; service: string };
function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !anon || !service) throw new Error("Reviewer document service is not configured.");
  return { url, anon, service };
}
async function reviewer(request: Request): Promise<Auth | NextResponse> {
  const { url, anon, service } = config();
  const token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) return NextResponse.json({ ok: false, error: "Invalid or expired session." }, { status: 401 });
  const user = await response.json() as { id?: string };
  if (!user.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id))
    return NextResponse.json({ ok: false, error: "Authenticated account could not be verified." }, { status: 401 });
  const role = await fetch(`${url}/rest/v1/platform_reviewers?select=id&auth_user_id=eq.${encodeURIComponent(user.id)}&role_code=eq.PLATFORM_ADMIN&is_active=eq.true&revoked_at=is.null&limit=1`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` }, cache: "no-store" });
  if (!role.ok) throw new Error("Reviewer authorisation lookup failed.");
  const rows = await role.json() as unknown[];
  if (rows.length !== 1) return NextResponse.json({ ok: false, error: "Active platform document-review permission is required." }, { status: 403 });
  return { userId: user.id, url, anon, service };
}
function safeError(error: unknown) {
  if (error instanceof Error && error.message === "Reviewer document service is not configured.")
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  return NextResponse.json({ ok: false, error: "Document review operation failed safely. Refresh status before retrying." }, { status: 503 });
}
export async function GET(request: Request) {
  try {
    const auth = await reviewer(request); if (auth instanceof NextResponse) return auth;
    const response = await fetch(`${auth.url}/rest/v1/candidate_private_documents?select=id,candidate_id,preparation_item_id,original_filename,mime_type,size_bytes,status,uploaded_at,created_at,updated_at&status=in.(UPLOADED_CANDIDATE_REPORTED,UNDER_REVIEW)&order=created_at.asc&limit=100`,
      { headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Review queue query failed.");
    return NextResponse.json({ ok: true, documents: await response.json(), verificationBoundary: "Uploaded evidence is not verified until an authorised reviewer records a decision and evidence reference." },
      { headers: { "Cache-Control": "private, no-store", Pragma: "no-cache" } });
  } catch (error) { return safeError(error); }
}
export async function PATCH(request: Request) {
  try {
    const auth = await reviewer(request); if (auth instanceof NextResponse) return auth;
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const documentId = typeof body.documentId === "string" ? body.documentId : "";
    const decision = typeof body.decision === "string" ? body.decision : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const evidenceReference = typeof body.evidenceReference === "string" ? body.evidenceReference.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId) ||
      !["VERIFIED", "REJECTED"].includes(decision) || note.length < 3 || note.length > 1200 ||
      evidenceReference.length < 3 || evidenceReference.length > 500)
      return NextResponse.json({ ok: false, error: "A valid document, decision, reviewer note, and evidence reference are required." }, { status: 400 });
    const response = await fetch(`${auth.url}/rest/v1/rpc/review_candidate_private_document`, {
      method: "POST", headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_document_id: documentId, p_reviewer_auth_user_id: auth.userId, p_decision: decision, p_reviewer_note: note, p_evidence_reference: evidenceReference }),
      cache: "no-store"
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (detail.includes("not authorised") || detail.includes("42501")) return NextResponse.json({ ok: false, error: "Active platform document-review permission is required." }, { status: 403 });
      if (detail.includes("not found") || detail.includes("P0002")) return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
      if (detail.includes("not awaiting review") || detail.includes("55000")) return NextResponse.json({ ok: false, error: "Document is not awaiting review; refresh the queue." }, { status: 409 });
      if (detail.includes("required") || detail.includes("22023")) return NextResponse.json({ ok: false, error: "The decision, note, or evidence reference is invalid." }, { status: 400 });
      throw new Error("Review decision failed.");
    }
    return NextResponse.json({ ok: true, result: await response.json() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return safeError(error); }
}
