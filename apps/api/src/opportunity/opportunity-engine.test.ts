import test from "node:test";
import assert from "node:assert/strict";
import {
  assertNoFakeOpportunityClaim,
  isStaleObservation,
  verifyProgrammeCandidateFacingSafety,
  type OpportunityProvider,
  type OpportunityProgramme,
  type SourceObservation
} from "./opportunity-engine";

const evidenceRefs = ["test-evidence://opportunity/source"];

const provider: OpportunityProvider = {
  providerRef: "provider-test",
  providerName: "Synthetic provider",
  providerType: "EMPLOYER",
  sector: "EMPLOYER",
  accreditationStatus: "NOT_APPLICABLE",
  sourceConfidence: "HIGH",
  safeToRecommend: true,
  evidenceRefs
};

const programme = (overrides: Partial<OpportunityProgramme> = {}): OpportunityProgramme => ({
  programmeRef: "programme-test",
  providerRef: provider.providerRef,
  programmeName: "Synthetic opportunity",
  sector: "EMPLOYER",
  openingStatus: "OPEN",
  sourceConfidence: "HIGH",
  candidateFacingSafe: false,
  exactLink: "https://example.org/opportunity",
  evidenceRefs,
  ...overrides
});

test("rejects non-HTTP(S) source URLs", () => {
  assert.throws(
    () => assertNoFakeOpportunityClaim({
      claim: "Synthetic opening",
      sourceUrl: "javascript:alert(1)",
      evidenceRefs,
      sourceConfidence: "HIGH"
    }),
    /NO_FAKE_LINKS_SOURCE_URL_REQUIRED/
  );
});

test("invalid stale timestamps fail closed as stale", () => {
  const observation: SourceObservation = {
    observationRef: "obs-test",
    sourceUrl: "https://example.org",
    sourceTitle: "Synthetic source",
    sector: "EMPLOYER",
    observedClaim: "Synthetic claim",
    sourceConfidence: "HIGH",
    observationStatus: "NEEDS_REVIEW",
    observedAt: "2026-01-01T00:00:00.000Z",
    staleAfter: "not-a-date",
    evidenceRefs
  };
  assert.equal(isStaleObservation(observation, "2026-01-02T00:00:00.000Z"), true);
});

test("closed programmes are never candidate-facing safe", () => {
  const result = verifyProgrammeCandidateFacingSafety(
    programme({ openingStatus: "CLOSED" }),
    provider
  );
  assert.equal(result.candidateFacingSafe, false);
});

test("invalid exact links are never candidate-facing safe", () => {
  const result = verifyProgrammeCandidateFacingSafety(
    programme({ exactLink: "javascript:alert(1)" }),
    provider
  );
  assert.equal(result.candidateFacingSafe, false);
});

test("observations without an explicit freshness deadline fail closed as stale", () => {
  const observation: SourceObservation = {
    observationRef: "obs-no-expiry",
    sourceUrl: "https://example.org",
    sourceTitle: "Synthetic source",
    sector: "EMPLOYER",
    observedClaim: "Synthetic claim",
    sourceConfidence: "HIGH",
    observationStatus: "NEEDS_REVIEW",
    observedAt: "2026-01-01T00:00:00.000Z",
    evidenceRefs
  };
  assert.equal(isStaleObservation(observation, "2026-01-02T00:00:00.000Z"), true);
});
