import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const migration = readFileSync("db/migrations/0075_candidate_identity_review_requests.sql", "utf8");
const route = readFileSync("apps/web/src/app/api/candidate/identity-review/route.ts", "utf8");

const checks = [
  ["durable request table", /CREATE TABLE IF NOT EXISTS public\.candidate_identity_review_requests/i.test(migration)],
  ["authenticated user foreign key", /supabase_user_id uuid NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/i.test(migration)],
  ["bounded claimant input", /candidate_reference text NOT NULL CHECK \(length\(trim\(candidate_reference\)\) BETWEEN 2 AND 120\)/i.test(migration) && /claimant_message text NOT NULL DEFAULT '' CHECK \(length\(claimant_message\) <= 1200\)/i.test(migration)],
  ["closed status vocabulary", /'PENDING','NEEDS_INFORMATION','APPROVED','REJECTED','WITHDRAWN'/i.test(migration)],
  ["one open request per account", /WHERE request_status IN \('PENDING','NEEDS_INFORMATION'\)/i.test(migration)],
  ["RLS and no direct client grants", /ENABLE ROW LEVEL SECURITY/i.test(migration) && /REVOKE ALL ON public\.candidate_identity_review_requests FROM PUBLIC, anon, authenticated/i.test(migration)],
  ["request cannot self-verify identity", /Never an identity-link authority/i.test(migration) && /does not verify your identity or link your account/i.test(route)],
  ["Supabase Auth server validation", /auth\/v1\/user/.test(route) && /Authorization:/.test(route) && /Bearer/.test(route) && /\$\{token\}/.test(route)],
  ["server-derived account owner", /supabase_user_id: auth\.userId/.test(route) && !/body\.supabase_user_id|body\.candidate_id|body\.candidateId/.test(route)],
  ["input validation and limits", /candidateReference\.length < 2/.test(route) && /claimantMessage\.length > 1200/.test(route)],
  ["owner-scoped request listing", /supabase_user_id=eq\.\$\{encodeURIComponent\(auth\.userId\)\}/.test(route)],
  ["duplicate open request conflict", /already have an open identity review request/.test(route)],
  ["no cache for identity records", /Cache-Control.*no-store/.test(route)]
];

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failed++;
}
console.log(`Candidate identity review intake contract: ${checks.length - failed}/${checks.length} passed`);
assert.equal(failed, 0, "Candidate identity review intake contract failed");
