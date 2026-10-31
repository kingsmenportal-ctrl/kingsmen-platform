import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applicationReadinessStates,
  evaluateOpportunityReadiness,
  evaluateProviderReadiness,
} from "../../apps/api/src/institutions/application-readiness.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "manifests/institutions/application-readiness-contract-v1.json"), "utf8"));
const asOf = "2026-10-31T12:00:00Z";
const fresh = "2026-10-31T11:00:00Z";
const yesterday = "2026-10-30T11:00:00Z";

assert.deepEqual(applicationReadinessStates.provider, contract.provider_states.map((x) => x.state));
assert.deepEqual(applicationReadinessStates.opportunity, contract.opportunity_states.map((x) => x.state));
assert.equal(contract.freshness_policy.missing_invalid_future_or_stale_timestamp_fails_closed, true);
assert.equal(contract.evidence_rules.official_domain_required_for_source_and_route_urls, true);
assert.equal(contract.evidence_rules.candidate_readiness_is_not_an_admission_or_employment_decision, true);

const verifiedProvider = {
  provider_key: "example-provider",
  identity: { legal_or_recognised_name: "Example Public Provider", status: "VERIFIED", verified_at: yesterday, freshness_window_days: 365 },
  source_evidence: { status: "VERIFIED", authority: "Example public authority", url: "https://example.gov.za/directory/provider", official_domain: "example.gov.za", observed_at: yesterday, freshness_window_days: 30 },
  application_route: { url: "https://example.gov.za/apply", official_domain: "example.gov.za", scope: "general applications", verification_status: "VERIFIED", verified_at: yesterday, freshness_window_days: 7 },
  connector: {
    method: "VERIFIED_HANDOFF", state: "CONFIGURED", access_review_status: "APPROVED", terms_review_status: "APPROVED",
    human_handoff_configured: true, submission_mode: "NONE",
    last_test: { status: "PASS", test_id: "route-smoke-001", tested_at: fresh, freshness_window_days: 1 },
  },
  monitoring: { enabled: true, failure_handoff_configured: true, last_health: { status: "HEALTHY", checked_at: fresh, freshness_window_days: 1 } },
};

assert.equal(evaluateProviderReadiness({}, { asOf }).state, "P0_DISCOVERED");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  application_route: {},
  connector: {},
  monitoring: {},
}, { asOf }).state, "P1_IDENTITY_VERIFIED");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  connector: { state: "NOT_CONNECTED" },
  monitoring: {},
}, { asOf }).state, "P2_ROUTE_VERIFIED");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  connector: { ...verifiedProvider.connector, last_test: {} },
  monitoring: {},
}, { asOf }).state, "P3_CONNECTOR_CONFIGURED");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  monitoring: {},
}, { asOf }).state, "P4_ROUTE_TESTED");
assert.equal(evaluateProviderReadiness(verifiedProvider, { asOf }).state, "P5_MONITORED");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  source_evidence: { ...verifiedProvider.source_evidence, observed_at: "2026-10-01T00:00:00Z", freshness_window_days: 1 },
}, { asOf }).state, "P0_DISCOVERED", "Stale identity source evidence must fail closed");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  application_route: { ...verifiedProvider.application_route, url: "http://example.gov.za/apply" },
}, { asOf }).state, "P1_IDENTITY_VERIFIED", "HTTP routes must not pass route verification");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  application_route: { ...verifiedProvider.application_route, url: "https://unrelated.example/apply", official_domain: "example.gov.za" },
}, { asOf }).state, "P1_IDENTITY_VERIFIED", "Wrong-domain routes must not pass verification");
assert.equal(evaluateProviderReadiness({
  ...verifiedProvider,
  source_evidence: { ...verifiedProvider.source_evidence, official_domain: undefined },
}, { asOf }).state, "P0_DISCOVERED", "Official domain evidence must be explicit");

const verifiedOpportunity = {
  opportunity_key: "example-opportunity",
  status: "OPEN",
  source_evidence: { status: "VERIFIED", authority: "Example public authority", source_id: "official-notice-123", url: "https://example.gov.za/notices/123", official_domain: "example.gov.za", observed_at: yesterday, freshness_window_days: 7 },
  last_checked_at: fresh,
  freshness_window_days: 1,
  deadline: "2026-11-30T23:59:00+02:00",
  requirements: { review_status: "VERIFIED", reviewed_at: yesterday, freshness_window_days: 30, eligibility_criteria: [], required_documents: [] },
};
const candidate = {
  eligibility_status: "REQUIREMENTS_MATCHED", eligibility_review_status: "VERIFIED", preflight_status: "PASS",
  required_documents_present: true, consent_status: "CONFIRMED",
};
const routeProvider = { rank: 2 };

