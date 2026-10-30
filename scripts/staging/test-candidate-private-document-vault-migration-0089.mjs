import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "db/migrations/0089_secure_candidate_private_document_vault_workflows.sql"),
  "utf8"
);
const edge = fs.readFileSync(
  path.join(root, "supabase/functions/candidate-private-documents/index.ts"),
  "utf8"
);
const proxy = fs.readFileSync(
  path.join(root, "apps/web/src/lib/candidate-document-vault-proxy.ts"),
  "utf8"
);
const parser = fs.readFileSync(
  path.join(root, "apps/web/src/lib/read-limited-json.ts"),
  "utf8"
);
const routes = {
  upload: fs.readFileSync(path.join(root, "apps/web/src/app/api/candidate/documents/upload-url/route.ts"), "utf8"),
  finalize: fs.readFileSync(path.join(root, "apps/web/src/app/api/candidate/documents/finalize/route.ts"), "utf8"),
  read: fs.readFileSync(path.join(root, "apps/web/src/app/api/candidate/documents/read-url/route.ts"), "utf8"),
  list: fs.readFileSync(path.join(root, "apps/web/src/app/api/candidate/documents/status/route.ts"), "utf8")
};

const checks = [
  [migration.includes("add column if not exists document_type text not null default 'OTHER'"), "document type migration is additive and backward-compatible"],
  [migration.includes("candidate_private_documents_document_type_check"), "document types are constrained"],
  [migration.includes("l.link_status = 'VERIFIED'"), "upload RPC requires a verified identity link"],
  [migration.includes("l.verified_at <= clock_timestamp()"), "upload RPC rejects future verification timestamps"],
  [migration.includes("l.verified_by ~*"), "upload RPC requires a reviewer UUID"],
  [migration.includes("p_storage_path is distinct from"), "upload storage path is exactly owner/document/type bound"],
  [migration.includes("p_actual_size_bytes <> v_doc.size_bytes"), "finalization checks actual size against declared size"],
  [migration.includes("p_sha256_hex !~ '^[0-9a-f]{64}$'"), "finalization validates SHA-256 form"],
  [migration.includes("p_signature_valid is distinct from true"), "finalization fails closed on MIME signature mismatch"],
  [migration.includes("v_doc.status in ('UPLOADED_CANDIDATE_REPORTED','UNDER_REVIEW','VERIFIED')"), "same-content finalized retries are idempotent"],
  [migration.includes("'UPLOAD_CONFIRMED'"), "finalization persists an audit event in the same transaction"],
  [migration.includes("p_link_lifetime_seconds < 30 or p_link_lifetime_seconds > 300"), "read-link audit enforces bounded expiry"],
  [migration.includes("'READ_LINK_ISSUED'"), "signed-link issuance has a durable audit event"],
  [migration.includes("revoke all on function public.create_candidate_private_document_upload_request"), "upload RPC privileges are explicitly revoked"],
  [migration.includes("revoke all on function public.finalize_candidate_private_document_upload"), "finalization RPC privileges are explicitly revoked"],
  [migration.includes("revoke all on function public.record_candidate_private_document_read_link"), "read-link RPC privileges are explicitly revoked"],
  [migration.includes("to service_role;"), "internal workflow RPCs are granted only to service role"],
  [edge.includes('case "upload-url"') && edge.includes('case "finalize-upload"') && edge.includes('case "read-url"'), "deployed-source action contract is explicit"],
  [edge.includes("create_candidate_private_document_upload_request") && edge.includes("finalize_candidate_private_document_upload") && edge.includes("record_candidate_private_document_read_link"), "edge function uses the migration's RPC contract"],
  [edge.includes("resolveCandidate") && edge.includes("link_status") && edge.includes("verified_at"), "edge function resolves candidate from verified identity rather than request body"],
  [edge.includes("actualSize !== undefined") === false, "no false positive size-check token is used"],
  [edge.includes("isAllowedDocumentSignature") && edge.includes("sha256Hex"), "edge function checks bytes and computes a digest"],
  [proxy.includes("readLimitedJson(request, MAX_JSON_BYTES)"), "web proxy enforces bounded JSON"],
  [proxy.includes("AUTHENTICATION_REQUIRED") && proxy.includes("authorization"), "web proxy requires a bearer session"],
  [proxy.includes("cache: \"no-store\"") && proxy.includes("redirect: \"error\""), "web proxy disables caching and refuses redirects"],
  [proxy.includes("SUPABASE_SERVICE_ROLE_KEY") === false, "service-role secret is not referenced by the web proxy"],
  [parser.includes("await reader.cancel()"), "oversized incoming streams are cancelled"],
  [parser.includes('new TextDecoder("utf-8", { fatal: true })'), "invalid UTF-8 fails closed"],
  [Object.values(routes).every(source => source.includes("proxyCandidateDocumentVault")), "all document endpoints use the secured proxy"],
  [Object.values(routes).every(source => source.includes('runtime = "nodejs"') && source.includes('dynamic = "force-dynamic"')), "document endpoints run dynamically on Node"],
];

for (const [passed, description] of checks) assert.ok(passed, description);
console.log(`PASS candidate Document Vault migration/proxy boundary (${checks.length} assertions)`);
