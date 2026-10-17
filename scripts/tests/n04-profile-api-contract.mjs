#!/usr/bin/env node
const base = (process.env.N04_BASE_URL || "").trim().replace(/\/+$/, "");
const token = (process.env.N04_CANDIDATE_TOKEN || "").trim();
if (!base) { console.error("BLOCKED: set N04_BASE_URL to an authorised staging origin."); process.exit(2); }
if (!token) { console.error("BLOCKED: set N04_CANDIDATE_TOKEN to a dedicated synthetic staging candidate session."); process.exit(2); }
const headers = { authorization: `Bearer ${token}` };
async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) }, cache: "no-store" });
  return { status: response.status, body: await response.json().catch(() => null) };
}
const checks = [];
function check(name, passed, detail = "") { checks.push({ name, passed: Boolean(passed), detail }); }
const identity = await request("/api/candidate/identity");
check("identity endpoint returns authenticated candidate", identity.status === 200 && identity.body?.ok === true && identity.body?.identity?.identityLinkVerified === true, `status=${identity.status}`);
check("identity link not based on email equality", identity.body?.rules?.emailEqualityAloneCanLink === false, "identity-link rule");
const profile = await request("/api/candidate/profile");
check("profile read succeeds", profile.status === 200 && profile.body?.ok === true, `status=${profile.status}`);
check("profile cannot directly overwrite canonical truth", profile.body?.rules?.candidateCanDirectlyOverwriteTruth === false, "profile write boundary");
const directMutation = await request("/api/candidate/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ fieldName: "email", requestedValue: "not-a-write@example.invalid" }) });
check("direct profile mutation denied", directMutation.status === 405 && directMutation.body?.code === "DIRECT_PROFILE_MUTATION_DISABLED", `status=${directMutation.status}`);
const protectedField = await request("/api/candidate/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fieldName: "payment_status", requestedValue: "PAID", reason: "attempt to alter a protected official field" }) });
check("protected official field correction denied", protectedField.status === 400 && protectedField.body?.code === "FIELD_NOT_ALLOWED", `status=${protectedField.status}`);
const failures = checks.filter(item => !item.passed);
const report = { schema: "kingsmen.n04.profile-api-contract.v1", status: failures.length ? "FAIL" : "PASS", productionReady: false, checks, failures };
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
