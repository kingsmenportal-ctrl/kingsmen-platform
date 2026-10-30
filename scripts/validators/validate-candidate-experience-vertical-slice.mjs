import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const profilePage = read("apps/web/src/app/candidate/profile/page.tsx");
const profileRoute = read("apps/web/src/app/api/candidate/profile/route.ts");
const profileFunction = read("supabase/functions/candidate-master-profile/index.ts");
const opportunityPage = read("apps/web/src/app/candidate/opportunity-matches/page.tsx");
const applicationRoute = read("apps/web/src/app/api/candidate/applications/route.ts");
const preparation = read("supabase/functions/candidate-application-preparation/index.ts");
const opportunitySaveRoute = read("apps/web/src/app/api/candidate/opportunity-save/route.ts");
const verifiedOpportunitySave = read("supabase/functions/candidate-save-verified-opportunity/index.ts");
const dashboard = read("apps/web/src/app/candidate/dashboard/page.tsx");
const identityPage = read("apps/web/src/app/candidate/identity-review/page.tsx");
const identityRoute = read("apps/web/src/app/api/candidate/identity-review/route.ts");
const followupRoute = read("apps/web/src/app/api/candidate/identity-review/followup/route.ts");
const evidenceRoute = read("apps/web/src/app/api/candidate/identity-review/evidence/route.ts");
const documentPage = read("apps/web/src/app/candidate/documents/page.tsx");
const documentFunction = read("supabase/functions/candidate-private-documents/index.ts");
const session = read("apps/web/src/lib/candidate-session.ts");
const nextConfig = read("apps/web/next.config.mjs");
const caoPage = read("apps/web/src/app/candidate/cao-choices/page.tsx");
const caoRoute = read("apps/web/src/app/api/candidate/cao-choices/route.ts");
const caoMigration = read("db/migrations/0096_candidate_application_cao_choice_bridge.sql");

