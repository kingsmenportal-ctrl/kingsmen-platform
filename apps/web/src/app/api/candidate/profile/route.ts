import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";

const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
const allowedFields = new Set(["display_name", "phone", "city", "province", "highest_grade"]);

export async function GET(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const candidateId = auth.session.candidateId;
  const candidateUrl = new URL(`${auth.config.url}/rest/v1/candidates`);
  candidateUrl.searchParams.set("select", "id,public_ref,email,phone,display_name,current_state,is_active,created_at,updated_at");
  candidateUrl.searchParams.set("id", `eq.${candidateId}`);
  candidateUrl.searchParams.set("limit", "1");
  const profileUrl = new URL(`${auth.config.url}/rest/v1/candidate_profiles`);
  profileUrl.searchParams.set("select", "candidate_id,province,city,highest_grade,qualification_summary,work_summary,profile_confidence,reviewed_by_operator,reviewed_at,updated_at");
  profileUrl.searchParams.set("candidate_id", `eq.${candidateId}`);
  profileUrl.searchParams.set("limit", "1");
  const changesUrl = new URL(`${auth.config.url}/rest/v1/candidate_profile_change_requests`);
  changesUrl.searchParams.set("select", "id,field_name,old_value,requested_value,reason,sensitivity,status,requested_at,decided_at,decision_notes");
  changesUrl.searchParams.set("candidate_id", `eq.${candidateId}`);
  changesUrl.searchParams.set("order", "requested_at.desc");
  changesUrl.searchParams.set("limit", "50");
  let responses: Response[];
  try {
    responses = await Promise.all([
      supabaseAdminFetch(auth.config, `/rest/v1/candidates?${candidateUrl.searchParams}`),
      supabaseAdminFetch(auth.config, `/rest/v1/candidate_profiles?${profileUrl.searchParams}`),
      supabaseAdminFetch(auth.config, `/rest/v1/candidate_profile_change_requests?${changesUrl.searchParams}`)
    ]);
  } catch {
    return json({ ok: false, code: "PROFILE_STORE_UNAVAILABLE", error: "Profile data could not be loaded. Try again later." }, 503);
  }
  if (responses.some(response => !response.ok)) return json({ ok: false, code: "PROFILE_QUERY_FAILED", error: "Profile records could not be loaded. Check the connected database schema." }, 502);
  const [candidates, profiles, changes] = await Promise.all(responses.map(response => response.json().catch(() => null)));
  if (!Array.isArray(candidates) || !Array.isArray(profiles) || !Array.isArray(changes) || candidates.length !== 1) return json({ ok: false, code: "PROFILE_RESPONSE_INVALID", error: "Candidate profile records are incomplete or invalid." }, 502);
  return json({ ok: true, candidate: candidates[0], profile: profiles[0] || null, changeRequests: changes, authority: { directProfileMutationAllowed: false, candidateCanApproveChanges: false } });
}

export async function POST(request: Request) {
  const auth = await requireCandidateSession(request);
  if (!auth.ok) return json({ ok: false, code: auth.code, error: auth.message }, auth.status);
  const body = await request.json().catch(() => null) as { field?: unknown; value?: unknown; reason?: unknown } | null;
  const field = typeof body?.field === "string" ? body.field.trim() : "";
  const value = typeof body?.value === "string" ? body.value.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!allowedFields.has(field)) return json({ ok: false, code: "FIELD_NOT_EDITABLE", error: "That field cannot be changed through candidate self-service." }, 400);
  if (!value || value.length > 500) return json({ ok: false, code: "INVALID_VALUE", error: "Enter a value of 1–500 characters." }, 400);
  if (reason.length < 8 || reason.length > 1000) return json({ ok: false, code: "REASON_REQUIRED", error: "Explain the requested correction in 8–1000 characters." }, 400);

  const candidateUrl = new URL(`${auth.config.url}/rest/v1/candidates`);
  candidateUrl.searchParams.set("select", "display_name,phone");
  candidateUrl.searchParams.set("id", `eq.${auth.session.candidateId}`);
  candidateUrl.searchParams.set("limit", "1");
  const profileUrl = new URL(`${auth.config.url}/rest/v1/candidate_profiles`);
  profileUrl.searchParams.set("select", "city,province,highest_grade");
  profileUrl.searchParams.set("candidate_id", `eq.${auth.session.candidateId}`);
  profileUrl.searchParams.set("limit", "1");
  let currentResponses: Response[];
  try {
    currentResponses = await Promise.all([
      supabaseAdminFetch(auth.config, `/rest/v1/candidates?${candidateUrl.searchParams}`),
      supabaseAdminFetch(auth.config, `/rest/v1/candidate_profiles?${profileUrl.searchParams}`)
    ]);
  } catch {
    return json({ ok: false, code: "PROFILE_STORE_UNAVAILABLE", error: "The current profile could not be checked. No change request was created." }, 503);
  }
  if (currentResponses.some(response => !response.ok)) return json({ ok: false, code: "PROFILE_QUERY_FAILED", error: "The current profile could not be checked. No change request was created." }, 502);
  const [candidateRows, profileRows] = await Promise.all(currentResponses.map(response => response.json().catch(() => null)));
  if (!Array.isArray(candidateRows) || candidateRows.length !== 1 || !Array.isArray(profileRows)) return json({ ok: false, code: "PROFILE_RESPONSE_INVALID", error: "The current profile could not be checked. No change request was created." }, 502);
  const current = { ...(candidateRows[0] || {}), ...(profileRows[0] || {}) } as Record<string, unknown>;
  const oldValue = typeof current[field] === "string" ? current[field] as string : "";
  if (oldValue === value) return json({ ok: true, unchanged: true, message: "That value already matches your saved profile." });

  const inserted = await supabaseAdminFetch(auth.config, "/rest/v1/candidate_profile_change_requests", {
    method: "POST",
    headers: { "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify({
      candidate_id: auth.session.candidateId,
      field_name: field,
      old_value: oldValue,
      requested_value: value,
      reason,
      sensitivity: ["display_name", "phone"].includes(field) ? "SENSITIVE" : "NORMAL",
      status: "PENDING",
      source_evidence_ref: null
    })
  }).catch(() => null);
  if (!inserted) return json({ ok: false, code: "CHANGE_REQUEST_UNAVAILABLE", error: "The profile correction could not be saved. Try again later." }, 503);
  if (!inserted.ok) return json({ ok: false, code: "CHANGE_REQUEST_FAILED", error: "The profile correction could not be saved. Check the configured schema." }, 502);
  const rows = await inserted.json().catch(() => null);
  if (!Array.isArray(rows) || rows.length !== 1) return json({ ok: false, code: "CHANGE_REQUEST_UNCONFIRMED", error: "The database did not confirm the saved correction request." }, 502);
  return json({ ok: true, changeRequest: rows[0], message: "Correction submitted for review. Your saved profile remains unchanged until an authorised reviewer approves it." }, 201);
}
