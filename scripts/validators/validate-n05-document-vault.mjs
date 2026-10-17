#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const reportPath = join(root, "reports/n05/n05-document-vault-validation-latest.json");
const files = {
  runtime: "apps/web/src/lib/candidate-document-runtime.ts",
  upload: "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  complete: "apps/web/src/app/api/candidate/documents/complete/route.ts",
  read: "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  status: "apps/web/src/app/api/candidate/documents/status/route.ts",
  client: "apps/web/src/app/candidate/documents/DocumentVaultClient.tsx",
  page: "apps/web/src/app/candidate/documents/page.tsx"
};
const content = {};
const checks = [];
function check(name, passed, detail = "") { checks.push({ name, passed: Boolean(passed), detail }); }
for (const [key, rel] of Object.entries(files)) {
  const full = join(root, rel);
  const exists = existsSync(full);
  check(`file_exists:${rel}`, exists, rel);
  if (exists) content[key] = readFileSync(full, "utf8");
}
function includes(key, token, name = token) {
  check(`${key}:contains:${name}`, content[key]?.includes(token), files[key] + " :: " + name);
}
function excludes(key, token, name = token) {
  check(`${key}:excludes:${name}`, !content[key]?.includes(token), files[key] + " :: " + name);
}

// Session and identity are resolved server-side from the verified auth subject.
includes("runtime", "/auth/v1/user", "verify Supabase access token");
includes("runtime", "candidate_accounts", "resolve candidate mapping");
includes("runtime", "auth_user_id", "map by authenticated user ID");
includes("runtime", "mappings.length !== 1", "reject missing or ambiguous identity mappings");
includes("runtime", "SUPABASE_SERVICE_ROLE_KEY", "server-only service role configuration");
includes("runtime", "cache: \"no-store\"", "disable caching for privileged requests");

// Upload constraints, opaque candidate scope, and private storage configuration.
includes("upload", "MAX_UPLOAD_BYTES = 10 * 1024 * 1024", "10 MiB upload cap");
includes("upload", "DOCUMENT_TYPE_MIME_NOT_ALLOWED", "document type allowlist");
includes("upload", "FILENAME_MIME_MISMATCH", "filename extension validation");
includes("upload", "verifyPrivateDocumentsBucket", "verify bucket privacy and policy");
includes("upload", "SIGNED_UPLOAD_CREATED", "audit signed upload issuance");
includes("upload", "UPLOAD_AUDIT_FAILED", "fail closed if upload audit fails");
includes("runtime", "bucket.public === false", "bucket must be private");
includes("runtime", "configuredLimit === 10 * 1024 * 1024", "exact bucket size limit");
includes("runtime", "requiredMimeTypes.every", "bucket MIME policy");

// Completion validates stored bytes before recording the canonical document record.
includes("complete", "verifyStoredDocumentSignature", "verify stored bytes");
includes("complete", "UPLOADED_OBJECT_NOT_FOUND", "reject completion before upload");
includes("complete", "DOCUMENT_RECORD_NOT_CONFIRMED", "require persisted document row");
includes("complete", "UPLOAD_COMPLETED", "audit completion");
includes("complete", "resolution=ignore-duplicates,return=minimal", "idempotent completion audit");
includes("runtime", "bytes.byteLength !== expectedSizeBytes", "verify actual byte count");
includes("runtime", "createHash(\"sha256\")", "calculate SHA-256 from stored bytes");
includes("complete", "checksum_sha256: signature.checksumSha256", "persist SHA-256 with document evidence");
includes("runtime", "%PDF-", "PDF signature check");
includes("runtime", "valid UTF-8", "text encoding validation");

// Read/status requests are always owner-scoped; links are temporary and audited.
includes("read", "candidate_id", "candidate-scoped document lookup");
includes("read", "archived_at", "exclude archived documents");
includes("read", "expiresIn: 600", "10-minute signed read URL");
includes("read", "FILE_ACCESSED", "audit signed read");
includes("read", "DOCUMENT_READ_AUDIT_FAILED", "fail closed on read audit");
includes("status", "candidate_id", "candidate-scoped status queries");
includes("status", "archived_at", "exclude archived documents");
includes("status", "candidateCanVerify: false", "candidate cannot verify documents");
includes("status", "candidateCanReject: false", "candidate cannot reject documents");
includes("client", "authorization: `Bearer ${token}`", "authenticated browser requests");
includes("client", "method: \"POST\"", "signed upload HTTP method");
includes("client", "10 * 1024 * 1024", "client-side upload cap");
includes("page", "does not mark a document verified", "honest pending-review UX");

// Fail-closed / non-production assertions: these are intentional until staging proof.
includes("upload", "productionReady: false", "do not claim production readiness");
includes("complete", "productionReady: false", "do not claim production readiness");
includes("status", "productionReady: false", "do not claim production readiness");
excludes("upload", "public: true", "never make the bucket public");
excludes("read", "getPublicUrl", "never issue public storage URLs");
excludes("client", "SUPABASE_SERVICE_ROLE_KEY", "never expose service role key to browser");

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: "kingsmen.n05.document-vault-static-validation.v1",
  module: "N05 Candidate Document Vault",
  status: failed.length ? "BUILT_PENDING_VALIDATION" : "STATIC_GUARDS_PASSED",
  passed: failed.length === 0,
  productionReady: false,
  evidenceType: "static source guard only; not a build, deployment, or authenticated integration test",
  generatedAtIso: new Date().toISOString(),
  summary: { checks: checks.length, failed: failed.length },
  failedChecks: failed,
  checks,
  blocker: "Staging authenticated end-to-end proof requires the Netlify server-side SUPABASE_SERVICE_ROLE_KEY and two dedicated staging candidate accounts.",
  nextAction: failed.length
    ? "Repair failed source guards, then run this validator again."
    : "Run the web TypeScript/build checks, deploy staging after the secret is configured, and execute the authenticated two-candidate isolation test."
};
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
process.exitCode = failed.length ? 1 : 0;
