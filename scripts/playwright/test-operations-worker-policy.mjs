import assert from "node:assert/strict";
import {
  KINGSMEN_PATHWAYS,
  PLAYWRIGHT_SCOUT_WORKER_CODE,
  PLAYWRIGHT_SCOUT_OPERATION,
  authorizeScoutDispatch,
  validateAdapterRegistry
} from "../../apps/workers/src/providers/provider-adapter-policy.mjs";

const now = Date.now();
const iso = (value) => new Date(value).toISOString();
const evidence = {
  providerAuthorizationEvidenceRef: "evidence:provider:authorisation:fixture",
  termsReviewEvidenceRef: "evidence:provider:terms:fixture",
  founderApprovalEvidenceRef: "evidence:founder:approval:fixture",
  approvedBy: "founder-fixture-approval",
  approvedAt: iso(now - 60_000),
  expiresAt: iso(now + 24 * 60 * 60_000),
  status: "APPROVED"
};
const adapter = {
  id: "fixture-provider",
  providerId: "fixture-provider",
  version: "1.0.0",
  enabled: true,
  capability: "PUBLIC_SOURCE_INSPECTION",
  accessMode: "public_read_only",
  allowedActions: [PLAYWRIGHT_SCOUT_OPERATION],
  officialDomains: ["apply.fixture.example"],
  allowedHosts: ["apply.fixture.example"],
  authorization: { ...evidence }
};
const registry = { schema: "kingsmen.playwright-provider-adapter-registry.v1", adapters: [adapter] };
const emptyRegistry = { schema: "kingsmen.playwright-provider-adapter-registry.v1", adapters: [] };
const validRegistry = validateAdapterRegistry(registry, now);
assert.equal(validRegistry.valid, true, "approved read-only provider adapter should validate");
assert.equal(validateAdapterRegistry(emptyRegistry, now).valid, true, "empty adapter registry must remain safely disabled");

const dispatchFor = (pathway, changes = {}) => ({
  dispatch_ref: "dispatch:fixture:001",
  worker_code: PLAYWRIGHT_SCOUT_WORKER_CODE,
  evidence_refs: [
    evidence.providerAuthorizationEvidenceRef,
    evidence.termsReviewEvidenceRef,
    evidence.founderApprovalEvidenceRef
  ],
  payload: {
    schema: "kingsmen.playwright-scout-dispatch.v1",
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    operation: PLAYWRIGHT_SCOUT_OPERATION,
    providerId: adapter.providerId,
    source: {
      id: "source-fixture",
      providerId: adapter.providerId,
      providerName: "Fixture Provider",
      pathway,
      officialSourceUrl: "https://apply.fixture.example/admissions"
    },
    ...changes
  }
});

for (const pathway of KINGSMEN_PATHWAYS) {
  assert.equal(authorizeScoutDispatch(registry, dispatchFor(pathway), now).valid, true, pathway + " must be supported by the adapter policy");
}

const valid = authorizeScoutDispatch(registry, dispatchFor("higher_education"), now);
assert.equal(valid.valid, true);
assert.deepEqual(valid.allowedHosts, ["apply.fixture.example"]);

const wrongWorker = dispatchFor("higher_education");
wrongWorker.worker_code = "evidence.verify";
assert.equal(authorizeScoutDispatch(registry, wrongWorker, now).code, "WORKER_CODE_NOT_ALLOWED");

const wrongVersion = dispatchFor("higher_education");
wrongVersion.payload.adapterVersion = "9.9.9";
assert.equal(authorizeScoutDispatch(registry, wrongVersion, now).code, "APPROVED_PROVIDER_ADAPTER_NOT_FOUND");

const extraPayload = dispatchFor("higher_education");
extraPayload.payload.candidateId = "must-not-be-present";
assert.equal(authorizeScoutDispatch(registry, extraPayload, now).code, "DISPATCH_PAYLOAD_SHAPE_INVALID");

const wrongProvider = dispatchFor("higher_education");
wrongProvider.payload.providerId = "another-provider";
assert.equal(authorizeScoutDispatch(registry, wrongProvider, now).code, "APPROVED_PROVIDER_ADAPTER_NOT_FOUND");

