import assert from "node:assert/strict";
import { validateProviderScoutPlan, detectProviderPageBlocker, isSensitiveUrl } from "./provider-scout-policy.mjs";

const now = new Date().toISOString();
const validSource = {
  id: "sa-university-public",
  providerId: "sample-university",
  providerName: "Sample University",
  pathway: "higher_education",
  authorityType: "official_provider_website",
  officialSourceUrl: "https://admissions.example.ac.za/apply",
  allowedHosts: ["admissions.example.ac.za"],
  accessMode: "public_read_only",
  approved: true,
  approvedBy: "founder-test",
  approvalEvidenceRef: "test-evidence://founder-approval",
  approvedAt: now,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};
const plan = { schema: "kingsmen.provider-scout-plan.v1", concurrency: 1, maxSources: 25, sources: [validSource] };

assert.equal(validateProviderScoutPlan(plan).valid, true);
assert.equal(validateProviderScoutPlan({ ...plan, concurrency: 2 }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, approved: false }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, accessMode: "authenticated" }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, officialSourceUrl: "http://admissions.example.ac.za/apply" }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, officialSourceUrl: "https://admissions.example.ac.za:8443/apply" }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, expiresAt: new Date(Date.now() - 1000).toISOString() }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, officialSourceUrl: "https://other.example.ac.za/apply" }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, allowedHosts: ["*.example.ac.za"] }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [{ ...validSource, officialSourceUrl: "https://admissions.example.ac.za/apply?access_token=secret" }] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: [validSource, validSource] }).valid, false);
assert.equal(validateProviderScoutPlan({ ...plan, sources: Array.from({ length: 26 }, (_, i) => ({ ...validSource, id: `source-${i}` })) }).valid, false);
assert.equal(detectProviderPageBlocker({ bodyText: "Please complete the CAPTCHA" }), "BLOCKED_BY_CAPTCHA");
assert.equal(detectProviderPageBlocker({ title: "Login required" }), "BLOCKED_BY_LOGIN");
assert.equal(detectProviderPageBlocker({ bodyText: "Welcome to admissions" }), null);
assert.equal(isSensitiveUrl("https://example.ac.za/?session=opaque-secret"), true);
assert.equal(isSensitiveUrl("https://example.ac.za/programmes/2027"), false);

console.log(JSON.stringify({
  schema: "kingsmen.playwright-policy-test.v1",
  status: "PASSED",
  assertions: 17,
  providerSubmissionEnabled: false,
  loginOrCaptchaBypassEnabled: false
}, null, 2));
