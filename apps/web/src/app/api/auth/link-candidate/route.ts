import { randomUUID } from "node:crypto";

type AccountRow = { candidate_id: string; email: string; auth_user_id: string | null; auth_status: string };
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceKey) return json({ ok: false, code: "AUTH_RUNTIME_NOT_CONFIGURED", error: "Secure account linking is not configured on this deployment." }, 503);

  const token = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return json({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in before linking a candidate account." }, 401);

  let userResponse: Response;
  try {
    userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, authorization: `Bearer ${token}` }, cache: "no-store" });
  } catch {
    return json({ ok: false, code: "AUTH_PROVIDER_UNAVAILABLE", error: "The identity provider could not be reached. Try again." }, 503);
  }
  if (!userResponse.ok) return json({ ok: false, code: "INVALID_SESSION", error: "Your session is invalid or expired. Sign in again." }, 401);
  const user = await userResponse.json().catch(() => null) as { id?: string; email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null } | null;
  const email = user?.email?.trim().toLowerCase();
  if (!user?.id || !email) return json({ ok: false, code: "IDENTITY_EMAIL_MISSING", error: "The identity provider did not return a usable email address." }, 403);
  if (!(user.email_confirmed_at || user.confirmed_at)) return json({ ok: false, code: "EMAIL_CONFIRMATION_REQUIRED", error: "Confirm ownership of your email address before linking an existing candidate record." }, 403);

  const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, accept: "application/json" };
  const accountsUrl = new URL(`${url}/rest/v1/candidate_accounts`);
  accountsUrl.searchParams.set("select", "candidate_id,email,auth_user_id,auth_status");
  accountsUrl.searchParams.set("email", `eq.${email}`);
  accountsUrl.searchParams.set("limit", "2");

  let accountsResponse: Response;
  try { accountsResponse = await fetch(accountsUrl, { headers, cache: "no-store" }); }
  catch { return json({ ok: false, code: "CANDIDATE_STORE_UNAVAILABLE", error: "Candidate records could not be checked. No account was linked." }, 503); }
  if (!accountsResponse.ok) return json({ ok: false, code: "CANDIDATE_LOOKUP_FAILED", error: "Candidate identity lookup failed. Check the configured database schema." }, 502);
  const rows = await accountsResponse.json().catch(() => null) as AccountRow[] | null;
  if (!Array.isArray(rows)) return json({ ok: false, code: "CANDIDATE_LOOKUP_INVALID", error: "Candidate identity lookup returned an invalid response." }, 502);
  if (rows.length === 0) return json({ ok: true, linked: false, status: "PENDING_REVIEW", message: "Your sign-in is active, but no existing candidate record matches this confirmed email. The system did not create or claim a candidate record; support or an authorised operator must resolve identity." }, 202);
  if (rows.length !== 1 || !rows[0].candidate_id) return json({ ok: false, code: "AMBIGUOUS_CANDIDATE_IDENTITY", error: "More than one candidate record matched this email. Linking is blocked for manual review." }, 409);

  const account = rows[0];
  if (account.auth_user_id === user.id) return json({ ok: true, linked: true, status: "LINKED", candidateId: account.candidate_id, message: "Your candidate account is already linked." });
  if (account.auth_user_id) return json({ ok: false, code: "CANDIDATE_ALREADY_LINKED", error: "This candidate record is already linked to another identity. No changes were made; authorised review is required." }, 409);
  if (["LOCKED", "DISABLED", "RECOVERY_REQUIRED"].includes(account.auth_status)) return json({ ok: false, code: "CANDIDATE_ACCOUNT_RESTRICTED", error: "This candidate account is restricted and cannot be self-linked." }, 403);

  const patchUrl = new URL(`${url}/rest/v1/candidate_accounts`);
  patchUrl.searchParams.set("candidate_id", `eq.${account.candidate_id}`);
  patchUrl.searchParams.set("email", `eq.${email}`);
  patchUrl.searchParams.set("auth_user_id", "is.null");
  const patchBody: Record<string, unknown> = { auth_user_id: user.id, email_verified: true, updated_at: new Date().toISOString() };
  if (account.auth_status === "PENDING") patchBody.auth_status = "ACTIVE";
  let linkedResponse: Response;
  try {
    linkedResponse = await fetch(patchUrl, { method: "PATCH", headers: { ...headers, "content-type": "application/json", prefer: "return=representation" }, body: JSON.stringify(patchBody), cache: "no-store" });
  } catch {
    return json({ ok: false, code: "CANDIDATE_LINK_UNAVAILABLE", error: "The candidate account could not be linked. No successful result was confirmed." }, 503);
  }
  if (!linkedResponse.ok) return json({ ok: false, code: "CANDIDATE_LINK_FAILED", error: "The candidate account could not be linked. Check the schema and review logs." }, 502);
  const linkedRows = await linkedResponse.json().catch(() => null) as Array<{ candidate_id?: string; auth_user_id?: string }> | null;
  if (!Array.isArray(linkedRows) || linkedRows.length !== 1 || linkedRows[0].candidate_id !== account.candidate_id || linkedRows[0].auth_user_id !== user.id) {
    return json({ ok: false, code: "CANDIDATE_LINK_CONFLICT", error: "The candidate account changed during linking. Refresh and try again; manual review may be required." }, 409);
  }

  const correlationId = randomUUID();
  let auditLogged = false;
  try {
    const auditResponse = await fetch(`${url}/rest/v1/audit_events`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ event_id: randomUUID(), event_type: "CANDIDATE_IDENTITY_LINKED", severity: "INFO", correlation_id: correlationId, actor_id: user.id, candidate_id: account.candidate_id, message: "Candidate account linked after Supabase email confirmation and unique exact-email match.", metadata: { method: "verified_email_match", email_domain: email.split("@")[1] || "", identity_provider: "supabase_auth" } }),
      cache: "no-store"
    });
    auditLogged = auditResponse.ok;
  } catch {}

  return json({ ok: true, linked: true, status: "LINKED", candidateId: account.candidate_id, auditLogged, message: auditLogged ? "Candidate account linked and audit event recorded." : "Candidate account linked, but audit logging needs operator attention. Avoid repeating identity changes and contact support." });
}
