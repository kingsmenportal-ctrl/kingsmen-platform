import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const migration = read("db/migrations/0096_candidate_application_cao_choice_bridge.sql");
const route = read("apps/web/src/app/api/candidate/cao-choices/route.ts");
const page = read("apps/web/src/app/candidate/cao-choices/page.tsx");

// Source-contract regression only. This test does not apply SQL to a database and
// does not replace authorized staging isolation tests after a reviewed migration.
const checks = [
  ["migration preserves legacy parent IDs instead of rewriting existing rows", /application_id DROP NOT NULL/.test(migration) && /ADD COLUMN candidate_application_id uuid/.test(migration) && !/UPDATE public\.cao_choice_items\s+SET application_id/.test(migration)],
  ["each CAO child row must point to exactly one legacy or unified parent", /cao_choice_items_exactly_one_parent_check/.test(migration) && /application_id IS NOT NULL AND candidate_application_id IS NULL/.test(migration) && /application_id IS NULL AND candidate_application_id IS NOT NULL/.test(migration)],
  ["unified parent relation is composite-owner bound", /REFERENCES public\.candidate_applications \(id, candidate_id\)/.test(migration) && /FOREIGN KEY \(candidate_application_id, candidate_id\)/.test(migration)],
  ["legacy duplicate parent ranks preflight before uniqueness is added", migration.indexOf("CAO_LEGACY_CHOICE_NUMBER_DUPLICATES_REQUIRE_REVIEW") < migration.indexOf("CREATE UNIQUE INDEX cao_choice_items_legacy_parent_choice_number_uq")],
  ["rank uniqueness is enforced for legacy and unified parents", /ON public\.cao_choice_items \(application_id, choice_number\)/.test(migration) && /ON public\.cao_choice_items \(candidate_application_id, choice_number\)/.test(migration)],
  ["choice updates are limited to six contiguous ranks beginning at one", /jsonb_array_length\(p_choices\) > 6/.test(migration) && /CAO_CHOICE_NUMBERS_MUST_BE_UNIQUE/.test(migration) && /CAO_CHOICE_NUMBERS_MUST_BE_CONTIGUOUS_FROM_ONE/.test(migration)],
  ["choice fields and optional source URLs are constrained", migration.includes("CAO_CHOICE_INPUT_INVALID") && migration.includes("v_choice->>'source_url' !~ '^https://")],
  ["all RPCs check auth and verified candidate-link equivalence", ["list_candidate_cao_parents","get_candidate_cao_choices","save_candidate_cao_choices"].every(name => migration.includes("FUNCTION public."+name)) && (migration.match(/VERIFIED_CANDIDATE_IDENTITY_REQUIRED/g) || []).length >= 3 && migration.includes("l.link_status = 'VERIFIED'") && migration.includes("v_link_candidate_id IS DISTINCT FROM v_candidate_id")],
  ["CAO choice writes fail closed when profile-processing consent is inactive", migration.includes("CAO_PROFILE_PROCESSING_CONSENT_REQUIRED") && migration.includes("pc.consent_type = 'PROFILE_PROCESSING'") && migration.includes("pc.consent_status = 'ACTIVE'") && migration.includes("pc.revoked_at IS NULL")],
  ["writes require an owned DRAFT higher-education parent and an approved CAO match", /CAO_PARENT_MUST_BE_AN_OWNED_DRAFT/.test(migration) && /ca\.pathway_type = 'HIGHER_EDUCATION'/.test(migration) && /m\.sector = 'CAO'/.test(migration) && /m\.match_status = 'APPROVED'/.test(migration)],
  ["choice changes are audited with old and new snapshot and no submission", /CAO_CHOICES_UPDATED/.test(migration) && /previous_choices/.test(migration) && /saved_choices/.test(migration) && /'provider_submission_sent', false/.test(migration)],
  ["RPC privileges are revoked from public and anon then granted to authenticated", (migration.match(/REVOKE ALL ON FUNCTION public\.(?:list_candidate_cao_parents|get_candidate_cao_choices|save_candidate_cao_choices)/g) || []).length === 3 && (migration.match(/GRANT EXECUTE ON FUNCTION public\.(?:list_candidate_cao_parents|get_candidate_cao_choices|save_candidate_cao_choices)/g) || []).length === 3],
  ["HTTP proxy forwards bearer and anon key, never service-role secret", /AUTHENTICATION_REQUIRED/.test(route) && /Authorization: authorization/.test(route) && /apikey: config\.anonKey/.test(route) && !route.includes("SUPABASE_SERVICE_ROLE_KEY")],
  ["UI supports reload, six-choice ceiling, reordering and parent-DRAFT lock", /Reload saved choices/.test(page) && /choices\.length >= 6/.test(page) && /reorderChoice/.test(page) && /selectedParent\?\.status !== "DRAFT"/.test(page)],
  ["UI states that choices are drafts and makes no provider submission claim", /does not submit anything to CAO or a provider/.test(page) && /An entered URL is not proof/.test(page)]
];

let failures = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failures++;
}
console.log(`CAO migration 0096 source contract: ${checks.length - failures}/${checks.length} passed`);
if (failures) process.exit(1);
