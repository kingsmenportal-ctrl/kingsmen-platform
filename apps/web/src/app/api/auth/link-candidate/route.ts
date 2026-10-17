import { requirePortalUser, supabaseUserFetch } from "../../../../lib/supabase-user-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store", pragma: "no-cache" } });

export async function POST(request: Request) {
  const auth = await requirePortalUser(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => ({})) as { candidateReference?: unknown; displayName?: unknown };
  const candidateReference = typeof body.candidateReference === "string" ? body.candidateReference.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (candidateReference.length > 100 || displayName.length > 180) return json({ ok: false, code: "IDENTITY_REQUEST_FIELD_TOO_LONG", error: "Candidate reference or display name exceeds its limit." }, 400);

  // The database RPC uses auth.uid() and enforces confirmed email. It creates only a new pending
  // candidate record when no candidate with that email exists; existing records are never claimed by email.
  const response = await supabaseUserFetch(auth.config, auth.user.accessToken, "/rest/v1/rpc/request_candidate_identity_link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_candidate_reference: candidateReference || null, p_display_name: displayName || null })
  }).catch(() => null);
  if (!response) return json({ ok: false, code: "IDENTITY_REQUEST_UNAVAILABLE", error: "The identity request service could not be reached." }, 503);
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? response.status : response.status === 404 ? 503 : 502;
    return json({ ok: false, code: "IDENTITY_REQUEST_REJECTED", error: status === 503 ? "Identity registration migration 0062 is not deployed yet." : "The identity request was rejected. Confirm your email and try again." }, status);
  }
  const result = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!result || result.ok !== true) return json({ ok: false, code: "IDENTITY_REQUEST_UNCONFIRMED", error: "The database did not confirm your identity request." }, 502);
  return json(result, result.linked === true ? 200 : 202);
}
