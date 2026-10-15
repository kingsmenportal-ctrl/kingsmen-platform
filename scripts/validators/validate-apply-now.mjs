import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readTextIfExists = (file) => fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), "utf8") : "";
const reportPath = path.join(root, "reports/validation/apply-now-latest.json");

const files = [
  "apps/web/src/app/personal-job-desk/apply-now/page.tsx",
  "apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx",
  "apps/web/src/app/api/personal-jobs/apply-now/route.ts"
];

const checks = files.map((file) => ({
  name: `file:${file}`,
  passed: fs.existsSync(path.join(root, file)),
  detail: file
}));

const api = readTextIfExists("apps/web/src/app/api/personal-jobs/apply-now/route.ts");
const client = readTextIfExists("apps/web/src/app/personal-job-desk/apply-now/ApplyNowClient.tsx");

checks.push({
  name: "has_upload_document_action",
  passed: api.includes('action === "uploadDocument"'),
  detail: "Upload document action must exist."
});

checks.push({
  name: "enforces_upload_size_limit",
  passed: api.includes("MAX_UPLOAD_BYTES = 10 * 1024 * 1024") && api.includes("buffer.length > MAX_UPLOAD_BYTES"),
  detail: "Uploads must enforce the 10 MB byte limit."
});

checks.push({
  name: "validates_document_signatures",
  passed: api.includes("function validateDocumentSignature") &&
    api.includes('toString("ascii") !== "%PDF-"') &&
    api.includes("validateDocumentSignature(fileName, decoded.mimeType, decoded.buffer)"),
  detail: "PDF and DOCX content signatures must be checked before storage."
});

checks.push({
  name: "rejects_malformed_base64",
  passed: api.includes("Upload contains malformed base64 data.") &&
    api.includes('buffer.toString("base64").replace(/=+$/, "")'),
  detail: "Non-canonical base64 input must be rejected."
});

checks.push({
  name: "rejects_invalid_text_upload_bytes",
  passed: api.includes("buffer.includes(0x00)") && api.includes('text.includes("\\uFFFD")'),
  detail: "TXT uploads must reject NUL bytes and invalid UTF-8 replacement characters."
});

checks.push({
  name: "production_fails_closed_without_durable_storage",
  passed: api.includes("function localCandidateStorageUnavailable()") &&
    api.includes('return process.env.NODE_ENV === "production";') &&
    !api.includes("KINGSMEN_ALLOW_LOCAL_CANDIDATE_STORAGE") &&
    api.includes('status: "STORAGE_NOT_CONFIGURED"') &&
    api.includes("return storageUnavailableResponse();"),
  detail: "Production must not silently serve candidate data from local JSON files."
});

checks.push({
  name: "private_local_file_permissions",
  passed: api.includes("mode: 0o700") && api.includes("mode: 0o600") &&
    api.includes("fs.chmodSync(filePath, 0o600)"),
  detail: "Development candidate records and uploads must use restrictive filesystem permissions."
});

checks.push({
  name: "does_not_expose_internal_file_path_or_stack",
  passed: !api.includes("localPath: filePath") && !api.includes("stack: error instanceof Error ? error.stack"),
  detail: "API responses must not expose server paths or exception stack traces."
});

checks.push({
  name: "has_add_opportunity_action",
  passed: api.includes('action === "addOpportunity"'),
  detail: "Opportunity action must exist."
});

checks.push({
  name: "has_generate_pack_action",
  passed: api.includes('action === "generatePack"'),
  detail: "Pack generation action must exist."
});

checks.push({
  name: "has_mark_applied_proof_action",
  passed: api.includes('action === "markApplied"'),
  detail: "Proof capture action must exist."
});

checks.push({
  name: "has_real_source_links",
  passed: client.includes("https://sayouth.mobi/") && client.includes("https://essa.labour.gov.za/EssaOnline/WebBeans/") && client.includes("https://www.nyda.gov.za/"),
  detail: "Real source links must exist."
});

checks.push({
  name: "no_fake_submission_claim",
  passed: !client.toLowerCase().includes("auto submit"),
  detail: "Interface must not claim unsafe auto-submit."
});

