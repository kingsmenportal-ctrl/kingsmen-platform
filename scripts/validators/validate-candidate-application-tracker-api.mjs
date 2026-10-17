import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read=(p)=>readFileSync(resolve(process.cwd(),p),"utf8");
const repository=read("apps/api/src/db/truth-vault-repository.ts");
const server=read("apps/api/src/server.ts");
const checks=[
["candidate UUID validated",/listOwnedApplicationsForOwner[\s\S]*?test\(candidateUuid\)/.test(repository)],
["applications filtered by authenticated candidate UUID",/where a\.candidate_id = \$1::uuid/.test(repository)],
["bounded application result",/order by a\.updated_at desc, a\.id asc[\s\S]*?limit 200/.test(repository)],
["server handler requires configured auth and durable storage",/handleCandidateApplications[\s\S]*?if \(!candidateAuthRuntime \|\| !truthVault\.enabled\)/.test(server)],
["server authenticates session cookie before reading",/handleCandidateApplications[\s\S]*?authenticateToken\(token\)[\s\S]*?listOwnedApplicationsForOwner\(principal\.candidateId\)/.test(server)],
["route GET-only",/pathname === "\/api\/candidate\/applications"[\s\S]*?method !== "GET"/.test(server)],
["private no-store response",/handleCandidateApplications[\s\S]*?cache-control", "private, no-store"/.test(server)],
["route inventory published",/GET \/api\/candidate\/applications/.test(server)]
];
let failed=false;
for(const [name,ok] of checks){console.log(`${ok?"PASS":"FAIL"} ${name}`);if(!ok)failed=true;}
if(failed)process.exitCode=1;
