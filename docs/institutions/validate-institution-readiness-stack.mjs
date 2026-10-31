import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applicationReadinessStates, evaluateOpportunityReadiness, evaluateProviderReadiness } from "../../apps/api/src/institutions/application-readiness.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "docs/institutions/application-readiness-contract-v1.json"), "utf8"));
const asOf = "2026-10-31T12:00:00Z";
const fresh = "2026-10-31T11:00:00Z";
const yesterday = "2026-10-30T11:00:00Z";
assert.deepEqual(applicationReadinessStates.provider, contract.provider_states);
assert.deepEqual(applicationReadinessStates.opportunity, contract.opportunity_states);

const provider = {
  provider_key: "test-provider",
  identity: { legal_or_recognised_name: "Test public provider", status: "VERIFIED", verified_at: yesterday, freshness_window_days: 365 },
  source_evidence: { status: "VERIFIED", authority: "Test official authority", url: "https://example.gov.za/providers/test", official_domain: "example.gov.za", observed_at: yesterday, freshness_window_days: 30 },
  application_route: { url: "https://example.gov.za/apply", official_domain: "example.gov.za", scope: "general applications", verification_status: "VERIFIED", verified_at: yesterday, freshness_window_days: 7 },
  connector: { method: "VERIFIED_HANDOFF", state: "CONFIGURED", access_review_status: "APPROVED", terms_review_status: "APPROVED", human_handoff_configured: true, submission_mode: "NONE", last_test: { status: "PASS", test_id: "route-test-1", tested_at: fresh, freshness_window_days: 1 } },
  monitoring: { enabled: true, failure_handoff_configured: true, last_health: { status: "HEALTHY", checked_at: fresh, freshness_window_days: 1 } }
};
assert.equal(evaluateProviderReadiness({}, { asOf }).state, "P0_DISCOVERED");
assert.equal(evaluateProviderReadiness({ ...provider, application_route: {}, connector: {}, monitoring: {} }, { asOf }).state, "P1_IDENTITY_VERIFIED");
assert.equal(evaluateProviderReadiness({ ...provider, connector: { state: "NOT_CONNECTED" }, monitoring: {} }, { asOf }).state, "P2_ROUTE_VERIFIED");
assert.equal(evaluateProviderReadiness({ ...provider, connector: { ...provider.connector, last_test: {} }, monitoring: {} }, { asOf }).state, "P3_CONNECTOR_CONFIGURED");
assert.equal(evaluateProviderReadiness({ ...provider, monitoring: {} }, { asOf }).state, "P4_ROUTE_TESTED");
assert.equal(evaluateProviderReadiness(provider, { asOf }).state, "P5_MONITORED");
assert.equal(evaluateProviderReadiness({ ...provider, application_route: { ...provider.application_route, url: "http://example.gov.za/apply" } }, { asOf }).state, "P1_IDENTITY_VERIFIED");
assert.equal(evaluateProviderReadiness({ ...provider, application_route: { ...provider.application_route, url: "https://unrelated.example/apply" } }, { asOf }).state, "P1_IDENTITY_VERIFIED");