const authFiles = {
  helper: "apps/web/src/lib/supabase-auth.ts",
  login: "apps/web/src/app/api/auth/login/route.ts",
  register: "apps/web/src/app/api/auth/register/route.ts",
  session: "apps/web/src/app/api/auth/session/route.ts",
  page: "apps/web/src/app/sign-in/page.tsx",
  identityMigration: "db/migrations/0023_candidate_auth_private_storage.sql",
  readPolicyMigration: "db/migrations/0024_candidate_owned_application_document_reads.sql",
  explicitBindingMigration: "db/migrations/0025_explicit_candidate_identity_binding.sql",
  verifiedBindingMigration: "db/migrations/0026_require_verified_candidate_identity.sql",
  provisioningScript: "scripts/provision-candidate-auth.mjs",
  provisioningRunbook: "docs/security/candidate-identity-provisioning.md",
  durableStateMigration: "db/migrations/0027_candidate_portal_durable_state.sql",
  durableStorageHelper: "apps/web/src/lib/candidate-portal-storage.ts"
};
for (const [name, file] of Object.entries(authFiles)) {
  checks.push({
    name: `candidate_auth_file:${name}`,
    passed: fs.existsSync(path.join(root, file)),
    detail: `Candidate authentication artifact must exist: ${file}`
  });
}

const authHelper = readTextIfExists(authFiles.helper);
const loginRoute = readTextIfExists(authFiles.login);
const registerRoute = readTextIfExists(authFiles.register);
const identityMigration = readTextIfExists(authFiles.identityMigration);
const documentPolicyMigration = readTextIfExists(authFiles.readPolicyMigration);
const explicitBindingMigration = readTextIfExists(authFiles.explicitBindingMigration);
const verifiedBindingMigration = readTextIfExists(authFiles.verifiedBindingMigration);
const provisioningScript = readTextIfExists(authFiles.provisioningScript);
const provisioningRunbook = readTextIfExists(authFiles.provisioningRunbook);
const durableStateMigration = readTextIfExists(authFiles.durableStateMigration);
const durableStorageHelper = readTextIfExists(authFiles.durableStorageHelper);

checks.push({
  name: "auth_session_uses_http_only_cookie_and_no_store",
  passed: authHelper.includes("httpOnly") || (loginRoute.includes("httpOnly") && authHelper.includes("kingsmen-access-token")),
  detail: "Candidate session token must be held in an HTTP-only cookie."
});
checks.push({
  name: "auth_user_lookup_fails_closed_on_timeout_and_invalid_cookie",
  passed: authHelper.includes("AbortSignal.timeout(AUTH_LOOKUP_TIMEOUT_MS)") &&
    authHelper.includes("return { configured: true as const, user: null };") &&
    authHelper.includes("token.length > 8_192") &&
    authHelper.includes('parsed.protocol !== "https:"'),
  detail: "Session lookup must reject oversized/malformed tokens, require HTTPS in production, and fail closed on Auth timeouts."
});

checks.push({
  name: "auth_routes_require_supabase_public_configuration",
  passed: loginRoute.includes("supabaseAuthConfig()") && registerRoute.includes("supabaseAuthConfig()") &&
    loginRoute.includes("AUTH_NOT_CONFIGURED") && registerRoute.includes("AUTH_NOT_CONFIGURED"),
  detail: "Sign-in and registration must fail closed when Supabase Auth is not configured."
});
checks.push({
  name: "registration_does_not_auto_link_existing_candidate_by_email",
  passed: registerRoute.includes("Do not auto-link a Supabase identity") &&
    identityMigration.includes("no email-based auto-linking"),
  detail: "Account registration must not claim an existing candidate record by email."
});
checks.push({
  name: "candidate_identity_binding_is_explicit_and_privileged",
  passed: explicitBindingMigration.includes("FUNCTION kingsmen_security.bind_candidate_auth_user") &&
    explicitBindingMigration.includes("REVOKE ALL ON FUNCTION kingsmen_security.bind_candidate_auth_user(uuid, uuid) FROM PUBLIC") &&
    explicitBindingMigration.includes("FROM anon") &&
    explicitBindingMigration.includes("FROM authenticated") &&
    explicitBindingMigration.includes("TO service_role") &&
    explicitBindingMigration.includes("never matches by email") &&
    explicitBindingMigration.includes("already linked"),
  detail: "Candidate/Auth identity linking must require trusted service-role provisioning, reject reassignment, and never match by email."
});

checks.push({
  name: "candidate_binding_requires_verified_auth_identity",
  passed: verifiedBindingMigration.includes("u.email_confirmed_at") &&
    verifiedBindingMigration.includes("Auth identity must have a verified email") &&
    verifiedBindingMigration.includes("FROM anon") &&
    verifiedBindingMigration.includes("FROM authenticated") &&
    verifiedBindingMigration.includes("TO service_role"),
  detail: "Trusted identity binding must require a confirmed Auth email and remain service-role-only."
});

