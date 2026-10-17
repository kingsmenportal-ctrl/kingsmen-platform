import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const service = readFileSync(resolve(root,"apps/api/src/candidate/candidate-document-vault.ts"),"utf8");
const runtime = readFileSync(resolve(root,"apps/api/src/candidate/candidate-document-vault-runtime.ts"),"utf8");
const migration = readFileSync(resolve(root,"db/migrations/0019_n21_candidate_document_vault.sql"),"utf8");
const checks = [
  ["verified identity mapping required", /link\.link_status = 'VERIFIED'/.test(service)],
  ["active candidate required", /candidate\.is_active = true/.test(service)],
  ["document is joined to mapped candidate", /document\.candidate_id = candidate\.id/.test(service)],
  ["bounded metadata listing", /limit 200/i.test(service)],
  ["storage locator never returned in summary", /storageObjectKey/.test(service) && /CandidateDocumentSummary/.test(service)],
  ["runtime uses trusted backend transaction", /withCandidateBackendTransaction\(this\.pool/.test(runtime)],
  ["private backend-only RLS", /kingsmen_security\.is_backend_service_role\(\)/.test(migration)],
  ["no public URL column", !/public_url|signed_url/i.test(migration)]
];
let failed=false;
for(const [label,ok] of checks){console.log(`${ok?"PASS":"FAIL"} ${label}`);if(!ok)failed=true;}
if(failed)process.exitCode=1;
