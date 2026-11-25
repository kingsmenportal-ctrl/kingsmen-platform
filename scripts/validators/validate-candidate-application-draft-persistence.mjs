import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const capacityMigration = read("db/migrations/0107_application_capacity_entitlements_20261101.sql");
const migration = read("db/migrations/0109_candidate_application_draft_persistence_20261101.sql");
const readinessMigration = read("db/migrations/0108_candidate_application_readiness_eligibility_deadline_gate_20261101.sql");
const api = read("apps/web/src/app/api/candidate/application-draft/route.ts");
const page = read("apps/web/src/app/candidate/applications/[applicationId]/page.tsx");
const tracker = read("apps/web/src/components/candidate/CandidateApplicationTracker.tsx");
const workbench = read("apps/web/src/components/candidate/CandidateApplicationWorkbench.tsx");
const statusContract = read("apps/web/src/lib/candidate-application-status.ts");
const statusProposal = read("docs/rebuild/proposals/candidate-application-status-contract.proposal.sql");
const workbenchBrowserTest = read("scripts/staging/test-candidate-workbench-ui.mjs");
const webManifest = JSON.parse(read("apps/web/package.json"));
const webLock = JSON.parse(read("apps/web/package-lock.json"));
const webPackages = webLock.packages ?? {};
function versionAtLeast(actual, expected) {
  if (typeof actual !== "string") return false;
  const a = actual.split(".").map(Number);
  const e = expected.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const av = Number.isFinite(a[i]) ? a[i] : 0;
    const ev = Number.isFinite(e[i]) ? e[i] : 0;
    if (av > ev) return true;
    if (av < ev) return false;
  }
  return true;
}
const workflow = read(".github/workflows/kingsmen-application-draft-contract.yml");
const auditStart = migration.indexOf("INSERT INTO public.candidate_application_events");
const auditEnd = migration.indexOf("ON CONFLICT (event_ref) DO NOTHING", auditStart);
const auditInsert = auditStart >= 0 && auditEnd > auditStart ? migration.slice(auditStart, auditEnd) : "";
const getStart = migration.indexOf("CREATE OR REPLACE FUNCTION public.get_candidate_application_draft");
const saveStart = migration.indexOf("CREATE OR REPLACE FUNCTION public.save_candidate_application_draft");
const getFunction = getStart >= 0 && saveStart > getStart ? migration.slice(getStart, saveStart) : "";