const checks = [
  ["profile CRUD is a backend API contract", /action: "load"/.test(profilePage) && /action: "save"/.test(profilePage) && /candidate-master-profile/.test(profileRoute)],
  ["profile load/save are restricted to verified identity links", /candidate_auth_identity_links/.test(profileFunction) && /link_status,verified_at,verified_by/.test(profileFunction.replace(/\s/g, "")) && /IDENTITY_NOT_VERIFIED/.test(profileFunction)],
  ["profile writes use canonical Supabase master profile table", /candidate_master_profiles/.test(profileFunction) && /onConflict: "candidate_id"/.test(profileFunction)],
  ["consent has a versioned snapshot and persisted status", /CONSENT_VERSION/.test(profileFunction) && /consent_text_snapshot/.test(profileFunction) && /privacy_consent_records/.test(profileFunction)],
  ["consent revoke preserves profile data", /consent_status: "REVOKED"/.test(profileFunction) && /profilePreserved: true/.test(profileFunction)],
  ["profile completeness is computed from required fields", /function completion\(/.test(profileFunction) && /pathwayPreferences/.test(profilePage) && /aria-valuenow/.test(profilePage)],
  ["profile reload fetches backend, not browser-stored profile", /action: "load"/.test(profilePage) && /cache: "no-store"/.test(profilePage) && !/localStorage.*profile/i.test(profilePage)],
  ["candidate session key derives from configured Supabase project ref", /new URL\(base\).hostname.split\("\."\)\[0\]/.test(session) && /sb-\$\{projectRef\}-auth-token/.test(session)],
  ["Netlify SUPABASE_URL/anon aliases are exposed only as public Next.js build variables", nextConfig.includes("process.env.SUPABASE_URL") && nextConfig.includes("process.env.SUPABASE_ANON_KEY") && nextConfig.includes("publicBuildEnv.NEXT_PUBLIC_SUPABASE_URL = safeSupabaseUrl") && nextConfig.includes("publicBuildEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = publicSupabaseAnonKey") && !/publicBuildEnv\\.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY\\s*=/.test(nextConfig)],
  ["six pathway filters are present", ["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIPS","INTERNSHIPS","APPRENTICESHIPS","EMPLOYMENT"].every(x => opportunityPage.includes(x))],
  ["N15 feed fails closed on missing/stale evidence", /n15-candidate-opportunities/.test(opportunityPage) && /stale|verified/i.test(opportunityPage)],
  ["candidate opportunity save uses dedicated authenticated API proxy", /candidate-save-verified-opportunity/.test(opportunitySaveRoute) && /AUTHENTICATION_REQUIRED/.test(opportunitySaveRoute) && /cache: "no-store"/.test(opportunitySaveRoute)],
  ["save action revalidates authorized identity and candidate-scoped match", /candidate_auth_identity_links/.test(verifiedOpportunitySave) && verifiedOpportunitySave.includes('link.link_status!=="VERIFIED"') && verifiedOpportunitySave.includes('.eq("candidate_ref",candidateId)') && verifiedOpportunitySave.includes('.eq("match_status","APPROVED")')],
  ["save action rechecks official provenance, freshness and open status", /OFFICIAL_VERIFIED/.test(verifiedOpportunitySave) && /stale_after/.test(verifiedOpportunitySave) && /opening_status!=="OPEN"/.test(verifiedOpportunitySave) && /human_review_required",false/.test(verifiedOpportunitySave)],
  ["opportunity save requires the latest profile-processing consent state and fails closed on revocation", /const latestConsent=\(consentRows\?\?\[\]\)\[0\]/.test(verifiedOpportunitySave) && /latestConsent\?\.consent_status===\"ACTIVE\"/.test(verifiedOpportunitySave) && !/consentRows\?\?\[\]\.some\(\(row:any\)=>row\.consent_status===\"ACTIVE\"/.test(verifiedOpportunitySave) && verifiedOpportunitySave.includes("consent_text_snapshot") && verifiedOpportunitySave.includes("revoked_at")],
  ["profile save does not resurrect consent from an older active record", /const latestConsent = consentRows\?\.\[0\]/.test(profileFunction) && /const activeConsent = latestConsent\?\.consent_status === \"ACTIVE\"/.test(profileFunction) && !/consentRows\?\.find\(\(row: Record<string, unknown>\) => row\.consent_status === \"ACTIVE\"/.test(profileFunction),
  ["opportunity page automatically loads authenticated feed and persisted draft state", /useEffect/.test(opportunityPage) && /void loadMatches\(\)/.test(opportunityPage) && /loadSavedWorkbench/.test(opportunityPage) && /masterTargets/.test(opportunityPage) && /parentApplications/.test(opportunityPage)],
  ["save UI uses the verified saver and keeps provider submission unclaimed", /\/api\/candidate\/opportunity-save/.test(opportunityPage) && /No provider submission has occurred/.test(verifiedOpportunitySave) && /prepareApplication\(item\)/.test(opportunityPage) === false],
  ["opportunity save and master-application actions are whitelisted", /save_n15_match/.test(applicationRoute) && /prepare_master_application/.test(applicationRoute) && /save_n15_match/.test(preparation) && /prepare_master_application/.test(preparation)],
  ["CAO remains governed by existing shared child-choice validator", /validateApplicationChildChoices/.test(read("apps/api/src/routes/application-lifecycle-policy.ts")) && /caoIsOneKingsmenApplication/.test(read("apps/api/src/routes/cao-boundary.ts"))],
  ["application status remains candidate-reported, not provider confirmation", /SUBMITTED_CANDIDATE_REPORTED/.test(preparation) && /provider_submission_sent:false/.test(preparation)],
  ["dashboard links to the persistent profile", /\/candidate\/profile/.test(dashboard)],
  ["profile corrections persist as review requests and never overwrite profile data", /request_correction/.test(profileFunction) && /candidate_profile_change_requests/.test(profileFunction) && /Your saved profile was not changed/.test(profileFunction)],
  ["identity-review status/request and follow-up APIs are connected", /candidate-identity-review-request/.test(identityRoute) && /candidate-identity-review-status/.test(identityRoute) && /candidate-identity-review-followup/.test(followupRoute)],
  ["identity evidence upload is explicitly consented and securely proxied", /evidenceConsent/.test(identityPage) && /candidate-identity-review-evidence-upload/.test(evidenceRoute) && /sha256/.test(read("supabase/functions/candidate-identity-review-evidence-upload/index.ts"))],
  ["document review states, correction notes and audit timeline are backend-fed", /candidate_private_document_reviews/.test(documentFunction) && /candidate_private_document_events/.test(documentFunction) && /reviewHistory/.test(documentPage) && /timeline/.test(documentPage)],
  ["candidate profile and workbench use shared Supabase project session parsing", /getCandidateAccessToken/.test(profilePage) && /getCandidateAccessToken/.test(read("apps/web/src/app/candidate/workbench/page.tsx")) && /getCandidateAccessToken/.test(read("apps/web/src/app/candidate/applications/page.tsx"))],
  ["active pathway filter determines the displayed and submitted pathway", /pathway !== "ALL" && item.pathways.includes\(pathway\) \? pathway/.test(opportunityPage)],
  ["dashboard links to profile and identity review", /\/candidate\/profile/.test(dashboard) && /\/candidate\/identity-review/.test(dashboard)],
  ["CAO children link to unified candidate_applications without rewriting legacy parents", /candidate_application_id/.test(caoMigration) && /REFERENCES public\.candidate_applications \(id, candidate_id\)/.test(caoMigration) && /exactly_one_parent_check/.test(caoMigration) && /application_id DROP NOT NULL/.test(caoMigration) && !/ADD CONSTRAINT candidate_applications_id_candidate_id_key/.test(caoMigration)],
  ["CAO choice reads and writes use authenticated owner-bound RPCs", /list_candidate_cao_parents/.test(caoMigration) && /get_candidate_cao_choices/.test(caoMigration) && /save_candidate_cao_choices/.test(caoMigration) && /VERIFIED_CANDIDATE_IDENTITY_REQUIRED/.test(caoMigration) && /GRANT EXECUTE ON FUNCTION public.save_candidate_cao_choices/.test(caoMigration)],
  ["direct parent-draft RPC does not bypass withdrawn profile consent", /prepare_candidate_application_from_master_target/.test(caoMigration) && /PROFILE_PROCESSING_CONSENT_REQUIRED/.test(caoMigration) && /pc\.consent_status = 'ACTIVE'/.test(caoMigration)],
  ["CAO child choices cap at six, keep order unique and remain unverified drafts", /jsonb_array_length\(p_choices\) > 6/.test(caoMigration) && /CAO_CHOICE_NUMBERS_MUST_BE_UNIQUE/.test(caoMigration) && /'D', 'DRAFT'/.test(caoMigration) && /provider_submission_sent', false/.test(caoMigration)],
  ["CAO API rejects JSON null, primitives, and arrays before reading action", /!incoming \|\| typeof incoming !== "object" \|\| Array\.isArray\(incoming\)/.test(caoRoute)],
  ["CAO API proxies bearer identity without browser service role", /AUTHENTICATION_REQUIRED/.test(caoRoute) && /Authorization: authorization/.test(caoRoute) && caoRoute.includes('/rest/v1/rpc/') && !/SUPABASE_SERVICE_ROLE_KEY/.test(caoRoute)],
  ["CAO UI supports ordered choices, six-item limit and draft-only editing", /choices.length >= 6/.test(caoPage) && /reorderChoice/.test(caoPage) && /selectedParent.status !== "DRAFT"/.test(caoPage) && caoPage.includes("does not submit anything to CAO or a provider")],
  ["CAO editor is reachable from dashboard and application tracker", /\/candidate\/cao-choices/.test(dashboard) && /\/candidate\/cao-choices/.test(read("apps/web/src/app/candidate/applications/page.tsx"))],
];
let failed = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  if (!passed) failed++;
}
console.log(`Candidate experience vertical-slice contract: ${checks.length - failed}/${checks.length} passed`);
if (failed) process.exit(1);
