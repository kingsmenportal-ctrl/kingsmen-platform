import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const migration = readFileSync("db/migrations/0075_candidate_identity_review_requests.sql", "utf8");
const decisions = readFileSync("db/migrations/0076_candidate_identity_review_decision_workflow.sql", "utf8");
const candidateRoute = readFileSync("apps/web/src/app/api/candidate/identity-review/route.ts", "utf8");
const reviewerRoute = readFileSync("apps/web/src/app/api/reviewer/identity-review/route.ts", "utf8");
const candidatePage = readFileSync("apps/web/src/app/candidate/identity-review/page.tsx", "utf8");
const reviewerPage = readFileSync("apps/web/src/app/reviewer/identity-requests/page.tsx", "utf8");

const checks = [
  ["durable request table", /CREATE TABLE IF NOT EXISTS public\.candidate_identity_review_requests/i.test(migration)],
  ["authenticated user foreign key", /supabase_user_id uuid NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/i.test(migration)],
  ["bounded claimant input", /candidate_reference text NOT NULL CHECK \(length\(trim\(candidate_reference\)\) BETWEEN 2 AND 120\)/i.test(migration) && /claimant_message text NOT NULL DEFAULT '' CHECK \(length\(claimant_message\) <= 1200\)/i.test(migration)],
  ["closed status vocabulary", /'PENDING','NEEDS_INFORMATION','APPROVED','REJECTED','WITHDRAWN'/i.test(migration)],
  ["one open request per account", /WHERE request_status IN \('PENDING','NEEDS_INFORMATION'\)/i.test(migration)],
  ["RLS and no direct client grants", /ENABLE ROW LEVEL SECURITY/i.test(migration) && /REVOKE ALL ON public\.candidate_identity_review_requests FROM PUBLIC, anon, authenticated/i.test(migration)],
  ["request cannot self-verify identity", /Never an identity-link authority/i.test(migration) && /does not verify your identity or link your account/i.test(candidateRoute)],
  ["candidate session validated server-side", /auth\/v1\/user/.test(candidateRoute) && /\$\{token\}/.test(candidateRoute)],
  ["server-derived candidate account owner", /supabase_user_id: auth\.userId/.test(candidateRoute) && !/body\.supabase_user_id|body\.candidate_id|body\.candidateId/.test(candidateRoute)],
  ["candidate input validation and limits", /candidateReference\.length < 2/.test(candidateRoute) && /claimantMessage\.length > 1200/.test(candidateRoute)],
  ["candidate request listing is owner-scoped", /supabase_user_id=eq\.\$\{encodeURIComponent\(auth\.userId\)\}/.test(candidateRoute)],
  ["duplicate open request conflict", /already have an open identity review request/.test(candidateRoute)],
  ["no cache for identity records", /Cache-Control.*no-store/.test(candidateRoute)],
  ["null reviewer decisions fail closed", /p_decision IS NULL OR p_decision NOT IN/.test(decisions)],
  ["reviewer registry is authoritative", /public\.platform_reviewers/.test(decisions) && /role_code = 'PLATFORM_ADMIN'/.test(decisions) && /revoked_at IS NULL/.test(decisions)],
  ["decision transaction is atomic PL/pgSQL", /CREATE OR REPLACE FUNCTION public\.decide_candidate_identity_review/.test(decisions) && /FOR UPDATE/.test(decisions)],
  ["approval resolves exact active candidate reference", /public_ref = trim\(p_candidate_reference\) AND is_active = true/.test(decisions)],
  ["identity-link conflicts fail closed", /manual conflict resolution is required/.test(decisions) && /v_link_count > 1/.test(decisions)],
  ["verified link records reviewer and timestamp", /link_status = 'VERIFIED', verified_at = now\(\)/.test(decisions) && /verified_by = p_reviewer_auth_user_id::text/.test(decisions)],
  ["review decision audit persists in same transaction", /INSERT INTO public\.candidate_identity_review_audit/.test(decisions) && /before_status, after_status/.test(decisions)],
  ["review RPC not executable by browser roles", /REVOKE ALL ON FUNCTION public\.decide_candidate_identity_review\(uuid,uuid,text,text,text\) FROM PUBLIC, anon, authenticated/.test(decisions)],
  ["review API derives reviewer from authenticated session", /auth\/v1\/user/.test(reviewerRoute) && /p_reviewer_auth_user_id: auth\.userId/.test(reviewerRoute)],
  ["review API checks active platform admin", /role_code=eq\.PLATFORM_ADMIN/.test(reviewerRoute) && /is_active=eq\.true/.test(reviewerRoute)],
  ["closed requests cannot be decided twice", /no longer open/.test(decisions) && /no longer open/.test(reviewerRoute)],
  ["candidate UI submits and shows request status", /Submit for authorised review/.test(candidatePage) && /Your review history/.test(candidatePage)],
  ["reviewer UI has queue and explicit decisions", /Open requests/.test(reviewerPage) && /Approve & verify identity/.test(reviewerPage) && /Request more information/.test(reviewerPage) && /Reject request/.test(reviewerPage)]
];

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failed++;
}
console.log(`Candidate identity review lifecycle contract: ${checks.length - failed}/${checks.length} passed`);
assert.equal(failed, 0, "Candidate identity review lifecycle contract failed");
