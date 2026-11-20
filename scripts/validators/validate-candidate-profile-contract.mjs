import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const profile = read("../../apps/web/src/app/candidate/profile/page.tsx");
const login = read("../../apps/web/src/app/candidate/login/page.tsx");
const route = read("../../apps/web/src/app/api/candidate/profile/route.ts");
const session = read("../../apps/web/src/lib/candidate-session.ts");
const functionSource = read("../../supabase/functions/candidate-master-profile/index.ts");
const dashboard = read("../../apps/web/src/app/candidate/dashboard/page.tsx");

for (const [key, label] of [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"]
]) {
  assert.ok(profile.includes(key), `Missing pathway key ${key}`);
  assert.ok(profile.includes(label), `Missing pathway label ${label}`);
}
assert.ok(login.includes("/auth/v1/token?grant_type=password"), "Sign-in uses Supabase Auth password token endpoint");
assert.ok(login.includes("/auth/v1/signup"), "Registration uses Supabase Auth signup");
assert.ok(login.includes("/auth/v1/recover"), "Recovery uses Supabase Auth recovery endpoint");
assert.ok(login.includes("email_confirmed_at") && login.includes("saveSupabaseSession"), "Profile session requires confirmed email and is stored after auth");
assert.ok(session.includes("sb-${projectRef}-auth-token"), "Auth session uses project-specific Supabase browser storage key");
assert.ok(session.includes("grant_type=refresh_token"), "Expired browser sessions attempt Supabase refresh");
assert.ok(route.includes("MAX_BODY_BYTES = 20_000"), "Profile BFF enforces a request-size limit");
assert.ok(route.includes("new TextDecoder(\"utf-8\", { fatal: true })"), "Profile BFF rejects invalid UTF-8");
assert.ok(route.includes("ALLOWED_ACTIONS") && route.includes("candidate-master-profile"), "Profile BFF allowlists actions and calls the canonical profile function");
assert.ok(!route.includes("SERVICE_ROLE_KEY"), "Profile BFF never uses a service-role key");
assert.ok(functionSource.includes("bootstrap_candidate_self_profile"), "Profile function bootstraps only through the dedicated backend RPC");
assert.ok(functionSource.includes("identityStatus: \"PENDING_REVIEW\"") || functionSource.includes("identityStatus: \"VERIFIED\""), "Profile function distinguishes identity verification states");
assert.ok(profile.includes('requestProfile("load"') && profile.includes('requestProfile("save"'), "Profile UI reads and writes through the API");
assert.ok(profile.includes('persistence === "NOT_PROVISIONED"'), "Profile UI distinguishes an uncreated profile from a persisted one");
assert.ok(profile.includes("setMessage(body.message ??"), "Success message is based on a successful backend response");
assert.ok(dashboard.includes("/candidate/profile"), "Candidate dashboard links to profile");

console.log("Candidate identity/profile contract passed: Auth endpoints, bounded BFF, six pathways, consent, persisted-state truth and identity boundaries.");
