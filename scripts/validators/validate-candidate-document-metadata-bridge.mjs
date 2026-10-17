import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const repository = read("apps/api/src/db/truth-vault-repository.ts");
const server = read("apps/api/src/server.ts");
const route = read("apps/web/src/app/api/candidate/documents/status/route.ts");
const page = read("apps/web/src/app/candidate/documents/page.tsx");
const checks = [
 ["document query is bound to Supabase Auth UUID", /listDocumentsForVerifiedSupabaseUser[\s\S]*?where ca\.auth_user_id = \$1::uuid/.test(repository)],
 ["document query requires active candidate and excludes archived/deleted rows", /listDocumentsForVerifiedSupabaseUser[\s\S]*?c\.is_active = true[\s\S]*?d\.archived_at is null[\s\S]*?d\.document_status <> 'DELETED'/.test(repository)],
 ["database identity query runs in backend transaction context", /listDocumentsForVerifiedSupabaseUser[\s\S]*?BEGIN[\s\S]*?set_config\('app\.kingsmen_role', \$1, true\)[\s\S]*?COMMIT[\s\S]*?ROLLBACK/.test(repository)],
 ["metadata projection excludes storage path, bucket, and checksum", /listDocumentsForVerifiedSupabaseUser[\s\S]*?select d\.document_ref, d\.document_type, d\.display_name, d\.mime_type,[\s\S]*?d\.extraction_status, d\.uploaded_at/.test(repository) && !/listDocumentsForVerifiedSupabaseUser[\s\S]*?select[\s\S]*?d\.storage_path/.test(repository)],
 ["internal endpoint requires service credential", /handleInternalCandidateDocuments[\s\S]*?KINGSMEN_WEB_INTERNAL_API_KEY[\s\S]*?timingSafeEqual/.test(server)],
 ["internal endpoint is POST-only", /pathname === "\/api\/internal\/candidate\/documents"[\s\S]*?method !== "POST"/.test(server)],
 ["web route verifies Supabase identity server-side", /getVerifiedAuthUser\(\)/.test(route)],
 ["web route fails closed without server service configuration", /DOCUMENT_SERVICE_NOT_CONFIGURED/.test(route)],
 ["web route never accepts candidate or document ownership IDs from query/body", /JSON\.stringify\(\{ supabaseUserId: user\.id \}\)/.test(route) && !/searchParams\.get\(['"]candidateId/.test(route)],
 ["UI renders returned metadata but no file links", /view\.data\.documents[\s\S]*?doc\.displayName[\s\S]*?doc\.verificationStatus/.test(page) && !/href=.*documentRef/.test(page)]
];
let failed = false;
for (const [label, passed] of checks) { console.log(`${passed ? "PASS" : "FAIL"} ${label}`); if (!passed) failed = true; }
if (failed) process.exitCode = 1;
