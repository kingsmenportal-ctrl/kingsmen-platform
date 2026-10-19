import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Auth = { userId: string; url: string; anon: string; service: string };
async function authenticate(request: Request): Promise<Auth | NextResponse> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !anon || !service) return NextResponse.json({ ok: false, error: "Reviewer document service is not configured." }, { status: 503 });
  const token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!userResponse.ok) return NextResponse.json({ ok: false, error: "Invalid or expired session." }, { status: 401 });
  const user = await userResponse.json() as { id?: string };
  if (!user.id) return NextResponse.json({ ok: false, error: "Authenticated account could not be verified." }, { status: 401 });
  const roleResponse = await fetch(`${url}/rest/v1/platform_reviewers?select=id&auth_user_id=eq.${encodeURIComponent(user.id)}&role_code=eq.PLATFORM_ADMIN&is_active=eq.true&revoked_at=is.null&limit=1`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` }, cache: "no-store" });
  if (!roleResponse.ok) return NextResponse.json({ ok: false, error: "Reviewer authorisation could not be checked." }, { status: 503 });
  if ((await roleResponse.json() as unknown[]).length !== 1) return NextResponse.json({ ok: false, error: "Active platform document-review permission is required." }, { status: 403 });
  return { userId: user.id, url, anon, service };
}
export async function POST(request: Request) {
  try {
    const auth = await authenticate(request); if (auth instanceof NextResponse) return auth;
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ ok: false, error: "Provide valid JSON." }, { status: 400 }); }
    const documentId = typeof body.documentId === "string" ? body.documentId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId))
      return NextResponse.json({ ok: false, error: "A valid document ID is required." }, { status: 400 });
    const lookup = await fetch(`${auth.url}/rest/v1/candidate_private_documents?select=id,storage_bucket,storage_path,status&id=eq.${encodeURIComponent(documentId)}&limit=1`,
      { headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}` }, cache: "no-store" });
    if (!lookup.ok) throw new Error("Document lookup failed.");
    const docs = await lookup.json() as Array<{ id: string; storage_bucket: string; storage_path: string; status: string }>;
    if (docs.length !== 1) return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
    if (!["UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW"].includes(docs[0].status))
      return NextResponse.json({ ok: false, error: "Only documents awaiting review can be opened for review." }, { status: 409 });
    const signed = await fetch(`${auth.url}/storage/v1/object/sign/${encodeURIComponent(docs[0].storage_bucket)}/${docs[0].storage_path.split("/").map(encodeURIComponent).join("/")}`,
      { method: "POST", headers: { apikey: auth.service, Authorization: `Bearer ${auth.service}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 600 }), cache: "no-store" });
    if (!signed.ok) throw new Error("Signed reviewer read could not be issued.");
    const payload = await signed.json() as { signedURL?: string; signedUrl?: string };
    const path = payload.signedURL || payload.signedUrl;
    if (!path) throw new Error("Signed reviewer read response was incomplete.");
    const readUrl = path.startsWith("http") ? path : `${auth.url}${path.startsWith("/") ? "" : "/"}${path}`;
    return NextResponse.json({ ok: true, readUrl, expiresInSeconds: 600 }, { headers: { "Cache-Control": "private, no-store", Pragma: "no-cache" } });
  } catch { return NextResponse.json({ ok: false, error: "Reviewer document access failed safely." }, { status: 503 }); }
}
