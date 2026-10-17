import { randomUUID } from "node:crypto";

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", pragma: "no-cache" } });

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceKey) {
    return json({ ok: false, code: "AUTH_RUNTIME_NOT_CONFIGURED", error: "Secure account linking is not configured on this deployment." }, 503);
  }

  const token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return json({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in before requesting candidate account linking." }, 401);

  let userResponse: Response;
  try {
    userResponse = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anonKey, authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  } catch {
    return json({ ok: false, code: "AUTH_PROVIDER_UNAVAILABLE", error: "The identity provider could not be reached. Try again." }, 503);
  }
  if (!userResponse.ok) return json({ ok: false, code: "INVALID_SESSION", error: "Your session is invalid or expired. Sign in again." }, 401);

  const user = await userResponse.json().catch(() => null) as {
    id?: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null
  } | null;
  const email = user?.email?.trim().toLowerCase();
  if (!user?.id || !email) return json({ ok: false, code: "IDENTITY_EMAIL_MISSING", error: "The identity provider did not return a usable email address." }, 403);
  if (!(user.email_confirmed_at || user.confirmed_at)) {
    return json({ ok: false, code: "EMAIL_CONFIRMATION_REQUIRED", error: "Confirm ownership of your email address before requesting account linking." }, 403);
  }

  const body = await request.json().catch(() => ({})) as { candidateReference?: unknown };
  const reference = typeof body.candidateReference === "string" ? body.candidateReference.trim() : "";
  if (reference.length > 100) return json({ ok: false, code: "CANDIDATE_REFERENCE_TOO_LONG", error: "Candidate reference must be 100 characters or fewer." }, 400);

  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, accept: "application/json" };

  // Only an already VERIFIED identity link proves candidate ownership. Never link by email.
  const verifiedUrl = new URL(`${url}/rest/v1/candidate_auth_identity_links`);
  verifiedUrl.searchParams.set("select", "candidate_id,supabase_user_id,link_status,verified_at,verified_by");
  verifiedUrl.searchParams.set("supabase_user_id", `eq.${user.id}`);
  verifiedUrl.searchParams.set("link_status", "eq.VERIFIED");
  verifiedUrl.searchParams.set("verified_at", "not.is.null");
  verifiedUrl.searchParams.set("verified_by", "not.is.null");
  verifiedUrl.searchParams.set("limit", "2");

  let verifiedResponse: Response;
  try { verifiedResponse = await fetch(verifiedUrl, { headers, cache: "no-store" }); }
  catch { return json({ ok: false, code: "IDENTITY_LINK_LOOKUP_UNAVAILABLE", error: "Verified identity links could not be checked. No candidate was linked." }, 503); }
  if (!verifiedResponse.ok) return json({ ok: false, code: "IDENTITY_LINK_LOOKUP_FAILED", error: "Verified identity links could not be checked. Confirm the connected identity schema." }, 502);
  const verifiedRows = await verifiedResponse.json().catch(() => null) as Array<{ candidate_id?: string; supabase_user_id?: string; verified_at?: string; verified_by?: string }> | null;
  if (!Array.isArray(verifiedRows)) return json({ ok: false, code: "IDENTITY_LINK_RESPONSE_INVALID", error: "Identity lookup returned an invalid response." }, 502);
  if (verifiedRows.length > 1) return json({ ok: false, code: "AMBIGUOUS_VERIFIED_IDENTITY", error: "More than one verified candidate identity link exists. Authorised review is required." }, 409);
  if (verifiedRows.length === 1) {
    const link = verifiedRows[0];
    if (!link.candidate_id || link.supabase_user_id !== user.id || !link.verified_at || !link.verified_by) {
      return json({ ok: false, code: "VERIFIED_IDENTITY_INVALID", error: "The existing identity link is incomplete and has been blocked." }, 409);
    }
    return json({ ok: true, linked: true, status: "VERIFIED", message: "Your candidate identity link is already verified." });
  }

  // Store a review request only. Candidate ownership and candidate_id are not assigned here.
  const pendingUrl = new URL(`${url}/rest/v1/candidate_identity_link_requests`);
  pendingUrl.searchParams.set("select", "id,auth_user_id,status,requested_at,candidate_reference");
  pendingUrl.searchParams.set("auth_user_id", `eq.${user.id}`);
  pendingUrl.searchParams.set("status", "eq.PENDING");
  pendingUrl.searchParams.set("limit", "1");
  let pendingResponse: Response;
  try { pendingResponse = await fetch(pendingUrl, { headers, cache: "no-store" }); }
  catch { return json({ ok: false, code: "LINK_REQUEST_LOOKUP_UNAVAILABLE", error: "Your identity-link request status could not be checked." }, 503); }
  if (!pendingResponse.ok) return json({ ok: false, code: "LINK_REQUEST_QUEUE_NOT_READY", error: "The identity-link request queue is not available. Apply migration 0059 and retry." }, 503);
  const pendingRows = await pendingResponse.json().catch(() => null) as Array<{ id?: string; auth_user_id?: string; status?: string; requested_at?: string }> | null;
  if (!Array.isArray(pendingRows)) return json({ ok: false, code: "LINK_REQUEST_RESPONSE_INVALID", error: "The identity-link queue returned an invalid response." }, 502);
  if (pendingRows.length > 0) {
    return json({ ok: true, linked: false, status: "PENDING_REVIEW", requestId: pendingRows[0].id, message: "Your candidate identity request is awaiting authorised review. No candidate record has been linked yet." }, 202);
  }

  const requestId = randomUUID();
  const insertResponse = await fetch(`${url}/rest/v1/candidate_identity_link_requests`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({
      id: requestId,
      auth_user_id: user.id,
      verified_email: email,
      candidate_reference: reference || null,
      status: "PENDING",
      correlation_id: randomUUID()
    }),
    cache: "no-store"
  }).catch(() => null);
  if (!insertResponse) return json({ ok: false, code: "LINK_REQUEST_WRITE_UNAVAILABLE", error: "Your request could not be saved. Try again." }, 503);
  if (!insertResponse.ok) return json({ ok: false, code: "LINK_REQUEST_WRITE_FAILED", error: "Your request could not be saved. Confirm migration 0059 and review the server logs." }, 502);
  const inserted = await insertResponse.json().catch(() => null) as Array<{ id?: string; status?: string }> | null;
  if (!Array.isArray(inserted) || inserted.length !== 1 || inserted[0].id !== requestId) {
    // A simultaneous request may have won the partial unique index; return pending rather than claiming a link.
    return json({ ok: true, linked: false, status: "PENDING_REVIEW", message: "Your identity request is pending review. No candidate record has been linked." }, 202);
  }
  return json({ ok: true, linked: false, status: "PENDING_REVIEW", requestId, message: "Your identity request was saved for authorised review. No candidate record has been linked yet." }, 202);
}
