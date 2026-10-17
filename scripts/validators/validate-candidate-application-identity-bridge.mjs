import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read=(p)=>readFileSync(resolve(process.cwd(),p),"utf8");
const repository=read("apps/api/src/db/truth-vault-repository.ts");
const server=read("apps/api/src/server.ts");
const web=read("apps/web/src/app/api/candidate/applications/route.ts");
const checks=[
["Supabase identity UUID format validated",/listApplicationsForVerifiedSupabaseUser[\s\S]*?test\(supabaseUserId\)/.test(repository)],
["identity link must be verified and candidate active",/link\.link_status = 'VERIFIED'[\s\S]*?c\.is_active = true/.test(repository)],
["identity resolution does not use email",/listApplicationsForVerifiedSupabaseUser[\s\S]*?where link\.supabase_user_id = \$1::uuid/.test(repository)],
["identity read uses transaction-local backend context",/listApplicationsForVerifiedSupabaseUser[\s\S]*?BEGIN[\s\S]*?set_config\('app\.kingsmen_role', \$1, true\)[\s\S]*?COMMIT/.test(repository)],
["internal route uses service credential",/handleInternalCandidateApplications[\s\S]*?KINGSMEN_WEB_INTERNAL_API_KEY[\s\S]*?timingSafeEqual/.test(server)],
["internal route is POST-only",/pathname === "\/api\/internal\/candidate\/applications"[\s\S]*?method !== "POST"/.test(server)],
["web route validates Supabase session server-side",/getVerifiedAuthUser\(\)/.test(web)],
["web route calls internal API without browser-supplied identity",/KINGSMEN_API_BASE_URL[\s\S]*?X-Kingsmen-Internal-Key[\s\S]*?JSON\.stringify\(\{ supabaseUserId: user\.id \}\)/.test(web)],
["web route fails closed when service configuration is missing",/APPLICATION_SERVICE_NOT_CONFIGURED/.test(web)],
["responses are not cached",/Cache-Control": "no-store, private"/.test(web)]
];
let failed=false;
for(const [label,passed] of checks){console.log(`${passed?"PASS":"FAIL"} ${label}`);if(!passed)failed=true;}
if(failed)process.exitCode=1;
