import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("db/migrations/0109_candidate_application_draft_persistence_20261101.sql");
const readinessMigration = read("db/migrations/0108_candidate_application_readiness_eligibility_deadline_gate_20261101.sql");
const api = read("apps/web/src/app/api/candidate/application-draft/route.ts");
const page = read("apps/web/src/app/candidate/applications/[applicationId]/page.tsx");
const tracker = read("apps/web/src/app/candidate/applications/page.tsx");
const packageJson = JSON.parse(read("package.json"));
const auditStart = migration.indexOf("INSERT INTO public.candidate_application_events");
const auditEnd = migration.indexOf("ON CONFLICT (event_ref) DO NOTHING", auditStart);
const auditInsert = auditStart >= 0 && auditEnd > auditStart ? migration.slice(auditStart, auditEnd) : "";
const getStart = migration.indexOf("CREATE OR REPLACE FUNCTION public.get_candidate_application_draft");
const saveStart = migration.indexOf("CREATE OR REPLACE FUNCTION public.save_candidate_application_draft");
const getFunction = getStart >= 0 && saveStart > getStart ? migration.slice(getStart, saveStart) : "";

const checks = [
  ["one draft-answer row is bound to one parent application and its candidate", /application_id uuid PRIMARY KEY/.test(migration) && /FOREIGN KEY \(application_id, candidate_id\)/.test(migration) && /REFERENCES public\.candidate_applications\(id, candidate_id\)/.test(migration)],
  ["draft-answer table is RLS protected and inaccessible directly to client roles", /ENABLE ROW LEVEL SECURITY/.test(migration) && /FROM PUBLIC, anon, authenticated/.test(migration) && /TO service_role USING \(true\) WITH CHECK \(true\)/.test(migration)],
  ["candidate identity is derived from exactly one verified Auth link", /auth\.uid\(\)/.test(migration) && /link_status = 'VERIFIED'/.test(migration) && /verified_by IS NOT NULL/.test(migration) && /v_link_count <> 1/.test(migration)],
  ["draft load is restricted to the owned parent application", /WHERE a\.id = p_application_id[\s\S]*AND a\.candidate_id = v_candidate_id/.test(migration)],
  ["draft read selects the application status it returns", getFunction.includes("a.status") && getFunction.includes("'status', v_application.status")],
  ["draft read and write hold verified Auth identity-link share locks", (migration.match(/FOR SHARE;/g) ?? []).length >= 3 && /candidate_auth_identity_links/.test(migration)],
  ["draft save holds a row lock on the candidate-owned parent application", /WHERE a\.id = p_application_id[\s\S]*AND a\.candidate_id = v_candidate_id[\s\S]*FOR UPDATE/.test(migration)],
  ["draft answer save requires a saved reusable candidate profile", migration.includes("CANDIDATE_REUSABLE_PROFILE_REQUIRED") && migration.includes("candidate_master_profiles mp")],
  ["draft save requires the latest active profile-processing consent", /PROFILE_PROCESSING_CONSENT_REQUIRED/.test(migration) && /ORDER BY pc\.granted_at DESC, pc\.id DESC/.test(migration) === false && /newer\.granted_at, newer\.id/.test(migration) && /pc\.revoked_at IS NULL/.test(migration)],
  ["draft save is limited to pre-submission editable states", /'DRAFT', 'READINESS_BLOCKED', 'READY_FOR_REVIEW', 'READY_TO_SUBMIT'/.test(migration) && /APPLICATION_DRAFT_IS_LOCKED/.test(migration)],
  ["answer JSON is object-only, bounded and rejects unknown keys", /jsonb_typeof\(p_answer_data\) IS DISTINCT FROM 'object'/.test(migration) && /pg_column_size\(p_answer_data\) > 65536/.test(migration) && /p_answer_data - v_allowed_keys/.test(migration)],
  ["application response fields have per-field type and length checks", /motivation_statement/.test(migration) && /relevant_experience/.test(migration) && /qualifications_summary/.test(migration) && /availability_date/.test(migration) && /preferred_campus/.test(migration)],
  ["additional provider answers are bounded and key-validated", /jsonb_array_length\(p_answer_data->'additional_answers'\) > 20/.test(migration) && /question_key/.test(migration) && /length\(v_answer->>'answer'\) > 2000/.test(migration)],
  ["optimistic version checks prevent silent concurrent overwrite", /APPLICATION_DRAFT_VERSION_CONFLICT/.test(migration) && /p_expected_version <> v_existing\.draft_version/.test(migration)],
  ["save retries are idempotent and reject key reuse with different content", /last_idempotency_key = p_idempotency_key/.test(migration) && /APPLICATION_DRAFT_IDEMPOTENCY_CONFLICT/.test(migration)],
  ["every edit invalidates prior readiness and requires recheck", /readiness_status = 'NOT_CHECKED'/.test(migration) && /readiness_recheck_required/.test(migration) && /SET status = 'DRAFT'/.test(migration)],
  ["draft save writes an append-only application audit event without answer content", /APPLICATION_DRAFT_SAVED/.test(auditInsert) && /answer_keys/.test(auditInsert) && !auditInsert.includes("'answer_data', p_answer_data") && !auditInsert.includes("'answers', p_answer_data")],
  ["profile stays in the reusable profile table and CAO choices remain child records", /candidate_master_profiles/.test(migration) && /CAO programme choices remain child rows/.test(migration)],
  ["application read/write RPCs are executable by authenticated only", /GRANT EXECUTE ON FUNCTION public\.get_candidate_application_draft/.test(migration) && /GRANT EXECUTE ON FUNCTION public\.save_candidate_application_draft/.test(migration) && /FROM PUBLIC, anon/.test(migration)],
  ["API forwards candidate bearer with public anon key and never uses service role", /Authorization: authorization/.test(api) && /apikey: config\.anonKey/.test(api) && !/SERVICE_ROLE/.test(api)],
  ["API validates application UUID, expected version and idempotency key", /UUID\.test/.test(api) && /Number\.isInteger\(incoming\.expected_version\)/.test(api) && /idempotency_key/.test(api)],
  ["candidate draft page loads persisted application data from the API", /\/api\/candidate\/application-draft\?application_id=/.test(page) && /setAnswers\(normalizeAnswers\(body\.draft\)\)/.test(page)],
  ["candidate can explicitly reload and resume the latest saved version", /Reload saved draft/.test(page) && /draft_version/.test(page) && /setVersion\(/.test(page)],
  ["candidate draft page saves with stable idempotency key across retries", /saveIdempotencyKey/.test(page) && /const requestKey = saveIdempotencyKey \|\|/.test(page) && /idempotency_key: requestKey/.test(page)],
  ["candidate UI preserves all six pathway labels", ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"].every(x => page.includes(x))],
  ["shared profile is linked but not duplicated into application answer data", /shared_profile_available/.test(migration) && /shared_profile_updated_at/.test(migration) && /shared_profile_available/.test(page) && /application-specific responses/.test(page)],
  ["CAO programme choices stay under one parent application", page.includes("CAO programme choices remain child records under one Kingsmen parent application") && readinessMigration.includes("CAO")],
  ["provider submission remains explicitly false throughout draft save", migration.includes(String.fromCharCode(39) + "provider_submission_sent" + String.fromCharCode(39) + ", false") && /does not submit to a provider/.test(page)],
  ["application tracker links owned parent records to the resumable editor", /candidate\/applications\/\$\{application\.id\}/.test(tracker) && /Open \/ resume application draft/.test(tracker)],
  ["draft persistence contract runs in Candidate Experience CI", /validate-candidate-application-draft-persistence\.mjs/.test(packageJson.scripts["candidate:experience:check"])]
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
  if (!passed) failed++;
}
process.stdout.write("Candidate application draft persistence contract: " + (checks.length - failed) + "/" + checks.length + " passed\n");
if (failed) process.exit(1);