const opportunity = {
  opportunity_key: "test-opportunity",
  status: "OPEN",
  source_evidence: { status: "VERIFIED", authority: "Test official authority", source_id: "notice-1", url: "https://example.gov.za/notices/1", official_domain: "example.gov.za", observed_at: yesterday, freshness_window_days: 7 },
  last_checked_at: fresh,
  freshness_window_days: 1,
  deadline: "2026-11-30T23:59:00+02:00",
  requirements: { review_status: "VERIFIED", reviewed_at: yesterday, freshness_window_days: 30, eligibility_criteria: [], required_documents: [] }
};
assert.equal(evaluateOpportunityReadiness({}, { asOf }).state, "O0_FOUND");
assert.equal(evaluateOpportunityReadiness(opportunity, { asOf }).state, "O3_REQUIREMENTS_MAPPED");
assert.equal(evaluateOpportunityReadiness({ ...opportunity, status: "CLOSED" }, { asOf }).state, "O1_SOURCE_VERIFIED");
assert.equal(evaluateOpportunityReadiness({ ...opportunity, last_checked_at: "2026-10-29T00:00:00Z" }, { asOf }).state, "O1_SOURCE_VERIFIED");
assert.equal(evaluateOpportunityReadiness({ ...opportunity, deadline: "2026-10-30" }, { asOf }).state, "O1_SOURCE_VERIFIED");
assert.equal(evaluateOpportunityReadiness({ ...opportunity, deadline: "2026-10-31" }, { asOf }).state, "O1_SOURCE_VERIFIED");
assert.match(evaluateOpportunityReadiness({ ...opportunity, deadline: "2026-10-31" }, { asOf }).blocking_reason, /cutoff time is unknown/i);
assert.equal(evaluateOpportunityReadiness({ ...opportunity, deadline: "2026-02-31" }, { asOf }).state, "O1_SOURCE_VERIFIED");
assert.equal(evaluateOpportunityReadiness({ ...opportunity, deadline: "2026-11-06" }, { asOf }).state, "O3_REQUIREMENTS_MAPPED");
assert.equal(evaluateOpportunityReadiness({ ...opportunity, source_evidence: { ...opportunity.source_evidence, url: "javascript:alert(1)" } }, { asOf }).state, "O0_FOUND");

const candidate = { eligibility_status: "REQUIREMENTS_MATCHED", eligibility_review_status: "VERIFIED", preflight_status: "PASS", required_documents_present: true, consent_status: "CONFIRMED" };
const candidateReady = evaluateOpportunityReadiness(opportunity, { asOf, candidate, providerReadiness: { rank: 2 } });
assert.equal(candidateReady.state, "O4_CANDIDATE_READY");
const selfReported = evaluateOpportunityReadiness({ ...opportunity, submission_evidence: { reported_by_candidate: true, status: "CANDIDATE_REPORTED" } }, { asOf, candidate, providerReadiness: { rank: 2 } });
assert.equal(selfReported.state, "O4_CANDIDATE_READY");
assert.equal(selfReported.candidate_reported_submission_needs_confirmation, true);
assert.equal(selfReported.provider_submission_evidenced, false);
const withReceipt = evaluateOpportunityReadiness({ ...opportunity, submission_evidence: { status: "PROVIDER_RECEIPT_VERIFIED", receipt_reference: "EX-123", evidence_record_id: "evidence-1", submitted_at: yesterday, freshness_window_days: 1 } }, { asOf, candidate, providerReadiness: { rank: 2 } });
assert.equal(withReceipt.state, "O5_SUBMISSION_EVIDENCED");
assert.equal(evaluateOpportunityReadiness({ ...opportunity, submission_evidence: { status: "PROVIDER_RECEIPT_VERIFIED", receipt_reference: "EX-123", evidence_record_id: "evidence-1", submitted_at: "2026-11-01T08:00:00Z", freshness_window_days: 1 } }, { asOf, candidate, providerReadiness: { rank: 2 } }).state, "O4_CANDIDATE_READY");
const withOutcome = evaluateOpportunityReadiness({ ...opportunity, submission_evidence: { status: "PROVIDER_RECEIPT_VERIFIED", receipt_reference: "EX-123", evidence_record_id: "evidence-1", submitted_at: yesterday, freshness_window_days: 1 }, outcome_evidence: { status: "PROVIDER_CONFIRMED", outcome_type: "OFFER", evidence_record_id: "outcome-1", confirmed_at: yesterday, freshness_window_days: 1 } }, { asOf, candidate, providerReadiness: { rank: 2 } });
assert.equal(withOutcome.state, "O6_OUTCOME_VERIFIED");

console.log("Institution readiness tests passed: provider P0-P5, opportunity O0-O6, origin-domain constraints, deadline expiry and local-date edge cases, candidate preflight/consent, self-report versus receipt, and confirmed outcomes.");
