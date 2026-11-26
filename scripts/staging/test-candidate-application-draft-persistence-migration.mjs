import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migration = await readFile(path.join(root, "supabase/migrations/20261126190000_candidate_application_draft_persistence.sql"), "utf8");

for (const token of [
  "candidate_application_draft_answers",
  "enable row level security",
  "force row level security",
  "current_authenticated_candidate_id()",
  "auth.uid()",
  "for update",
  "APPLICATION_DRAFT_VERSION_CONFLICT",
  "p_idempotency_key",
  "octet_length(p_answer_data::text) > 65536",
  "revoke all on function public.get_candidate_application_draft(uuid) from public, anon",
  "grant execute on function public.get_candidate_application_draft(uuid) to authenticated",
  "grant execute on function public.save_candidate_application_draft(uuid, jsonb, integer, text) to authenticated",
  "readiness_recheck_required",
  "does not submit to a provider"
]) {
  assert.ok(migration.toLowerCase().includes(token.toLowerCase()), `persistence migration missing security/behavior contract: ${token}`);
}
assert.match(migration, /where id = p_application_id and candidate_id = v_candidate_id/i);
assert.match(migration, /status not in \('DRAFT','READINESS_BLOCKED','READY_FOR_REVIEW','READY_TO_SUBMIT'\)/i);
assert.match(migration, /on conflict \(application_id\) do update/i);
assert.doesNotMatch(migration, /drop schema|drop table public\.candidate_applications|truncate public\.candidate_applications/i);

console.log("Candidate application draft persistence migration contract checks passed.");