const wrongSourceProvider = dispatchFor("higher_education");
wrongSourceProvider.payload.source.providerId = "another-provider";
assert.equal(authorizeScoutDispatch(registry, wrongSourceProvider, now).code, "SOURCE_IDENTITY_INVALID");

const unsupportedOperation = dispatchFor("higher_education");
unsupportedOperation.payload.operation = "upload_document";
assert.equal(authorizeScoutDispatch(registry, unsupportedOperation, now).code, "DISPATCH_OPERATION_NOT_ALLOWED");

const sensitiveUrl = dispatchFor("higher_education");
sensitiveUrl.payload.source.officialSourceUrl = "https://apply.fixture.example/apply?access_token=super-secret";
assert.equal(authorizeScoutDispatch(registry, sensitiveUrl, now).code, "SOURCE_URL_NOT_APPROVED");

const nonHttps = dispatchFor("higher_education");
nonHttps.payload.source.officialSourceUrl = "http://apply.fixture.example/apply";
assert.equal(authorizeScoutDispatch(registry, nonHttps, now).code, "SOURCE_URL_NOT_APPROVED");

const unapprovedHost = dispatchFor("higher_education");
unapprovedHost.payload.source.officialSourceUrl = "https://evil.example/apply";
assert.equal(authorizeScoutDispatch(registry, unapprovedHost, now).code, "SOURCE_URL_NOT_APPROVED");

const incompleteEvidence = dispatchFor("higher_education");
incompleteEvidence.evidence_refs = [evidence.providerAuthorizationEvidenceRef];
assert.equal(authorizeScoutDispatch(registry, incompleteEvidence, now).code, "DISPATCH_APPROVAL_EVIDENCE_MISSING");

const expiredRegistry = {
  schema: registry.schema,
  adapters: [{
    ...adapter,
    authorization: { ...evidence, expiresAt: iso(now - 1000) }
  }]
};
assert.equal(validateAdapterRegistry(expiredRegistry, now).valid, false, "expired provider approval must fail closed");

const missingProviderApproval = {
  schema: registry.schema,
  adapters: [{
    ...adapter,
    authorization: { ...evidence, providerAuthorizationEvidenceRef: "" }
  }]
};
assert.equal(validateAdapterRegistry(missingProviderApproval, now).valid, false, "missing provider authorisation evidence must fail closed");

const wrongTerms = {
  schema: registry.schema,
  adapters: [{
    ...adapter,
    authorization: { ...evidence, termsReviewEvidenceRef: "" }
  }]
};
assert.equal(validateAdapterRegistry(wrongTerms, now).valid, false, "missing terms-review evidence must fail closed");

const uploadCapability = {
  schema: registry.schema,
  adapters: [{
    ...adapter,
    allowedActions: [PLAYWRIGHT_SCOUT_OPERATION, "upload_document"]
  }]
};
assert.equal(validateAdapterRegistry(uploadCapability, now).valid, false, "adapter must not widen to upload capability");

const wrongAccessMode = {
  schema: registry.schema,
  adapters: [{ ...adapter, accessMode: "authenticated_browser" }]
};
assert.equal(validateAdapterRegistry(wrongAccessMode, now).valid, false, "operations adapter must remain public-read-only");

const wildcardHost = {
  schema: registry.schema,
  adapters: [{ ...adapter, allowedHosts: ["*.fixture.example"] }]
};
assert.equal(validateAdapterRegistry(wildcardHost, now).valid, false, "wildcard domains are prohibited");

console.log(JSON.stringify({
  schema: "kingsmen.playwright-operations-policy-test.v1",
  status: "PASSED",
  assertions: 26,
  pathwaysCovered: KINGSMEN_PATHWAYS,
  enabledCapability: "PUBLIC_SOURCE_INSPECTION_ONLY",
  uploadsOrSubmissionsEnabled: false,
  expiredOrUnprovenAuthorisationEnabled: false,
  liveProviderAdapterRegistered: false
}, null, 2));
