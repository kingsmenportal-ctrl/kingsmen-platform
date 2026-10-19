import fs from "node:fs";

const required = [
  "db/migrations/0010_candidate_workspace_persistence.sql",
  "apps/web/src/lib/candidate-workspace-server.ts",
  "apps/web/src/lib/candidate-workspace-client.ts",
  "apps/web/src/app/api/candidate/workspace/route.ts",
  "apps/web/src/app/candidate/dashboard/page.tsx",
  "apps/web/src/components/saved-opportunities-client.tsx"
];
const failures = [];
for (const file of required) if (!fs.existsSync(file)) failures.push(`Missing ${file}`);

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const migration = read("db/migrations/0010_candidate_workspace_persistence.sql");
const server = read("apps/web/src/lib/candidate-workspace-server.ts");
const route = read("apps/web/src/app/api/candidate/workspace/route.ts");
const dashboard = read("apps/web/src/app/candidate/dashboard/page.tsx");
const saved = read("apps/web/src/components/saved-opportunities-client.tsx");

for (const token of [
  "candidate_auth_identities", "reviewed_at", "reviewed_by", "candidate_workspace_readiness",
  "candidate_saved_opportunities", "ENABLE ROW LEVEL SECURITY", "auth.uid()",
  "candidate_workspace_readiness_update_own", "candidate_saved_opportunities_delete_own"
]) if (!migration.includes(token)) failures.push(`Migration missing ownership/security invariant: ${token}`);

for (const token of [
  "/auth/v1/user", "SUPABASE_SERVICE_ROLE_KEY", "link_status=eq.ACTIVE",
  "reviewed_at=not.is.null", "Your account is not linked", "cache: \"no-store\""
]) if (!server.includes(token)) failures.push(`Server identity boundary missing: ${token}`);
if (/user\.email\s*===?|email\s*===?\s*.*candidate/i.test(server)) failures.push("Identity must never be linked by email matching.");
if (server.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY")) failures.push("Service role key must never use a public environment variable.");

for (const token of ["resolveReviewedCandidate", "candidate_id: candidateId", "candidate_saved_opportunities", "candidate_workspace_readiness", "candidateId"]) {
  if (!route.includes(token)) failures.push(`API route missing ownership/persistence control: ${token}`);
}
for (const token of ["candidateWorkspaceRequest", '"PATCH"', "Truth Vault"]) {
  if (!dashboard.includes(token)) failures.push(`Dashboard sync missing: ${token}`);
}
for (const token of ["candidateWorkspaceRequest", '"POST"', '"DELETE"', "Truth Vault"]) {
  if (!saved.includes(token)) failures.push(`Saved opportunity sync missing: ${token}`);
}
if (dashboard.includes("It is not yet synced to your Kingsmen account")) failures.push("Dashboard still claims account sync is not implemented.");
if (saved.includes("This shortlist is saved only in this browser")) failures.push("Saved opportunities still claim browser-only persistence.");

if (failures.length) {
  console.error("Candidate workspace persistence validation FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Candidate workspace persistence validation PASSED: reviewed identity binding, owner-scoped Truth Vault APIs, RLS policies, and client sync are present.");
