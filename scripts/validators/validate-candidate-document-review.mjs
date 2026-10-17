import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root=process.cwd();
const review=readFileSync(resolve(root,"apps/api/src/candidate/candidate-document-review.ts"),"utf8");
const runtime=readFileSync(resolve(root,"apps/api/src/candidate/candidate-document-review-runtime.ts"),"utf8");
const checks=[
["action-specific permission checks",/candidate\.documents\.accept/.test(review)&&/candidate\.documents\.reject/.test(review)],
["optimistic expected-state transition",/document_status = \$5/.test(review)],
["audit in same operation",/insert into public\.audit_events/.test(review)],
["audit contains correlation and actor",/correlation_id, actor_id, candidate_id/.test(review)],
["audit failure remains fatal",/await db\.query\([\s\S]*insert into public\.audit_events/.test(review)],
["runtime owns trusted transaction",/withCandidateBackendTransaction\(this\.pool/.test(runtime)],
["no request-supplied principal construction",!/request\.body|headers\./i.test(runtime)]
];
let failed=false;
for(const [name,ok] of checks){console.log(`${ok?"PASS":"FAIL"} ${name}`);if(!ok)failed=true;}
if(failed)process.exitCode=1;
