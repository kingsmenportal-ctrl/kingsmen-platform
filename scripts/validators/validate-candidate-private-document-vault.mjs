import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");
const migration = read("db/migrations/0089_secure_candidate_private_document_vault_workflows.sql");
const edge = read("supabase/functions/candidate-private-documents/index.ts");
const signature = read("supabase/functions/candidate-private-documents/document-signature.mjs");
const proxy = read("apps/web/src/lib/candidate-document-vault-proxy.ts");
const parser = read("apps/web/src/lib/read-limited-json.ts");
const login = read("apps/web/src/app/candidate/login/page.tsx");
const page = read("apps/web/src/app/candidate/documents/page.tsx");

const routes = {
  upload: read("apps/web/src/app/api/candidate/documents/upload-url/route.ts"),
  finalize: read("apps/web/src/app/api/candidate/documents/finalize/route.ts"),
  read: read("apps/web/src/app/api/candidate/documents/read-url/route.ts"),
  status: read("apps/web/src/app/api/candidate/documents/status/route.ts")
};

const checks = [
  [migration.includes("create_candidate_private_document_upload_request") && migration.includes("finalize_candidate_private_document_upload"), "migration includes atomic upload-intent and finalization procedures"],
  [migration.includes("record_candidate_private_document_read_link"), "migration includes audited private-read issuance"],
  [migration.includes("set search_path = ''"), "all SECURITY DEFINER routines pin an empty search path"],
  [migration.includes("from public, anon, authenticated") && migration.includes("to service_role"), "vault RPCs are not executable by client roles"],
  [migration.includes("link_status = 'VERIFIED'") && migration.includes("verified_at <= clock_timestamp()") && migration.includes("verified_by ~*"), "RPCs require a verified, timestamped reviewer-authored identity link"],
  [migration.includes("public.candidate_private_documents") && migration.includes("document_type") && migration.includes("kingsmen-candidate-documents"), "metadata uses canonical private bucket and normalized document type"],
  [migration.includes("UPLOAD_REQUESTED") && migration.includes("UPLOAD_CONFIRMED") && migration.includes("UPLOAD_FAILED") && migration.includes("READ_LINK_ISSUED"), "database workflow writes audit events for request, finalize, failure and read link"],
  [migration.includes("p_size_bytes > 10485760") && migration.includes("p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png')"), "database request guard enforces 10 MiB and allowlisted MIME types"],
  [edge.includes("auth.auth.getUser") && edge.includes("candidate_auth_identity_links"), "Edge Function validates bearer with Supabase Auth and resolves verified identity"],
  [edge.includes("candidate.is_active !== true"), "inactive candidate accounts fail closed"],
  [edge.includes('createSignedUploadUrl(storagePath') && edge.includes("createSignedUrl(doc.storage_path, READ_URL_TTL_SECONDS"), "upload and 60-second read URLs use private Storage APIs"],
  [edge.includes("create_candidate_private_document_upload_request") && edge.includes("finalize_candidate_private_document_upload") && edge.includes("record_candidate_private_document_read_link"), "Edge Function calls the audited database RPCs"],
  [edge.includes("getBucket(DOCUMENT_BUCKET)") && edge.includes("DOCUMENT_STORAGE_NOT_CONFIGURED"), "bucket privacy, size and MIME configuration are checked before issuing upload links"],
  [edge.includes("isAllowedDocumentSignature(bytes, doc.mime_type)") && edge.includes("sha256Hex(bytes)"), "finalization verifies actual file signature and SHA-256"],
  [edge.includes('Cache-Control": "no-store') && edge.includes("SIGNED_LINK_LIFETIME_INVALID"), "responses are no-store and read-link TTL is range-checked in SQL"],
  [proxy.includes("AUTHENTICATION_REQUIRED") && proxy.includes("readLimitedJson") && proxy.includes("cache: \"no-store\""), "web proxy requires bearer auth, bounds JSON and avoids caching"],
  [!proxy.includes("SUPABASE_SERVICE_ROLE_KEY"), "web proxy contains no service-role secret"],
  [parser.includes("await reader.cancel()") && parser.includes('new TextDecoder("utf-8", { fatal: true })'), "request parser cancels oversized bodies and rejects invalid UTF-8"],
  [Object.values(routes).every((r) => r.includes("proxyCandidateDocumentVault")), "all document API routes proxy through the authenticated server-side boundary"],
  [routes.upload.includes("../../../../../lib/candidate-document-vault-proxy"), "upload route resolves its server-only proxy import"],
  [routes.finalize.includes("finalize-upload") && routes.read.includes("read-url") && routes.status.includes('"list"'), "upload finalize, read-link and status endpoints dispatch distinct actions"],
  [login.includes("/auth/v1/token?grant_type=password") && login.includes("/auth/v1/signup") && login.includes("/auth/v1/recover"), "candidate login provides sign-in, registration and recovery"],
  [login.includes('requested.startsWith("/candidate/") && !requested.startsWith("//")'), "post-auth redirects are restricted to candidate routes"],
  [login.includes("does not automatically link you to a candidate record") && login.includes("authorised identity review"), "Auth does not auto-link candidate identity by email"],
  [page.includes("/api/candidate/documents/upload-url") && page.includes("/api/candidate/documents/finalize") && page.includes("/api/candidate/documents/read-url"), "candidate page uses real upload, finalize and read APIs"],
  [page.includes("size > MAX_BYTES") && page.includes("application/pdf") && page.includes("image/jpeg") && page.includes("image/png"), "candidate UI advertises and checks the supported file types and size limit"],
  [signature.includes("export function isAllowedDocumentSignature") && signature.includes("export async function sha256Hex"), "binary validation is isolated for direct regression testing"],
  [!page.includes("candidateId:") && !page.includes("service_role"), "browser does not supply candidate ownership or expose service-role credentials"]
];
for (const [passed, message] of checks) assert.ok(passed, message);
console.log(`PASS private candidate Document Vault source-contract test (${checks.length} assertions).`);