assert.equal(evaluateOpportunityReadiness({}, { asOf }).state, "O0_FOUND");
assert.equal(evaluateOpportunityReadiness(verifiedOpportunity, { asOf }).state, "O3_REQUIREMENTS_MAPPED");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  status: "CLOSED",
}, { asOf }).state, "O1_SOURCE_VERIFIED");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  last_checked_at: "2026-10-29T00:00:00Z",
}, { asOf }).state, "O1_SOURCE_VERIFIED", "Stale opportunity status must not be shown as open");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  deadline: "2026-10-30T23:59:00+02:00",
}, { asOf }).state, "O1_SOURCE_VERIFIED", "Past deadline must prevent current-open status");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  deadline: "2026-10-30",
}, { asOf }).state, "O1_SOURCE_VERIFIED", "Date-only deadline before South African local date must expire");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  deadline: "2026-10-31",
}, { asOf }).state, "O1_SOURCE_VERIFIED", "Today's date-only deadline without published cutoff time must fail closed");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  deadline: "2026-11-06",
}, { asOf }).state, "O3_REQUIREMENTS_MAPPED", "Future South African date-only deadline must not be prematurely expired");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  requirements: { ...verifiedOpportunity.requirements, review_status: "NEEDS_REVIEW" },
}, { asOf }).state, "O2_CURRENT_OPEN");
assert.equal(evaluateOpportunityReadiness(verifiedOpportunity, { asOf, candidate, providerReadiness: routeProvider }).state, "O4_CANDIDATE_READY");

const selfReportedOnly = {
  ...verifiedOpportunity,
  submission_evidence: { reported_by_candidate: true, status: "CANDIDATE_REPORTED" },
};
const reportedResult = evaluateOpportunityReadiness(selfReportedOnly, { asOf, candidate, providerReadiness: routeProvider });
assert.equal(reportedResult.state, "O4_CANDIDATE_READY");
assert.equal(reportedResult.candidate_reported_submission_needs_confirmation, true);
assert.equal(reportedResult.provider_submission_evidenced, false);

const withReceipt = {
  ...selfReportedOnly,
  submission_evidence: {
    status: "PROVIDER_RECEIPT_VERIFIED", receipt_reference: "EX-RECEIPT-123",
    evidence_record_id: "private-evidence-001", submitted_at: "2026-07-01T08:00:00Z", freshness_window_days: 1,
  },
};
assert.equal(evaluateOpportunityReadiness(withReceipt, { asOf, candidate, providerReadiness: routeProvider }).state, "O5_SUBMISSION_EVIDENCED");
assert.equal(evaluateOpportunityReadiness({
  ...withReceipt,
  submission_evidence: {
    ...withReceipt.submission_evidence,
    submitted_at: "2026-11-01T08:00:00Z",
  },
}, { asOf, candidate, providerReadiness: routeProvider }).state, "O4_CANDIDATE_READY", "Future submission event timestamps must fail closed");
assert.equal(evaluateOpportunityReadiness({
  ...withReceipt,
  outcome_evidence: {
    status: "PROVIDER_CONFIRMED", outcome_type: "OFFER", evidence_record_id: "private-outcome-001",
    confirmed_at: "2026-07-02T08:00:00Z", freshness_window_days: 1,
  },
}, { asOf, candidate, providerReadiness: routeProvider }).state, "O6_OUTCOME_VERIFIED");
assert.equal(evaluateOpportunityReadiness({
  ...verifiedOpportunity,
  source_evidence: { ...verifiedOpportunity.source_evidence, url: "javascript:alert(1)" },
}, { asOf }).state, "O0_FOUND", "Unsafe source URL must fail closed");

console.log("Institution application readiness validation PASSED: 6 provider states, 7 opportunity states, stale evidence, wrong-domain routes, expired deadlines, self-reported submission and provider receipt/outcome boundaries, and durable historical evidence.");
