import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFile(resolve(root, name), "utf8");

test("candidate workspace has responsive accessible shell and demo disclosure", async () => {
  const html = await read("index.html");
  assert.match(html, /name="viewport"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /ACCOUNT \+ DEMO MODE/);
  assert.match(html, /Supabase Auth provides account sign-in/);
  assert.match(html, /styles\.css/);
  assert.match(html, /app\.js/);
});

test("workflow implements pathways, saving, preparation and document readiness", async () => {
  const js = await read("app.js");
  for (const marker of ["higher-education", "tvet", "seta", "internships", "apprenticeships", "employment", "data-save", "data-application", "data-document", "candidate-reported", "localStorage", "function profileView()", "profile-form", "Profile readiness"]) {
    assert.ok(js.includes(marker), `expected workflow marker: ${marker}`);
  }
  assert.match(js, /not submitted/i);
  assert.match(js, /demo profile saved in this browser/i);
  assert.match(js, /profile-form/);
  assert.match(js, /not a verified live listing/i);
});

test("no client-side privileged secret or production credential is embedded", async () => {
  const files = [await read("index.html"), await read("app.js"), await read("styles.css")].join("\n");
  assert.doesNotMatch(files, /service_role|SUPABASE_SERVICE_ROLE_KEY|sk-[A-Za-z0-9]{20,}/i);
});

