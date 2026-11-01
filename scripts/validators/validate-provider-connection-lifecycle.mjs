import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateProviderConnectionLifecycle,
  providerConnectionLifecycleStates,
  providerConnectionMethods,
  providerConnectionScopes
} from "../../apps/api/src/institutions/provider-connection-lifecycle.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "manifests/institutions/provider-connection-lifecycle-contract-v1.json"), "utf8"));
const asOf = "2026-11-01T12:00:00+02:00";
const fresh = "2026-11-01T11:00:00+02:00";
const stale = "2026-10-01T11:00:00+02:00";
const future = "2027-12-31T23:59:59+02:00";

assert.deepEqual(providerConnectionLifecycleStates, contract.states.map((item) => item.state));
assert.deepEqual(providerConnectionMethods, contract.methods);
assert.deepEqual(providerConnectionScopes, contract.scopes);
assert.equal(contract.default_state, "C0_NOT_CONNECTED");
assert.equal(contract.invariants.expired_or_revoked_authority_fails_closed, true);
assert.equal(contract.invariants.configured_scopes_must_be_subset_of_authority_and_terms, true);
assert.equal(contract.invariants.raw_credentials_must_not_be_persisted_in_application_data, true);
assert.equal(contract.invariants.tests_use_synthetic_data_in_sandbox_or_staging_only, true);

const verified = {
  provider_key: "example-provider",
  official_domain: "example.gov.za",
  authorization: {
    status: "APPROVED",
    authority_name: "Example Public Provider",
    authority_role: "Provider integration authority",
    approved_by: "provider-authority-001",
    evidence_ref: "provider-authority-evidence-001",
    evidence_url: "https://example.gov.za/legal/integration-authority",
    approved_at: fresh,
    expires_at: future,
    revoked_at: null,
    approved_scopes: ["READ_PUBLIC_DATA", "PREPARE_APPLICATION"],
    reviewed_by: "kingsmen-reviewer-001",
    reviewed_at: fresh,
    freshness_window_days: 30
  },
  terms: {
    status: "APPROVED",
    evidence_ref: "provider-terms-evidence-001",
    terms_url: "https://example.gov.za/legal/provider-terms",
    reviewed_by: "kingsmen-legal-reviewer-001",
    reviewed_at: fresh,
    freshness_window_days: 30,
    approved_scopes: ["READ_PUBLIC_DATA", "PREPARE_APPLICATION"]
  },
  connector: {
    method: "VERIFIED_HANDOFF",
    state: "CONFIGURED",
    handoff_url: "https://example.gov.za/apply",
    config_evidence_ref: "connector-config-evidence-001",
    configured_at: fresh,
    configured_scopes: ["READ_PUBLIC_DATA", "PREPARE_APPLICATION"],
    privacy_review_status: "APPROVED",
    privacy_review_evidence_ref: "privacy-review-evidence-001",
    candidate_consent_enforced: true,
    data_minimization_enforced: true,
    human_handoff_configured: true,
    submission_mode: "HUMAN_HANDOFF",
    last_test: {
      status: "PASS",
      test_id: "provider-route-test-001",
      evidence_ref: "provider-route-test-evidence-001",
      tested_at: fresh,
      freshness_window_days: 2,
      environment: "STAGING",
      synthetic_data_only: true,
      side_effects: false,
      tested_scopes: ["READ_PUBLIC_DATA", "PREPARE_APPLICATION"]
    }
  },
  monitoring: {
    enabled: true,
    failure_handoff_configured: true,
    failure_handoff_owner: "Kingsmen Provider Operations",
    failure_handoff_ref: "provider-failure-handoff-001",
    last_health: {
      status: "HEALTHY",
      evidence_ref: "provider-health-evidence-001",
      checked_at: fresh,
      freshness_window_days: 1
    }
  }
};

const complete = evaluateProviderConnectionLifecycle(verified, { asOf });
assert.equal(complete.state, "C5_MONITORED");
assert.equal(complete.connection_enabled, true);
assert.equal(complete.monitored_connection, true);
assert.equal(complete.automated_submission_capability, false);
assert.equal(complete.candidate_authorisation_still_required, false);
assert.equal(evaluateProviderConnectionLifecycle({}, { asOf }).state, "C0_NOT_CONNECTED");

assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  authorization: { ...verified.authorization, expires_at: stale }
}, { asOf }).state, "C0_NOT_CONNECTED", "Expired provider authority must fail closed");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  authorization: { ...verified.authorization, revoked_at: fresh }
}, { asOf }).state, "C0_NOT_CONNECTED", "Revoked provider authority must fail closed");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  authorization: { ...verified.authorization, evidence_url: "https://unrelated.example/authority" }
}, { asOf }).state, "C0_NOT_CONNECTED", "Authorisation evidence must be hosted on the official provider domain");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  authorization: { ...verified.authorization, approved_scopes: ["SUBMIT", "SUBMIT"] }
}, { asOf }).state, "C0_NOT_CONNECTED", "Duplicate authority scopes must fail closed");

assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  terms: { ...verified.terms, reviewed_at: stale, freshness_window_days: 1 }
}, { asOf }).state, "C1_AUTHORIZATION_VERIFIED", "Stale terms review must block progression");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  terms: { ...verified.terms, status: "PENDING" }
}, { asOf }).state, "C1_AUTHORIZATION_VERIFIED", "Unapproved terms must block connector configuration");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  terms: { ...verified.terms, approved_scopes: ["READ_PUBLIC_DATA"] }
}, { asOf }).state, "C1_AUTHORIZATION_VERIFIED", "Terms must cover all provider-authorised scopes");

assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, configured_scopes: ["SUBMIT"] }
}, { asOf }).state, "C2_TERMS_APPROVED", "Configured scopes cannot exceed the provider grant");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, human_handoff_configured: false }
}, { asOf }).state, "C2_TERMS_APPROVED", "Connector must retain a human handoff");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, privacy_review_status: "PENDING" }
}, { asOf }).state, "C2_TERMS_APPROVED", "Privacy review must be approved before configuration");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, method: "API", endpoint_url: "https://example.gov.za/api", credential_ref: "raw-api-token" }
}, { asOf }).state, "C2_TERMS_APPROVED", "Credentialed connector methods require an opaque vault reference");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, api_key: "plaintext-secret" }
}, { asOf }).state, "C2_TERMS_APPROVED", "Raw credential material must never pass configuration validation");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, private_config: { access_token: "nested-plaintext-secret" } }
}, { asOf }).state, "C2_TERMS_APPROVED", "Nested raw credential material must also fail closed");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, method: "UNKNOWN" }
}, { asOf }).state, "C2_TERMS_APPROVED", "Unknown connector methods must fail closed");

assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, last_test: { ...verified.connector.last_test, tested_at: stale, freshness_window_days: 1 } }
}, { asOf }).state, "C3_CONNECTOR_CONFIGURED", "Stale route test evidence must block tested state");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, last_test: { ...verified.connector.last_test, environment: "PRODUCTION" } }
}, { asOf }).state, "C3_CONNECTOR_CONFIGURED", "Production-side-effect tests cannot establish route readiness");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, last_test: { ...verified.connector.last_test, synthetic_data_only: false } }
}, { asOf }).state, "C3_CONNECTOR_CONFIGURED", "Tests must use synthetic data");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, last_test: { ...verified.connector.last_test, side_effects: true } }
}, { asOf }).state, "C3_CONNECTOR_CONFIGURED", "Tests must not create provider-side effects");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  connector: { ...verified.connector, last_test: { ...verified.connector.last_test, tested_scopes: ["READ_PUBLIC_DATA"] } }
}, { asOf }).state, "C3_CONNECTOR_CONFIGURED", "Every configured scope must be tested");

assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  monitoring: { ...verified.monitoring, failure_handoff_owner: "" }
}, { asOf }).state, "C4_ROUTE_TESTED", "Monitoring requires an identified failure owner");
assert.equal(evaluateProviderConnectionLifecycle({
  ...verified,
  monitoring: { ...verified.monitoring, last_health: { ...verified.monitoring.last_health, checked_at: stale, freshness_window_days: 1 } }
}, { asOf }).state, "C4_ROUTE_TESTED", "Stale health evidence must not produce a monitored state");

const automated = structuredClone(verified);
automated.authorization.approved_scopes.push("SUBMIT");
automated.terms.approved_scopes.push("SUBMIT");
automated.connector.method = "API";
automated.connector.endpoint_url = "https://example.gov.za/api";
automated.connector.credential_ref = "vault://provider/example-api";
automated.connector.configured_scopes.push("SUBMIT");
automated.connector.submission_mode = "AUTOMATED_APPROVED";
automated.connector.candidate_authorization_required = true;
automated.connector.candidate_authorization_policy_ref = "candidate-auth-policy-v1";
automated.connector.last_test.tested_scopes.push("SUBMIT");

const automatedResult = evaluateProviderConnectionLifecycle(automated, { asOf });
assert.equal(automatedResult.state, "C5_MONITORED");
assert.equal(automatedResult.automated_submission_capability, true);
assert.equal(automatedResult.candidate_authorisation_still_required, true);
assert.equal(evaluateProviderConnectionLifecycle({
  ...automated,
  connector: { ...automated.connector, candidate_authorization_required: false }
}, { asOf }).automated_submission_capability, false, "Provider permission never removes the candidate authorisation gate");
assert.equal(evaluateProviderConnectionLifecycle({
  ...automated,
  connector: { ...automated.connector, candidate_authorization_policy_ref: "" }
}, { asOf }).automated_submission_capability, false, "Automated submission requires a versioned candidate authorisation policy reference");
assert.throws(() => evaluateProviderConnectionLifecycle(verified, { asOf: "not-a-date" }), /asOf must be a valid/);

console.log("Provider connection lifecycle validation PASSED: authority expiry/revocation, official-domain evidence, scope intersections, terms/privacy review, credential isolation, human handoff, synthetic no-side-effect tests, monitoring and candidate-authorised submission gating.");
