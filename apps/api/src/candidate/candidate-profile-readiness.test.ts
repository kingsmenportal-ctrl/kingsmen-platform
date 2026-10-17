import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCandidateProfileReadiness } from "./candidate-profile-readiness";
import type { DocumentReadinessSnapshot } from "../documents/document-types";

function docs(status: DocumentReadinessSnapshot["readinessStatus"] = "READY"): DocumentReadinessSnapshot {
  return {
    candidateId: "candidate-a",
    readinessStatus: status,
    missingDocumentTypes: status === "READY" ? [] : ["CV"],
    readyDocumentTypes: status === "READY" ? ["CV"] : [],
    reviewRequiredDocumentTypes: status === "REVIEW_REQUIRED" ? ["CV"] : [],
    summary: "test fixture"
  };
}

const base = {
  candidateId: "candidate-a",
  accountStatus: "ACTIVE" as const,
  identityLinkStatus: "VERIFIED" as const,
  requiredFields: ["fullName", "email", "phone"],
  profileFields: { fullName: "Candidate A", email: "a@example.test", phone: "+27000000000" },
  documentReadiness: docs()
};

test("ready requires active account, verified identity, complete profile, and ready documents", () => {
  const result = evaluateCandidateProfileReadiness(base);
  assert.equal(result.status, "READY");
  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
});

test("missing profile fields produce actionable next steps", () => {
  const result = evaluateCandidateProfileReadiness({
    ...base,
    profileFields: { fullName: "Candidate A", email: "a@example.test", phone: " " }
  });
  assert.equal(result.status, "ACTION_REQUIRED");
  assert.deepEqual(result.missingFields, ["phone"]);
  assert.equal(result.ready, false);
});

test("pending identity prevents ready state", () => {
  const result = evaluateCandidateProfileReadiness({ ...base, identityLinkStatus: "PENDING" });
  assert.equal(result.status, "ACTION_REQUIRED");
  assert.ok(result.blockers.includes("IDENTITY_LINK_PENDING"));
  assert.equal(result.ready, false);
});

test("rejected or missing identity is blocked", () => {
  for (const identityLinkStatus of ["REJECTED", "MISSING"] as const) {
    const result = evaluateCandidateProfileReadiness({ ...base, identityLinkStatus });
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.ready, false);
  }
});

test("disabled and suspended accounts are blocked", () => {
  for (const accountStatus of ["DISABLED", "SUSPENDED"] as const) {
    const result = evaluateCandidateProfileReadiness({ ...base, accountStatus });
    assert.equal(result.status, "BLOCKED");
    assert.ok(result.blockers.includes("CANDIDATE_ACCOUNT_NOT_ACTIVE"));
  }
});

test("document review and incomplete documents prevent ready state", () => {
  const review = evaluateCandidateProfileReadiness({ ...base, documentReadiness: docs("REVIEW_REQUIRED") });
  assert.equal(review.status, "ACTION_REQUIRED");
  assert.ok(review.blockers.includes("DOCUMENT_REVIEW_REQUIRED"));

  const missing = evaluateCandidateProfileReadiness({ ...base, documentReadiness: docs("MISSING") });
  assert.equal(missing.status, "ACTION_REQUIRED");
  assert.equal(missing.ready, false);
});

test("fails closed if document readiness belongs to another candidate", () => {
  assert.throws(
    () => evaluateCandidateProfileReadiness({ ...base, documentReadiness: { ...docs(), candidateId: "candidate-b" } }),
    /DOCUMENT_READINESS_OWNERSHIP_MISMATCH/
  );
});

test("deduplicates required fields and rejects blank candidate id", () => {
  const result = evaluateCandidateProfileReadiness({ ...base, requiredFields: ["email", "email"] });
  assert.deepEqual(result.missingFields, []);
  assert.throws(
    () => evaluateCandidateProfileReadiness({ ...base, candidateId: " " }),
    /CANDIDATE_ID_REQUIRED/
  );
});