const checks = [
  ["one draft-answer row is bound to one parent application and its candidate", /application_id uuid PRIMARY KEY/.test(migration) && /FOREIGN KEY \(application_id, candidate_id\)/.test(migration) && /REFERENCES public\.candidate_applications\(id, candidate_id\)/.test(migration)],
  ["draft-answer table is RLS protected and inaccessible directly to client roles", /ENABLE ROW LEVEL SECURITY/.test(migration) && /FROM PUBLIC, anon, authenticated/.test(migration) && /TO service_role USING \(true\) WITH CHECK \(true\)/.test(migration)],
  ["shared identity helper derives exactly one verified Auth link", /CREATE OR REPLACE FUNCTION kingsmen_security\.current_verified_kingsmen_candidate_id/.test(capacityMigration) && /auth\.uid\(\)/.test(capacityMigration) && /link_status\s*=\s*'VERIFIED'/.test(capacityMigration) && /verified_by IS NOT NULL/.test(capacityMigration) && /v_count\s*<>\s*1/.test(capacityMigration)],
  ["draft load is restricted to the owned parent application", /WHERE a\.id = p_application_id[\s\S]*AND a\.candidate_id = v_candidate_id/.test(migration)],
  ["draft read selects the application status it returns", getFunction.includes("a.status") && getFunction.includes("'status', v_application.status")],
  ["draft read and write hold verified Auth identity-link share locks", (migration.match(/FOR SHARE;/g) ?? []).length >= 2 && /candidate_auth_identity_links/.test(migration)],
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
  ["migration widens the live event allowlist for APPLICATION_DRAFT_SAVED and fails closed on unknown constraint shapes", migration.includes("candidate_application_events_event_type_check") && /regexp_replace\([\s\S]*APPLICATION_DRAFT_SAVED/.test(migration) && migration.includes("APPLICATION_EVENT_TYPE_CONSTRAINT_SHAPE_UNRECOGNIZED")],
  ["application preparation uses the shared verified identity helper, locks its verified link and rejects inactive candidates", readinessMigration.includes("current_verified_kingsmen_candidate_id()") && readinessMigration.includes("candidate_auth_identity_links") && readinessMigration.includes("FOR SHARE;") && readinessMigration.includes("ACTIVE_CANDIDATE_REQUIRED") && readinessMigration.includes("c.is_active IS TRUE")],
  ["profile stays in the reusable profile table and CAO choices remain child records", /candidate_master_profiles/.test(migration) && /CAO programme choices remain child rows/.test(migration)],
  ["application read/write RPCs are executable by authenticated only", /GRANT EXECUTE ON FUNCTION public\.get_candidate_application_draft/.test(migration) && /GRANT EXECUTE ON FUNCTION public\.save_candidate_application_draft/.test(migration) && /FROM PUBLIC, anon/.test(migration)],
  ["API forwards candidate bearer with public anon key and never uses service role", /Authorization: authorization/.test(api) && /apikey: config\.anonKey/.test(api) && !/SERVICE_ROLE/.test(api)],
  ["API validates application UUID, expected version and idempotency key", /UUID\.test/.test(api) && /Number\.isInteger\(incoming\.expected_version\)/.test(api) && /idempotency_key/.test(api)],
  ["candidate draft page loads persisted data and uses server-confirmed candidate editability", /\/api\/candidate\/application-draft\?application_id=/.test(page) && /setAnswers\(normalizeAnswers\(body\.draft\)\)/.test(page) && /body\.is_editable === true/.test(page) && /isCandidateEditableApplicationStatus\(application\.kingsmen_status\)/.test(page)],
  ["candidate can explicitly reload and resume the latest saved version", /Reload saved draft/.test(page) && /draft_version/.test(page) && /setVersion\(/.test(page)],
  ["candidate draft page saves with stable idempotency key across retries", /saveIdempotencyKey/.test(page) && /const requestKey = saveIdempotencyKey \|\|/.test(page) && /idempotency_key: requestKey/.test(page)],
  ["candidate UI preserves all six pathway labels", ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"].every(x => page.includes(x))],
  ["shared profile is linked but not duplicated into application answer data", /shared_profile_available/.test(migration) && /shared_profile_updated_at/.test(migration) && /shared_profile_available/.test(page) && /application-specific responses/.test(page)],
  ["CAO programme choices stay under one parent application", page.includes("CAO programme choices remain child records under one Kingsmen parent application") && readinessMigration.includes("CAO")],
  ["provider submission remains explicitly false throughout draft save", migration.includes(String.fromCharCode(39) + "provider_submission_sent" + String.fromCharCode(39) + ", false") && /does not submit to a provider/.test(page)],
  ["application tracker links owned parent records to the resumable editor", /candidate\/applications\/\$\{application\.id\}/.test(tracker) && /Open \/ resume application draft/.test(tracker)],
  ["candidate-facing status uses the seven-label shared contract", ["Draft","Submitted to Kingsmen","Under review","Action required","Prepared for provider","Provider receipt confirmed","Decision recorded"].every(status => statusContract.includes("\"" + status + "\"")) && statusContract.includes("Status not available")],
  ["candidate-facing status SQL proposal is fail-closed and does not rewrite internal state", statusProposal.includes("APPLICATION_KINGSMEN_STATUS_MAPPING_REQUIRED") && statusProposal.includes("SET readiness_status") && !statusProposal.includes("SET status =")],
  ["tracker never exposes internal workflow status as the candidate lifecycle label", /candidateFacingApplicationStatusLabel\(application\.kingsmen_status\)/.test(tracker) && !/label\(application\.status\)/.test(tracker)],
  ["workbench links only candidate-editable pre-submission parent applications to the same draft editor", /candidate\/applications\/\$\{parent\.id\}/.test(workbench) && /Open \/ resume application draft/.test(workbench) && /canResumeCandidateApplicationDraft\(parent\.kingsmen_status, parent\.status\)/.test(workbench) && /PRE_SUBMISSION_INTERNAL_STATES/.test(statusContract)],
  ["workbench browser contract verifies preparation, resume link and no provider submission", /prepare_master_application/.test(workbenchBrowserTest) && /Open \/ resume application draft/.test(workbenchBrowserTest) && /provider submission endpoint/.test(workbenchBrowserTest) && /test-candidate-workbench-ui\.mjs/.test(workflow)],
  ["web manifest and lock pin patched Next.js 15.5.29 across its runtime and SWC packages", webManifest.dependencies?.next === "15.5.29" && webPackages["node_modules/next"]?.version === "15.5.29" && webPackages["node_modules/@next/env"]?.version === "15.5.29" && Object.entries(webPackages).filter(([name]) => name.startsWith("node_modules/@next/swc-")).length > 0 && Object.entries(webPackages).filter(([name]) => name.startsWith("node_modules/@next/swc-")).every(([, item]) => item.version === "15.5.29")],
  ["image optimization and PostCSS dependencies use patched Sharp 0.35.5 and PostCSS 8.5.33", webPackages["node_modules/sharp"]?.version === "0.35.5" && webManifest.overrides?.postcss === "8.5.33" && webPackages["node_modules/postcss"]?.version === "8.5.33"],
  ["XML parser, Nano ID and source-map transitive dependencies meet patched minimums", versionAtLeast(webPackages["node_modules/@xmldom/xmldom"]?.version, "0.8.15") && versionAtLeast(webPackages["node_modules/nanoid"]?.version, "3.3.18") && versionAtLeast(webPackages["node_modules/source-map-js"]?.version, "1.2.2")],
  ["draft persistence contract runs in the isolated application-draft workflow", /validate-candidate-application-draft-persistence\.mjs/.test(workflow)]
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
  if (!passed) failed++;
}
process.stdout.write("Candidate application draft persistence contract: " + (checks.length - failed) + "/" + checks.length + " passed\n");
if (failed) process.exit(1);