test("all six required Kingsmen pathways are present in canonical journey order", async () => {
  const js = await read("app.js");
  const expected = ["higher-education", "tvet", "seta", "internships", "apprenticeships", "employment"];
  const block = js.match(/const pathways = \[([\s\S]*?)\n  \];/);
  assert.ok(block, "pathway catalogue must be declared");
  const actual = [...block[1].matchAll(/id:"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(actual, expected, "pathway navigation must follow the six-pathway canonical order");
  assert.doesNotMatch(js, /unconfirmed-sixth|Sixth pathway — name to confirm/);
  assert.doesNotMatch(block[1], /id:"entrepreneurship"/, "entrepreneurship must not replace a required pathway");
});
test("account entry point uses Supabase Auth without claiming candidate identity", async () => {
  const html = await read("index.html");
  const js = await read("app.js");
  const client = await read("supabase-client.js");
  assert.match(html, /data-view="account"/);
  assert.match(html, /supabase-js@2/);
  assert.match(client, /sb_publishable_/);
  assert.doesNotMatch(client, /service_role|SUPABASE_SERVICE_ROLE_KEY/i);
  assert.match(js, /signInWithPassword/);
  assert.match(js, /resetPasswordForEmail/);
  assert.match(js, /candidate identity has not been linked or verified/i);
  assert.match(js, /onAuthStateChange/);
});

test("opportunities use the verified-public route catalogue before demo samples", async () => {
  const js = await read("app.js");
  assert.match(js, /from\("route_programmes"\)/);
  assert.match(js, /eq\("route_status",\s*"VERIFIED"\)/);
  assert.match(js, /source_confidence_band/);
  assert.match(js, /route_providers!inner\(provider_name,public_safe,verification_status,default_confidence_band\)/);
  assert.match(js, /route_providers\.public_safe/);
  assert.match(js, /route_providers\.verification_status/);
  assert.match(js, /route_providers\.default_confidence_band/);
  assert.match(js, /90\*24\*60\*60\*1000/);
  assert.match(js, /No verified live listings are currently available/);
  assert.match(js, /Practice with demo listings/);
  assert.match(js, /Open official source/);
});

test("saving a verified route requires a signed-in user and uses owner-scoped RLS table", async () => {
  const js = await read("app.js");
  assert.match(js, /data-save-route/);
  assert.match(js, /Sign in first to save a verified opportunity/);
  assert.match(js, /from\("candidate_saved_routes"\)\.insert/);
  assert.match(js, /user_id:authSession\.user\.id/);
});

test("identity-link claims go through authenticated manual-review endpoint", async () => {
  const js = await read("app.js");
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-identity-review-request/index.ts"), "utf8");
  assert.match(js, /identity-review-form/);
  assert.match(js, /functions\.invoke\("candidate-identity-review-request"/);
  assert.match(fn, /auth\.auth\.getUser/);
  assert.match(fn, /submit_candidate_identity_review_for_user/);
  assert.match(fn, /IDENTITY_REVIEW_ALREADY_OPEN/);
  assert.match(fn, /does not verify identity or link a candidate record/i);
  assert.match(fn, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(js, /Message for the reviewer \(required\)/);
  assert.match(js, /identity-claimant-message[\s\S]*?required minlength="3"/);
  assert.match(js, /response\.json\(\)/);
  assert.match(js, /Check back for an update rather than submitting another request/);

  assert.doesNotMatch(fn, /console\.log\(.*claimant|console\.log\(.*candidate_reference/i);
});

test("verified candidate readiness sync uses server-verified identity and bounded fields", async () => {
  const js = await read("app.js");
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-workspace-readiness/index.ts"), "utf8");
  assert.match(js, /functions\.invoke\("candidate-workspace-readiness"/);
  assert.match(js, /workspacePersistenceAvailable/);
  assert.match(fn, /auth\.getUser/);
  assert.match(fn, /candidate_auth_identity_links/);
  assert.match(fn, /eq\("link_status",\s*"VERIFIED"\)/);
  assert.match(fn, /verified_at/);
  assert.match(fn, /candidate_workspace_readiness/);
  assert.match(fn, /upsert\(/);
  assert.match(fn, /IDENTITY_NOT_VERIFIED/);
  assert.match(fn, /taskIds/);
  assert.match(fn, /pathwayIds/);
  assert.doesNotMatch(fn, /payload\.candidate_id/);
  assert.match(fn, /Cache-Control.*no-store/);
});

test("official profile corrections require a verified identity link and reviewer approval", async () => {
  const js = await read("app.js");
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-profile-review/index.ts"), "utf8");
  assert.match(js, /functions\.invoke\("candidate-profile-review"/);
  assert.match(js, /Submit correction requests/);
  assert.match(js, /official profile has not been changed/i);
  assert.match(fn, /auth\.getUser/);
  assert.match(fn, /candidate_auth_identity_links/);
  assert.match(fn, /eq\("link_status",\s*"VERIFIED"\)/);
  assert.match(fn, /candidate_profile_change_requests/);
  assert.match(fn, /status:\s*"PENDING"/);
  assert.match(fn, /FIELDS/);
  assert.doesNotMatch(fn, /from\("candidate_profiles"\)\.update/);
  assert.doesNotMatch(fn, /payload\.candidate_id/);
});

test("persistent application preparation is gated by verified candidate identity", async () => {
  const js = await read("app.js");
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-application-preparation/index.ts"), "utf8");
  assert.match(js, /candidate-application-preparation/);
  assert.match(js, /data-start-tracker/);
  assert.match(js, /data-add-item/);
  assert.match(js, /data-update-item/);
  assert.match(fn, /auth\.auth\.getUser|auth\.getUser/);
  assert.match(fn, /candidate_auth_identity_links/);
  assert.match(fn, /eq\("link_status",\s*"VERIFIED"\)/);
  assert.match(fn, /verified_at/);
  assert.match(fn, /candidate_saved_routes/);
  assert.match(fn, /route_programmes/);
  assert.match(fn, /in\("availability_status",\s*\["OPEN","FUTURE"\]\)/);
  assert.match(fn, /in\("source_confidence_band",\s*\["A","B"\]\)/);
  assert.match(fn, /route_providers\(public_safe,verification_status,default_confidence_band\)/);
  assert.match(fn, /verification_status!=="VERIFIED"/);
  assert.match(fn, /gte\("updated_at",new Date\(Date\.now\(\)-90\*24\*60\*60\*1000\)/);
  assert.match(fn, /default checklist was checked and repaired if missing/);
  assert.match(fn, /Retry creating the tracker to repair the missing checklist/);
  assert.match(fn, /existing candidate data will be preserved/);
  assert.match(fn, /candidate_application_tracker/);
  assert.match(fn, /candidate_application_preparation_items/);
  assert.match(fn, /SUBMITTED_CANDIDATE_REPORTED/);
  assert.match(fn, /No provider submission is implied|not a provider application/i);
  assert.doesNotMatch(fn, /payload\.candidate_id|p\.candidate_id/);
  assert.match(fn, /Cache-Control.*no-store/);
});


test("official profile displays escaped correction-request history without mutating authoritative fields", async () => {
  const js = await read("app.js");
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-profile-review/index.ts"), "utf8");
  assert.match(js, /Correction request history/);
  assert.match(js, /profileChangeRequests\.map/);
  assert.match(js, /escapeHtml\(r\.requested_value/);
  assert.match(js, /escapeHtml\(r\.status/);
  assert.match(js, /No correction requests yet/);
  assert.match(fn, /\.select\("id,field_name,requested_value,reason,status,requested_at"\)/);
  assert.doesNotMatch(fn, /from\("candidate_profiles"\)\.update/);
});

test("browser-local demo state is reset when the authenticated account changes", async () => {
  const js = await read("app.js");
  assert.match(js, /function setAuthSession\(session\)/);
  assert.match(js, /previousUserId = authSession\?\.user\?\.id \|\| null/);
  assert.match(js, /nextUserId = session\?\.user\?\.id \|\| null/);
  assert.match(js, /if \(previousUserId !== nextUserId\) \{[\s\S]*?state = initial\(\);[\s\S]*?privateDocuments = \[\];[\s\S]*?save\(\);\s*\}/);
  assert.match(js, /setAuthSession\(data\.session\)/);
  assert.match(js, /setAuthSession\(session\)/);
});

test("stale async responses cannot overwrite a different signed-in candidate workspace", async () => {
  const js = await read("app.js");
  assert.match(js, /if \(authSession\?\.user\?\.id !== userId\) return false;/);
  assert.match(js, /loadOfficialProfile[\s\S]*?await supabaseClient\.functions\.invoke\('candidate-profile-review',[\s\S]*?authSession\?\.user\?\.id !== userId/);
  assert.match(js, /loadPersistentReadiness[\s\S]*?await supabaseClient\.functions\.invoke\("candidate-workspace-readiness",[\s\S]*?authSession\?\.user\?\.id !== userId/);
  assert.match(js, /loadApplicationWorkspace[\s\S]*?Promise\.all\([\s\S]*?authSession\?\.user\?\.id !== userId/);
});

test("application tracker maps every canonical pathway and never silently converts entrepreneurship into employment", async () => {
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-application-preparation/index.ts"), "utf8");
  const mapBlock = fn.match(/const pathwayMap: Record<string,string> = (\{[^\n]+\});/);
  assert.ok(mapBlock, "server pathway mapping must be explicit and reviewable");
  const pathwayMap = JSON.parse(mapBlock[1]);
  for (const [input, expected] of [
    ["HIGHER_EDUCATION", "higher_education"],
    ["higher_education", "higher_education"],
    ["TVET", "tvet"],
    ["tvet", "tvet"],
    ["SETA", "seta_learnership"],
    ["SETA_LEARNERSHIP", "seta_learnership"],
    ["seta", "seta_learnership"],
    ["INTERNSHIP", "internship"],
    ["INTERNSHIPS", "internship"],
    ["internship", "internship"],
    ["internships", "internship"],
    ["APPRENTICESHIP", "apprenticeship"],
    ["APPRENTICESHIPS", "apprenticeship"],
    ["apprenticeship", "apprenticeship"],
    ["apprenticeships", "apprenticeship"],
    ["EMPLOYMENT", "employment"],
    ["employment", "employment"]
  ]) {
    assert.equal(pathwayMap[input], expected, `wrong application pathway mapping for ${input}`);
  }
  assert.equal(Object.hasOwn(pathwayMap, "entrepreneurship"), false);
  assert.equal(Object.hasOwn(pathwayMap, "ENTREPRENEURSHIP"), false);
});

test("official South African source expansion stays idempotent and never implies live availability", async () => {
  const seed = await readFile(resolve(root, "../..", "db/seeds/n06_route_universe_seed.sql"), "utf8");
  const migration = await readFile(resolve(root, "../..", "supabase/migrations/20261022194413_expand_sa_official_source_catalog.sql"), "utf8");
  const keys = [
    "govza_government_jobs", "labour_vacancies", "etdp_seta_official",
    "services_seta_official", "merseta_official", "ewseta_official",
    "agriseta_official", "bankseta_official", "teta_official",
    "foodbev_seta_official", "fasset_official", "ceta_official",
    "mict_seta_official", "dhet_career_advice"
  ];
  for (const key of keys) {
    assert.ok(seed.includes(`('${key}'`), `re-runnable seed must include ${key}`);
    assert.ok(migration.includes(`('${key}'`), `staging migration must include ${key}`);
  }
  assert.match(seed, /ON CONFLICT \(source_key\) DO UPDATE/);
  assert.match(migration, /ON CONFLICT \(source_key\) DO UPDATE/);
  assert.match(seed, /verification_required, verification_notes/);
  assert.match(migration, /verification_required, verification_notes/);
  assert.match(seed, /not programme listings/i);
  assert.match(migration, /not live listings/i);
  assert.match(seed, /https:\/\//);
  assert.match(migration, /https:\/\//);
});

test("candidate readiness supports all six canonical pathways and both endpoints allow only HTTPS Kingsmen previews", async () => {
  const readiness = await readFile(resolve(root, "../..", "supabase/functions/candidate-workspace-readiness/index.ts"), "utf8");
  const preparation = await readFile(resolve(root, "../..", "supabase/functions/candidate-application-preparation/index.ts"), "utf8");
  assert.match(readiness, /const pathwayIds = new Set\(\["", "higher-education", "tvet", "seta", "internships", "apprenticeships", "employment"\]\)/);
  assert.doesNotMatch(readiness, /const pathwayIds[^\n]*entrepreneurship/);
  for (const fn of [readiness, preparation]) {
    assert.match(fn, /function isAllowedOrigin\(origin: string\): boolean/);
    assert.ok(fn.includes("^https:\\/\\/[a-z0-9-]+--kingsmen-portal-staging\\.netlify\\.app$/i.test(origin)"), "only HTTPS deploy previews for this Netlify site are allowed");
    assert.ok(fn.includes("!isAllowedOrigin(origin)"), "unexpected origins must be rejected");
    assert.doesNotMatch(fn, /https:\/\/6ad61ee1da20fa786856f07e--kingsmen-portal-staging\.netlify\.app/);
  }
});

test("private document lifecycle requires verified identity and scopes every record to the resolved candidate", async () => {
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-private-documents/index.ts"), "utf8");
  assert.match(fn, /auth\.auth\.getUser|auth\.getUser/);
  assert.match(fn, /candidate_auth_identity_links/);
  assert.match(fn, /eq\("link_status",\s*"VERIFIED"\)/);
  assert.match(fn, /verified_at/);
  assert.match(fn, /candidate_private_documents/);
  assert.match(fn, /eq\("candidate_id", candidateId\)/);
  assert.match(fn, /createSignedUploadUrl/);
  assert.match(fn, /createSignedUrl\(doc\.storage_path, 60/);
  assert.match(fn, /MAX_BYTES = 10 \* 1024 \* 1024/);
  assert.match(fn, /"application\/pdf"/);
  assert.match(fn, /"image\/jpeg"/);
  assert.match(fn, /"image\/png"/);
  assert.match(fn, /UPLOAD_PENDING/);
  assert.match(fn, /UPLOADED_CANDIDATE_REPORTED/);
  assert.match(fn, /event_type:\s*"UPLOAD_CONFIRMED"/);
  assert.match(fn, /event_type:\s*"READ_LINK_ISSUED"/);
  assert.match(fn, /download audit failed/);
  assert.match(fn, /signatureValid/);
  assert.match(fn, /function isAllowedOrigin\(origin: string\): boolean/);
  assert.match(fn, /kingsmen-portal-staging\\\.netlify\\\.app/);
  assert.match(fn, /if \(origin && !isAllowedOrigin\(origin\)\)/);
  assert.match(fn, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(fn, /event_type:\s*"UPLOAD_FAILED"/);
  assert.match(fn, /sha256_hex:\s*sha256Hex/);
  assert.doesNotMatch(fn, /event_type:\s*"UPLOAD_FINALIZED"/);
  assert.match(fn, /auditError/);
  assert.match(fn, /It is not independently verified/);
  assert.match(fn, /Cache-Control/);
  assert.doesNotMatch(fn, /p\.candidate_id|payload\.candidate_id/);
});


test("candidate document interface uses the private lifecycle and never treats candidate uploads as verified", async () => {
  const app = await read("app.js");
  assert.match(app, /candidate-private-documents/);
  assert.match(app, /uploadToSignedUrl/);
  assert.match(app, /finalize_upload/);
  assert.match(app, /create_download_url/);
  assert.match(app, /documentChecklistItems/);
  assert.match(app, /item_type==="DOCUMENT"/);
  assert.doesNotMatch(app, /Optional preparation checklist item ID/);
  assert.match(app, /privateDocumentsLoadedForUser/);
  assert.match(app, /It is not independently verified/);
  assert.match(app, /10\s*\*\s*1024\s*\*\s*1024/);
});


test("private document reviewer decisions require an active evidence reviewer and persist transitions atomically", async () => {
  const fn = await readFile(resolve(root, "../..", "supabase/functions/candidate-private-documents/index.ts"), "utf8");
  const migration = await readFile(resolve(root, "../..", "supabase/migrations/20261020031028_n12_candidate_private_document_review.sql"), "utf8");
  assert.match(fn, /p\.action === "list_review_queue"/);
  assert.match(fn, /origin && isAllowedOrigin\(origin\) \? \{ "Access-Control-Allow-Origin": origin \}/);
  assert.match(fn, /signed_download_url: signed\.signedUrl, expires_in_seconds: 60 \}, origin\)/);
  assert.match(fn, /p\.action === "create_reviewer_download_url"/);
  assert.match(fn, /authenticated_reviewer_endpoint/);
  assert.match(fn, /actor_type: "REVIEWER"/);
  assert.match(fn, /createSignedUrl\(doc\.storage_path, 60/);
  assert.match(fn, /p\.action === "review_document"/);
  assert.match(fn, /platform_reviewers/);
  assert.match(fn, /eq\("is_active", true\)/);
  assert.match(fn, /is\("revoked_at", null\)/);
  assert.match(fn, /EVIDENCE_VERIFIER/);
  assert.match(fn, /PLATFORM_ADMIN/);
  assert.match(fn, /admin\.rpc\("review_candidate_private_document"/);
  assert.match(fn, /CORRECTION_REQUIRED/);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /candidate_private_document_reviews/);
  assert.match(migration, /candidate_private_document_events/);
  assert.match(migration, /REVIEW_STATUS_CHANGED/);
  assert.match(migration, /revoke all on function public\.review_candidate_private_document[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.review_candidate_private_document[\s\S]*to service_role/i);
  assert.match(migration, /v_doc\.status <> 'UNDER_REVIEW'/);
});

test("reviewer console connects the authenticated UI to permission-checked queue, download and decision endpoints", async () => {
  const app = await read("app.js");
  const html = await read("index.html");
  assert.match(html, /data-view="reviewer"/);
  assert.match(app, /function reviewerView\(\)/);
  assert.match(app, /id="reviewer-queue-search"/);
  assert.match(app, /id="reviewer-queue-status"/);
  assert.match(app, /data-reviewer-card/);
  assert.match(app, /function applyReviewerQueueFilters\(\)/);
  assert.match(app, /data-review-decision/);
  assert.match(app, /data-reviewer-download/);
  assert.match(app, /action:"list_review_queue"/);
  assert.match(app, /action:"create_reviewer_download_url"/);
  assert.match(app, /action:"review_document"/);
  assert.match(app, /reviewerQueueLoadedForUser===authSession\.user\.id/);
  assert.match(app, /reviewerQueue=\[\];\s*reviewerQueueLoadedForUser=null/);
  assert.match(app, /Final decisions require a reviewer note and evidence reference/);
  assert.match(app, /Temporary reviewer download link issued and audited/);
});

test("N09 communications and consent ledgers are backend-only until candidate-scoped policies are implemented", async () => {
  const legacyMigration = await readFile(resolve(root, "../..", "db/migrations/0007_n09_notifications_communications.sql"), "utf8");
  const hardeningMigration = await readFile(resolve(root, "../..", "supabase/migrations/20261022202953_n09_communications_backend_only.sql"), "utf8");
  const mirroredMigration = await readFile(resolve(root, "../..", "db/migrations/0085_n09_communications_backend_only.sql"), "utf8");
  const policy = await readFile(resolve(root, "../..", "apps/api/src/communications/communication-policy.ts"), "utf8");
  const proofBoundary = await readFile(resolve(root, "../..", "apps/api/src/communications/communications-proof-boundary.ts"), "utf8");
  const tables = [
    "communication_templates", "communication_threads", "notification_outbox",
    "notification_delivery_attempts", "inbound_messages", "candidate_portal_messages",
    "urgent_whatsapp_escalations", "communication_quiet_hours",
    "communication_rate_limits", "message_evidence_ledger"
  ];
  for (const table of tables) {
    assert.match(legacyMigration, new RegExp(`create policy ${table}_all on public\\.${table} for all to service_role`, "i"), `legacy N09 policy must be backend-only: ${table}`);
    assert.match(hardeningMigration, new RegExp(`CREATE POLICY ${table}_backend_only ON public\\.${table}\\s+FOR ALL TO service_role`, "i"), `hardening migration must recreate backend-only policy: ${table}`);
    assert.match(mirroredMigration, new RegExp(`CREATE POLICY ${table}_backend_only ON public\\.${table}\\s+FOR ALL TO service_role`, "i"), `mirrored migration must match staging migration: ${table}`);
  }
  for (const migration of [hardeningMigration, mirroredMigration]) {
    assert.match(migration, /REVOKE ALL PRIVILEGES ON TABLE public\.%I FROM anon, authenticated/i);
    assert.match(migration, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.%I TO service_role/i);
    assert.match(migration, /privacy_consent_records_backend_only[\s\S]*FOR ALL TO service_role/i);
  }
  assert.match(policy, /WHATSAPP_URGENT_ONLY/);
  assert.match(policy, /SMS_BACKUP_ONLY/);
  assert.match(policy, /assertEvidenceReady/);
  assert.match(proofBoundary, /marketingRequiresExplicitConsent/);
  assert.match(proofBoundary, /recipientCount > 1/);
  assert.match(proofBoundary, /liveSendExecuted: false/);
});

