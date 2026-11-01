import assert from "node:assert/strict";
import {
  validateScoutTarget,
  validateProbeRequest,
  hostMatchesApproved,
  safeEvidenceUrl,
  classifyPortal,
  proposeAccessibleLocator,
  healthFromStatus,
  handoffFromStatus,
  SCOUT_STATUSES
} from "../agents/institution-browser-scout-policy.mjs";

const target = {
  id: "public-portal",
  name: "Example public institution portal",
  url: "https://apply.example.ac.za/admissions",
  approvedHosts: ["example.ac.za"],
  pathways: ["HIGHER_EDUCATION"],
  tier: "TIER_1",
  enabled: true
};

assert.equal(validateScoutTarget(target).valid, true);
assert.equal(hostMatchesApproved("apply.example.ac.za", ["example.ac.za"]), true);
assert.equal(hostMatchesApproved("example.ac.za.attacker.invalid", ["example.ac.za"]), false);
assert.equal(validateScoutTarget({ ...target, url: "http://example.ac.za" }).valid, false);
assert.equal(validateScoutTarget({ ...target, url: "https://127.0.0.1/" }).valid, false);
assert.equal(validateScoutTarget({ ...target, url: "https://example.ac.za/?token=secret" }).valid, false);
assert.equal(validateScoutTarget({ ...target, url: "https://user:pass@example.ac.za/" }).valid, false);
assert.equal(validateScoutTarget({ ...target, enabled: false }).valid, false);

assert.deepEqual(
  validateProbeRequest({ url: "https://apply.example.ac.za/form", method: "GET", approvedHosts: ["example.ac.za"] }),
  { allowed: true, reason: "ALLOWLISTED_GET" }
);
assert.equal(validateProbeRequest({ url: "https://apply.example.ac.za/form", method: "POST", approvedHosts: ["example.ac.za"] }).allowed, false);
assert.equal(validateProbeRequest({ url: "https://other.invalid/form", method: "GET", approvedHosts: ["example.ac.za"] }).allowed, false);
assert.equal(safeEvidenceUrl("https://apply.example.ac.za/path?candidate=private#step"), "https://apply.example.ac.za/path");
assert.equal(safeEvidenceUrl("https://apply.example.ac.za/users/123456789/profile"), "https://apply.example.ac.za/users/[redacted-number]/profile");

assert.equal(classifyPortal({ httpStatus: 200, bodyText: "Please verify you are human" }), SCOUT_STATUSES.CAPTCHA_REQUIRED);
assert.equal(classifyPortal({ httpStatus: 200, fields: [{ inputType: "text", autoComplete: "one-time-code" }] }), SCOUT_STATUSES.OTP_OR_MFA_REQUIRED);
assert.equal(classifyPortal({ httpStatus: 200, fields: [{ inputType: "text", autoComplete: "one-time-code" }], bodyText: "Enter your verification" }), SCOUT_STATUSES.OTP_OR_MFA_REQUIRED);
assert.equal(classifyPortal({ httpStatus: 200, fields: [{ inputType: "password" }] }), SCOUT_STATUSES.AUTHENTICATION_REQUIRED);
assert.equal(classifyPortal({ httpStatus: 429 }), SCOUT_STATUSES.RATE_LIMITED);
assert.equal(classifyPortal({ httpStatus: 503 }), SCOUT_STATUSES.PORTAL_UNAVAILABLE);
assert.equal(classifyPortal({ httpStatus: 200, structureChanged: true }), SCOUT_STATUSES.MAPPING_DRIFT_REVIEW_REQUIRED);
assert.equal(healthFromStatus(SCOUT_STATUSES.CAPTCHA_REQUIRED), "BLOCKED");
assert.equal(healthFromStatus(SCOUT_STATUSES.MAPPING_DRIFT_REVIEW_REQUIRED), "DEGRADED");
assert.equal(handoffFromStatus(SCOUT_STATUSES.CAPTCHA_REQUIRED), "CANDIDATE_CONTROLLED_HANDOFF");
assert.equal(handoffFromStatus(SCOUT_STATUSES.RATE_LIMITED), "MANUAL_APPLICATION_PACKET");
assert.deepEqual(proposeAccessibleLocator({ label: "Identity number" }),
  { strategy: "getByLabel", value: "Identity number", confidence: "HIGH" });
assert.equal(proposeAccessibleLocator({}).strategy, "manual_review");

console.log(JSON.stringify({
  schema: "kingsmen.institution-browser-scout-policy-tests.v1",
  status: "PASSED",
  passedChecks: 26,
  failedChecks: 0,
  liveNetworkUsed: false,
  liveDatabaseTouched: false,
  candidateDataUsed: false
}, null, 2));
