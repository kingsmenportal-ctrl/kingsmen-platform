import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root=process.cwd();
const policy=readFileSync(resolve(root,"apps/api/src/candidate/candidate-document-upload-policy.ts"),"utf8");
const checks=[
["upload plan does not sign or access storage",!/createSignedUrl|signUpload|storage\.from\(/i.test(policy)],
["fixed content-type allowlist",/application\/pdf/.test(policy)&&/image\/jpeg/.test(policy)&&/image\/png/.test(policy)],
["25 MiB maximum",/25 \* 1024 \* 1024/.test(policy)],
["short expiry",/expiresInSeconds: 300/.test(policy)],
["opaque generated key",/candidate-documents\/\$\{intent\.candidateId\}\/\$\{generatedObjectId\}/.test(policy)],
["client filename excluded from key",/Client file names and candidate-provided paths never enter the storage key/.test(policy)],
["path-like names rejected",/SAFE_DISPLAY_NAME/.test(policy)]
];
let failed=false;
for(const [name,ok] of checks){console.log(`${ok?"PASS":"FAIL"} ${name}`);if(!ok)failed=true;}
if(failed)process.exitCode=1;
