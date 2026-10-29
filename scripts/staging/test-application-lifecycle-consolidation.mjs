import assert from "node:assert/strict";
import {
  normalizeLegacyApplicationStatus,
  validateApplicationTransition,
  validateApplicationChildChoices
} from "../../apps/api/dist/routes/application-lifecycle-policy.js";
import { validateCaoChoices, caoIsOneKingsmenApplication } from "../../apps/api/dist/routes/cao-boundary.js";

const candidateEvidence = { reference: "candidate-ref-123", reportedAt: "2026-10-29T10:00:00.000Z" };
const providerEvidence = {
  evidenceRef: "provider-evidence-123",
  sourceKind: "PROVIDER_ORIGIN",
  verified: true,
  verifiedByAuthUserId: "00000000-0000-4000-8000-000000000001",
  verifiedAt: "2026-10-29T10:10:00.000Z"
};

const reported = normalizeLegacyApplicationStatus({
  source: "candidate_route_applications",
  status: "CANDIDATE_REPORTED_SUBMITTED",
  candidateSubmission: candidateEvidence
});
assert.equal(reported.status, "CANDIDATE_REPORTED_SUBMITTED");
assert.equal(reported.statusAuthority, "candidate_reported");
assert.equal(normalizeLegacyApplicationStatus({ source: "candidate_route_applications", status: "PREPARING" }).statusAuthority, "tracker_recorded");
assert.match(reported.reason, /not provider-confirmed/i);

const invalidReported = normalizeLegacyApplicationStatus({
  source: "candidate_route_applications",
  status: "CANDIDATE_REPORTED_SUBMITTED"
});
assert.equal(invalidReported.status, "LEGACY_UNRESOLVED");
assert.equal(invalidReported.requiresReview, true);

const falseProviderClaim = normalizeLegacyApplicationStatus({
  source: "candidate_route_applications",
  status: "ACCEPTED",
  candidateSubmission: candidateEvidence
});
assert.equal(falseProviderClaim.status, "LEGACY_UNRESOLVED");
assert.equal(falseProviderClaim.statusAuthority, "legacy_unresolved");

const verifiedProviderClaim = normalizeLegacyApplicationStatus({
  source: "candidate_route_applications",
  status: "ACCEPTED",
  providerEvidence
});
assert.equal(verifiedProviderClaim.status, "ACCEPTED");
assert.equal(verifiedProviderClaim.statusAuthority, "provider_verified");
assert.equal(normalizeLegacyApplicationStatus({ source: "candidate_route_applications", status: "ACCEPTED", providerEvidence: { ...providerEvidence, verifiedByAuthUserId: "not-an-auth-uuid" } }).status, "LEGACY_UNRESOLVED");

const unknownWorkflow = normalizeLegacyApplicationStatus({
  source: "applications",
  status: "COMPLETED"
});
assert.equal(unknownWorkflow.status, "LEGACY_UNRESOLVED");
assert.equal(unknownWorkflow.requiresReview, true);

assert.equal(validateApplicationTransition({
  from: "EXTERNAL_PORTAL_OPENED",
  to: "CANDIDATE_REPORTED_SUBMITTED",
  candidateSubmission: candidateEvidence
}).allowed, true);
assert.equal(validateApplicationTransition({
  from: "EXTERNAL_PORTAL_OPENED",
  to: "CANDIDATE_REPORTED_SUBMITTED"
}).allowed, false);
assert.equal(validateApplicationTransition({
  from: "CANDIDATE_REPORTED_SUBMITTED",
  to: "ACCEPTED",
  candidateSubmission: candidateEvidence
}).allowed, false);
assert.equal(validateApplicationTransition({
  from: "CANDIDATE_REPORTED_SUBMITTED",
  to: "PROVIDER_ACKNOWLEDGED",
  providerEvidence
}).allowed, true);
assert.equal(validateApplicationTransition({
  from: "ACCEPTED",
  to: "PREPARING"
}).allowed, false);

const choices = [
  { choiceNumber: 1, institutionName: "Institution A", programmeName: "Programme A" },
  { choiceNumber: 2, institutionName: "Institution B", programmeName: "Programme B" }
];
assert.equal(validateApplicationChildChoices(choices).allowed, true);
assert.equal(validateCaoChoices(choices).allowed, true);
assert.equal(caoIsOneKingsmenApplication(), true);
assert.equal(validateCaoChoices([]).allowed, false);
assert.equal(validateCaoChoices([
  choices[0],
  { choiceNumber: 1, institutionName: "Institution B", programmeName: "Programme B" }
]).allowed, false);
assert.equal(validateCaoChoices(Array.from({ length: 7 }, (_, i) => ({
  choiceNumber: i + 1, institutionName: "Institution", programmeName: "Programme"
}))).allowed, false);

console.log(JSON.stringify({
  passed: true,
  checks: 23,
  scope: "canonical application lifecycle compatibility policy + CAO child-choice adapter",
  guarantees: [
    "unknown legacy workflow statuses stay unresolved",
    "candidate-reported submission is not provider confirmation",
    "provider receipt/review/outcome requires verified provider-origin evidence and reviewer identity",
    "illegal transitions are rejected",
    "CAO remains one parent application with ordered child choices"
  ]
}, null, 2));
