#!/usr/bin/env node
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
const root = process.cwd();
const targets = {
  profileRoute: "apps/web/src/app/api/candidate/profile/route.ts",
  identityRoute: "apps/web/src/app/api/candidate/identity/route.ts",
  profilePage: "apps/web/src/app/candidate/profile/page.tsx",
  profileClient: "apps/web/src/app/candidate/profile/ProfileClient.tsx",
  authRuntime: "apps/web/src/lib/candidate-document-runtime.ts",
  migration: "db/migrations/0059_n04_profile_runtime_audit.sql",
  dashboard: "apps/web/src/app/candidate/dashboard/page.tsx"
};
const checks = [], content = {};
function check(name, ok, detail = "") { checks.push({ name, passed: Boolean(ok), detail }); }
for (const [key, path] of Object.entries(targets)) {
  const full = join(root, path), exists = existsSync(full);
  check(`exists:${path}`, exists, path);
  if (exists) content[key] = readFileSync(full, "utf8");
}
function has(key, token, name = token) { check(`${key}:${name}`, content[key]?.includes(token), targets[key]); }
function lacks(key, token, name = token) { check(`${key}:not:${name}`, !content[key]?.includes(token), targets[key]); }
has("authRuntime", "/auth/v1/user", "validates Supabase user session");
has("authRuntime", "auth_user_id", "resolves candidate via authenticated user id");
has("authRuntime", "mappings.length !== 1", "rejects missing or ambiguous identity mapping");
has("profileRoute", "candidate_profile_field_sources", "reads candidate-owned field evidence");
has("profileRoute", "candidate_profile_change_requests", "persists correction requests");
has("profileRoute", "candidate_profile_access_audit", "audits private profile access");
has("profileRoute", "DIRECT_PROFILE_MUTATION_DISABLED", "blocks direct profile overwrite");
has("profileRoute", "sensitivity", "classifies sensitive changes");
has("profileRoute", "PROFILE_FIELDS.includes", "field allowlist");
has("identityRoute", "identityLinkMethod", "reports explicit identity-link method");
has("identityRoute", "emailEqualityAloneCanLink: false", "email equality is not identity proof");
has("identityRoute", "IDENTITY_MUTATION_DISABLED", "blocks self-verification");
has("profileClient", "/api/candidate/profile", "profile UI connected to API");
has("profileClient", "/api/candidate/identity", "identity UI connected to API");
has("profileClient", "Submit correction for review", "correction workflow available");
has("migration", "candidate_profile_access_audit", "privacy access audit schema");
has("migration", "prevent_candidate_profile_audit_mutation", "append-only audit guard");
has("migration", "ADD COLUMN IF NOT EXISTS auth_user_id", "identity mapping schema");
has("dashboard", "/candidate/profile", "dashboard links profile route");
lacks("profileClient", "SUPABASE_SERVICE_ROLE_KEY", "no privileged key in browser");
const failed = checks.filter(x => !x.passed);
const report = { schema: "kingsmen.n04.profile-runtime-validation.v1", module: "N04 Candidate Profile and Identity Runtime", status: failed.length ? "BUILT_PENDING_VALIDATION" : "STATIC_SOURCE_CHECKS_PASSED", productionReady: false, checks, passed: checks.length - failed.length, failed: failed.length, failures: failed };
const reportPath = join(root, "reports/n04/n04-profile-runtime-validation-latest.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
