import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("../../apps/web/src/app/candidate/master-application/page.tsx");
const route = read("../../apps/web/src/app/api/candidate/master-application/route.ts");
const schema = read("../../db/migrations/0087_unified_candidate_master_application.sql");
const rpc = read("../../db/migrations/0088_unified_candidate_master_application_rpc.sql");
const workbench = read("../../apps/web/src/app/candidate/workbench/page.tsx");

for (const pathway of ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP", "INTERNSHIP", "APPRENTICESHIP", "EMPLOYMENT", "FUNDING", "ACCOMMODATION", "WIL"]) {
  assert.ok(page.includes(pathway), `UI missing pathway: ${pathway}`);
  assert.ok(schema.includes(pathway), `Database constraint missing pathway: ${pathway}`);
}
assert.ok(page.includes("One master application"), "Unified application heading missing");
assert.ok(page.includes("Save my one master application"), "Master save action missing");
assert.ok(page.includes("consent"), "Explicit consent control missing");
assert.ok(page.includes("provider submission: not sent"), "UI must distinguish planning from provider submission");
assert.ok(route.includes("/auth/v1/user"), "API must validate Supabase Auth bearer token");
assert.ok(route.includes("rpc/save_candidate_master_application"), "API must use the transactional database RPC");
assert.ok(!route.includes("service_role"), "Browser/API source must not depend on a service-role key");
assert.ok(schema.includes("enable row level security"), "All master application tables require RLS");
assert.ok(schema.includes("kingsmen_security.current_authenticated_candidate_id()"), "RLS must bind data to approved candidate identity");
assert.ok(schema.includes("source_confidence text not null default 'UNVERIFIED'"), "Candidate-entered sources must default to unverified");
assert.ok(schema.includes("unique (candidate_id, target_key)"), "Targets must not duplicate on repeat saves");
assert.ok(rpc.includes("security invoker"), "Save RPC must respect caller RLS");
assert.ok(rpc.includes("provider_submissions_sent',0"), "RPC must never claim provider submission");
assert.ok(rpc.includes("on conflict (candidate_id, target_key) do update"), "Repeated saves must upsert targets");
assert.ok(workbench.includes("/candidate/master-application"), "Candidate workbench must link to master application");
console.log("PASS: unified master application static contract checks");
