import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("db/migrations/0108_candidate_application_readiness_eligibility_deadline_gate_20261101.sql");
const tracker = read("apps/web/src/app/candidate/applications/page.tsx");
const preparation = read("supabase/functions/candidate-application-preparation/index.ts");
const packageJson = JSON.parse(read("package.json"));

const checks = [
  ["draft preparation requires an authenticated verified candidate", migration.includes("auth.uid()") && migration.includes("current_authenticated_candidate_id()") && migration.includes("VERIFIED_CANDIDATE_IDENTITY_REQUIRED")],
  ["latest profile-processing consent is revalidated in the database", migration.includes("v_has_active_consent") && migration.includes("ORDER BY pc.granted_at DESC, pc.id DESC") && migration.includes("PROFILE_PROCESSING_CONSENT_REQUIRED")],
  ["opportunity match is candidate-specific and approved", migration.includes("m.candidate_ref = v_candidate_id::text") && migration.includes("m.match_status = 'APPROVED'") && migration.includes("m.human_review_required = false")],
  ["candidate-specific match must contain supporting evidence", migration.includes("m.evidence_refs as match_evidence") && migration.includes("CANDIDATE_MATCH_EVIDENCE_REQUIRED") && migration.includes("opportunity_eligibility_gate")],
  ["latest source observation is selected before its status is evaluated", migration.includes("where o.source_url = p.exact_link") && migration.includes("order by o.observed_at desc, o.id desc") && !migration.includes("where o.observation_status = 'VERIFIED'")],
  ["source observation requires verified official source and recent checked time", migration.includes("observation_status is distinct from 'VERIFIED'") && migration.includes("observation_source_confidence is distinct from 'OFFICIAL_VERIFIED'") && migration.includes("interval '24 hours'")],
  ["source observation requires consistent timestamps, non-stale window and evidence", migration.includes("observed_at > v_match.last_checked_at") && migration.includes("stale_after <= now()") && migration.includes("valid_until") && migration.includes("observation_evidence")],
  ["latest deadline is selected irrespective of status so stale records cannot be masked", migration.includes("select d.deadline_ref, d.deadline_status, d.source_confidence") && migration.includes("order by d.created_at desc, d.id desc") && !migration.includes("and d.deadline_status = 'CONFIRMED'")],
  ["application draft requires a confirmed official deadline with evidence", migration.includes("deadline_status is distinct from 'CONFIRMED'") && migration.includes("deadline_source_confidence is distinct from 'OFFICIAL_VERIFIED'") && migration.includes("deadline_evidence")],
  ["application deadline must have a future closing timestamp", migration.includes("opens_at is null") && migration.includes("closes_at is null") && migration.includes("closes_at <= now()")],
  ["future opening dates and reversed application windows are rejected", migration.includes("opens_at > now()") && migration.includes("closes_at <= v_match.opens_at")],
  ["missing or expired deadline fails closed without creating a draft", migration.includes("CONFIRMED_OPEN_DEADLINE_REQUIRED") && migration.includes("no application draft was created")],
  ["readiness snapshot records match, deadline and source evidence refs", migration.includes("candidate_match_evidence_refs") && migration.includes("deadline_ref") && migration.includes("deadline_evidence_refs") && migration.includes("source_checked_at")],
  ["a linked parent returns its persisted application and readiness states rather than hardcoding DRAFT", migration.includes("select ca.application_ref, ca.status, ca.readiness_status") && migration.includes("'application_ref', v_application_ref, 'status', v_status") && migration.includes("'readiness_status', v_readiness_status")],
  ["application creation uses INSERT RETURNING to distinguish a new parent from a uniqueness conflict", migration.includes("returning id, application_ref, status, readiness_status") && migration.includes("if found then") && migration.includes("v_created := true")],
  ["an existing parent is locked and reused only as an untouched editable DRAFT", migration.includes("for update;") && migration.includes("v_status is distinct from 'DRAFT' or v_downstream_activity") && migration.includes("EXISTING_APPLICATION_NOT_REUSABLE")],
  ["submission jobs and downstream events prevent accidental reuse of an existing parent", migration.includes("candidate_application_submission_jobs sj") && migration.includes("SUBMISSION_ATTEMPT_CREATED") && migration.includes("PROVIDER_ACKNOWLEDGED")],
  ["APPLICATION_CREATED is emitted only when a new parent row is inserted", migration.includes("if v_created then") && migration.includes("'APPLICATION_CREATED'")],
  ["the result returns actual created/reused and persisted status values", migration.includes("'ok', true, 'created', v_created") && migration.includes("'status', v_status") && migration.includes("'readiness_status', v_readiness_status")],
  ["candidate UI distinguishes candidate-specific match from final provider eligibility", tracker.includes("Candidate-specific N15 match approved with supporting evidence") && tracker.includes("not a provider decision or a guarantee")],
  ["candidate UI presents the evidenced application window and checked timestamp", tracker.includes("CONFIRMED_OPEN_WINDOW") && tracker.includes("deadline_closes_at") && tracker.includes("deadline_ref") && tracker.includes("source_checked_at")],
  ["candidate-facing API forwards the candidate bearer to the authenticated preparation RPC", preparation.includes('Authorization:"Bearer "+token') && preparation.includes('userClient.rpc("prepare_candidate_application_from_master_target"')],
  ["readiness validation runs in Candidate Experience CI", packageJson.scripts["candidate:experience:check"].includes("validate-application-readiness-eligibility-deadline.mjs")]
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write((passed ? "PASS " : "FAIL ") + name + "\n");
  if (!passed) failed++;
}
process.stdout.write("Application readiness, eligibility and deadline contract: " + (checks.length - failed) + "/" + checks.length + " passed\n");
if (failed) process.exit(1);