checks.push({
  name: "candidate_provisioning_is_operator_only_and_secret_safe",
  passed: provisioningScript.includes("SUPABASE_SERVICE_ROLE_KEY") &&
    provisioningScript.includes("AbortSignal.timeout(10_000)") &&
    provisioningScript.includes('base.protocol !== "https:"') &&
    provisioningScript.includes("BINDING_REQUEST_ACCEPTED") &&
    !provisioningScript.includes("console.log(serviceRoleKey)") &&
    provisioningRunbook.includes("no public HTTP endpoint") &&
    provisioningRunbook.includes("two distinct verified test accounts"),
  detail: "Provisioning must be an HTTPS-only operator CLI, keep service credentials out of logs, and document remaining isolation proof."
});

checks.push({
  name: "private_storage_and_candidate_owned_policies_defined",
  passed: identityMigration.includes("'candidate-documents'") &&
    identityMigration.includes("candidate_documents_select_own") &&
    identityMigration.includes("candidate_documents_insert_own") &&
    documentPolicyMigration.includes("document_files_authenticated_own_account_read"),
  detail: "Candidate documents must use a private bucket and account-scoped policies."
});

checks.push({
  name: "private_document_download_requires_owner_authentication",
  passed: readTextIfExists("apps/web/src/app/api/personal-jobs/apply-now/documents/[documentId]/route.ts").includes("getPortalContext()") &&
    readTextIfExists("apps/web/src/app/api/personal-jobs/apply-now/documents/[documentId]/route.ts").includes("loadCandidatePortalState") &&
    readTextIfExists("apps/web/src/app/api/personal-jobs/apply-now/documents/[documentId]/route.ts").includes("storage/v1/object/authenticated") &&
    readTextIfExists("apps/web/src/app/api/personal-jobs/apply-now/documents/[documentId]/route.ts").includes("private, no-store") &&
    client.includes("/api/personal-jobs/apply-now/documents/"),
  detail: "Document downloads must resolve only metadata belonging to the authenticated candidate and use private, non-cacheable responses."
});

checks.push({
  name: "candidate_document_bucket_is_forced_private",
  passed: readTextIfExists("db/migrations/0028_harden_candidate_document_storage.sql").includes("SET public = false") &&
    readTextIfExists("db/migrations/0028_harden_candidate_document_storage.sql").includes("candidate_documents_select_own") &&
    readTextIfExists("db/migrations/0028_harden_candidate_document_storage.sql").includes("candidate_documents_insert_own") &&
    readTextIfExists("db/migrations/0028_harden_candidate_document_storage.sql").includes("candidate-documents"),
  detail: "Storage bucket configuration must explicitly enforce private access and user-folder policies."
});

checks.push({
  name: "durable_candidate_state_is_user_scoped_by_rls",
  passed: durableStateMigration.includes("CREATE TABLE IF NOT EXISTS public.candidate_portal_state") &&
    durableStateMigration.includes("ENABLE ROW LEVEL SECURITY") &&
    durableStateMigration.includes("FORCE ROW LEVEL SECURITY") &&
    durableStateMigration.includes("auth_user_id = (SELECT auth.uid())") &&
    durableStateMigration.includes("FROM PUBLIC, anon") &&
    durableStateMigration.includes("GRANT SELECT, INSERT, UPDATE ON public.candidate_portal_state TO authenticated"),
  detail: "Durable portal state must be protected by row-level policies and deny anonymous access."
});

checks.push({
  name: "apply_now_uses_authenticated_supabase_state_and_private_uploads",
  passed: durableStorageHelper.includes("getCandidateAuthUser()") &&
    durableStorageHelper.includes("candidate_portal_state") &&
    durableStorageHelper.includes("candidate-documents") &&
    durableStorageHelper.includes("AbortSignal.timeout") &&
    api.includes("getCandidatePortalContext()") &&
    api.includes("loadCandidatePortalState") &&
    api.includes("saveCandidatePortalState") &&
    api.includes("uploadCandidatePortalDocument") &&
    api.includes("AUTHENTICATION_REQUIRED") &&
    api.includes("STORAGE_UNAVAILABLE"),
  detail: "Production candidate state and document bytes must use the authenticated Supabase API and private storage."
});

const failed = checks.filter((x) => !x.passed);

const report = {
  schema: "kingsmen.today.apply-now.validation.v1",
  status: failed.length === 0 ? "VALIDATED" : "FAILED",
  passed: failed.length === 0,
  generatedAt: new Date().toISOString(),
  route: "/personal-job-desk/apply-now",
  checks,
  failed,
  nextAction: failed.length === 0 ? "Run npm/dev server and open /personal-job-desk/apply-now." : "Repair failed checks."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (failed.length > 0) process.exit(1);