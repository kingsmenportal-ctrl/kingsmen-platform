import fs from "node:fs";
import assert from "node:assert/strict";
const migration = fs.readFileSync("supabase/migrations/20261025112103_candidate_identity_review_followup_status.sql", "utf8").toLowerCase();
const followup = fs.readFileSync("supabase/functions/candidate-identity-review-followup/index.ts", "utf8");
const status = fs.readFileSync("supabase/functions/candidate-identity-review-status/index.ts", "utf8");
const page = fs.readFileSync("apps/web/src/app/candidate/identity-review/status/page.tsx", "utf8");
const required = [
  [migration.includes("security definer") && migration.includes("set search_path to ''"), "safe definer boundary"],
  [migration.includes("supabase_user_id = p_candidate_auth_user_id"), "request owner enforced in transactional RPC"],
  [migration.includes("request_status <> 'needs_information'"), "follow-up restricted to NEEDS_INFORMATION"],
  [migration.includes("candidate_response = left") && migration.includes("request_status = 'pending'"), "response persisted and request requeued"],
  [migration.includes("'candidate_response'") && migration.includes("'needs_information'") && migration.includes("'pending'"), "response audit transition"],
  [/auth\.auth\.getuser\(bearer\[1\]\)/i.test(followup), "follow-up validates the bearer with Supabase Auth"],
  [followup.includes("p_candidate_auth_user_id: authData.user.id"), "follow-up derives owner from verified session"],
  [/\.eq\("supabase_user_id", authData\.user\.id\)/.test(status), "status query is scoped to authenticated owner"],
  [status.includes("Cache-Control") && status.includes("no-store"), "status responses are non-cacheable"],
  [page.includes("candidate-identity-review-followup") && page.includes("candidate-identity-review-status"), "candidate page uses authenticated status and follow-up endpoints"],
  [page.includes("candidate-identity-review-evidence-upload"), "candidate can add more private evidence to existing request"]
];
const failures = required.filter(([ok]) => !ok).map(([, label]) => label);
assert.deepEqual(failures, [], failures.join("; "));
console.log(JSON.stringify({validator:"identity-review-follow-up-status",checks:required.length,passed:required.length-failures.length,failed:failures}));
