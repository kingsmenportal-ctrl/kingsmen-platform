import assert from "node:assert/strict";
import {
  canonicalHttpsUrl,
  isWithinAuthority,
  validateN15PromotionPayload,
  validateN15EvidenceReferences,
  canPublishVerifiedOpportunity
} from "../../supabase/functions/_shared/n15-promotion-policy.mjs";

const authority = "https://www.example.ac.za/";
assert.equal(canonicalHttpsUrl("http://example.ac.za"), null);
assert.equal(canonicalHttpsUrl("https://user:pass@example.ac.za"), null);
assert.equal(canonicalHttpsUrl("https://example.ac.za:8443"), null);
assert.equal(isWithinAuthority("https://apply.example.ac.za/form", authority), true);
assert.equal(isWithinAuthority("https://example.ac.za.attacker.invalid/form", authority), false);
assert.equal(isWithinAuthority("https://other.invalid/form", authority), false);
assert.equal(isWithinAuthority("https://127.0.0.1/form", "https://127.0.0.1"), false);
assert.equal(isWithinAuthority("https://localhost/form", "https://localhost"), false);
assert.equal(isWithinAuthority("https://[::1]/form", "https://[::1]"), false);
assert.equal(isWithinAuthority("https://apply.example.ac.za/form", authority), true);

const validPayload = {
  observation_ref: "n15_source_observation_001",
  review_reason: "Official source page checked by verifier",
  decision_notes: "Programme details and provider identity were checked against the official source.",
  provider: {
    provider_ref: "provider_example_001",
    provider_name: "Example University",
    provider_type: "PUBLIC_UNIVERSITY",
    sector: "UNIVERSITY",
    official_url: "https://www.example.ac.za",
    accreditation_status: "OFFICIAL_VERIFIED"
  },
  programme: {
    programme_ref: "programme_example_001",
    programme_name: "Bachelor of Example",
    sector: "UNIVERSITY",
    opening_status: "OPEN",
    exact_link: "https://www.example.ac.za/admissions"
  },
  deadline: null,
  eligibility_rules: []
};

assert.equal(validateN15PromotionPayload(validPayload), null);
assert.equal(validateN15PromotionPayload({ ...validPayload, programme: { ...validPayload.programme, sector: "TVET" } }), "SECTOR_MISMATCH_OR_UNSUPPORTED");
assert.equal(validateN15PromotionPayload({ ...validPayload, provider: { ...validPayload.provider, provider_type: "PRIVATE_COLLEGE", accreditation_status: "UNKNOWN" } }), "PRIVATE_PROVIDER_ACCREDITATION_NOT_VERIFIED");
assert.equal(validateN15PromotionPayload({ ...validPayload, provider: { ...validPayload.provider, sector: "PRIVATE_COLLEGE", provider_type: "COLLEGE", accreditation_status: "UNKNOWN" }, programme: { ...validPayload.programme, sector: "PRIVATE_COLLEGE" } }), "PRIVATE_PROVIDER_ACCREDITATION_NOT_VERIFIED");
assert.equal(validateN15PromotionPayload({ ...validPayload, programme: { ...validPayload.programme, opening_status: "AUTOMATICALLY_APPROVED" } }), "PROGRAMME_OPENING_STATUS_INVALID");
assert.equal(validateN15PromotionPayload({ ...validPayload, deadline: { deadline_ref: "deadline_001", closes_at: "not-a-date" } }), "DEADLINE_PAYLOAD_INVALID");

const refs = validateN15EvidenceReferences([
  "https://www.example.ac.za/admissions",
  "sha256:" + "a".repeat(64)
], authority);
assert.equal(refs.valid, true);
assert.equal(validateN15EvidenceReferences(["https://outside.invalid/evidence"], authority).valid, false);
assert.equal(validateN15EvidenceReferences(["http://www.example.ac.za/evidence"], authority).valid, false);

const evidenceGate = {
  openingStatus: "OPEN",
  accreditationStatus: "OFFICIAL_VERIFIED",
  sourceConfidence: "OFFICIAL_VERIFIED",
  sourceFresh: true,
  hasEvidence: true
};
assert.equal(canPublishVerifiedOpportunity(evidenceGate), true);
assert.equal(canPublishVerifiedOpportunity({ ...evidenceGate, sourceFresh: false }), false);
assert.equal(canPublishVerifiedOpportunity({ ...evidenceGate, openingStatus: "UNKNOWN" }), false);
assert.equal(canPublishVerifiedOpportunity({ ...evidenceGate, accreditationStatus: "UNKNOWN" }), false);

console.log(JSON.stringify({
  schema: "kingsmen.n15.verified-promotion-policy-tests.v1",
  status: "PASSED",
  passedChecks: 23,
  failedChecks: 0,
  liveNetworkUsed: false,
  liveDatabaseTouched: false,
  candidateDataUsed: false
}, null, 2));
