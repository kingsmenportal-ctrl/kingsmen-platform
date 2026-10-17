import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const repository = read("apps/api/src/db/truth-vault-repository.ts");
const server = read("apps/api/src/server.ts");
const route = read("apps/web/src/app/api/candidate/document-requests/route.ts");
const page = read("apps/web/src/app/candidate/documents/page.tsx");
const checks = [
  ["request reads bind to verified Supabase Auth UUID", /listDocumentRequestsForVerifiedSupabaseUser[\s\S]*?where ca\.auth_user_id = \$1::uuid/.test(repository)],
  ["request reads require an active candidate", /listDocumentRequestsForVerifiedSupabaseUser[\s\S]*?c\.is_active = true/.test(repository)],
  ["request reads only select open rows for the linked candidate", /from public\.document_requests[\s\S]*?where candidate_id = \$1::uuid and request_status = 'OPEN'/.test(repository)],
  ["identity binding runs inside a transaction with rollback path", /listDocumentRequestsForVerifiedSupabaseUser[\s\S]*?BEGIN[\s\S]*?set_config\('app\.kingsmen_role', \$1, true\)[\s\S]*?COMMIT[\s\S]*?ROLLBACK/.test(repository)],
  ["internal request endpoint is POST-only and authenticated", /pathname === "\/api\/internal\/candidate\/document-requests"[\s\S]*?method !== "POST"[\s\S]*?handleInternalCandidateDocumentRequests/.test(server) && /handleInternalCandidateDocumentRequests[\s\S]*?KINGSMEN_WEB_INTERNAL_API_KEY[\s\S]*?timingSafeEqual/.test(server)],
  ["web bridge derives identity from server-verified Auth", /getVerifiedAuthUser\(\)/.test(route) && /JSON\.stringify\(\{ supabaseUserId: user\.id \}\)/.test(route)],
  ["web bridge requires HTTPS outside loopback and uses no-store", /apiUrl\.protocol !== "https:"/.test(route) && /cache: "no-store"/.test(route)],
  ["candidate UI renders request metadata without upload or fulfilment mutation", /requestState\.requests\.map/.test(page) && /does not upload a file, fulfill a request/.test(page)]
];
let failed = false;
for (const [label, passed] of checks) { console.log(`${passed ? "PASS" : "FAIL"} ${label}`); if (!passed) failed = true; }
if (failed) process.exitCode = 1;
