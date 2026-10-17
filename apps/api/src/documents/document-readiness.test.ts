import test from "node:test";
import assert from "node:assert/strict";
import { buildDocumentReadinessSnapshot } from "./document-readiness";
import type { DocumentFileRecord } from "./document-types";

function document(overrides: Partial<DocumentFileRecord> = {}): DocumentFileRecord {
  return {
    candidateId: "candidate-a",
    documentRef: "doc-a",
    documentType: "CV",
    displayName: "CV",
    originalFilename: "cv.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 1024,
    storageProvider: "private",
    storageBucket: "candidate-documents",
    storagePath: "candidate-a/cv.pdf",
    protectedData: true,
    sourceChannel: "PORTAL",
    documentStatus: "READY",
    verificationStatus: "VERIFIED",
    extractionStatus: "EXTRACTED",
    ...overrides
  };
}

test("rejects cross-candidate records instead of allowing readiness to leak across owners", () => {
  assert.throws(
    () => buildDocumentReadinessSnapshot({
      candidateId: "candidate-a",
      requiredDocumentTypes: ["CV"],
      documents: [document({ candidateId: "candidate-b" })]
    }),
    /DOCUMENT_OWNERSHIP_MISMATCH/
  );
});

test("ignores documents attached to a different application", () => {
  const snapshot = buildDocumentReadinessSnapshot({
    candidateId: "candidate-a",
    applicationId: "application-a",
    requiredDocumentTypes: ["CV"],
    documents: [document({ applicationId: "application-b" })]
  });
  assert.equal(snapshot.readinessStatus, "MISSING");
  assert.deepEqual(snapshot.missingDocumentTypes, ["CV"]);
});

test("does not count archived or deleted files as ready", () => {
  for (const documentStatus of ["ARCHIVED", "DELETED"] as const) {
    const snapshot = buildDocumentReadinessSnapshot({
      candidateId: "candidate-a",
      requiredDocumentTypes: ["CV"],
      documents: [document({ documentStatus })]
    });
    assert.equal(snapshot.readinessStatus, "MISSING");
  }
});

test("requires verified, ready documents and keeps pending verification in review", () => {
  const pending = buildDocumentReadinessSnapshot({
    candidateId: "candidate-a",
    requiredDocumentTypes: ["CV"],
    documents: [document({ verificationStatus: "PENDING" })]
  });
  assert.equal(pending.readinessStatus, "REVIEW_REQUIRED");
  assert.deepEqual(pending.reviewRequiredDocumentTypes, ["CV"]);
});

test("deduplicates required document types and accepts a verified ready file", () => {
  const snapshot = buildDocumentReadinessSnapshot({
    candidateId: "candidate-a",
    requiredDocumentTypes: ["CV", "CV"],
    documents: [document()]
  });
  assert.equal(snapshot.readinessStatus, "READY");
  assert.deepEqual(snapshot.readyDocumentTypes, ["CV"]);
});

test("rejects an empty candidate identifier", () => {
  assert.throws(
    () => buildDocumentReadinessSnapshot({ candidateId: " ", requiredDocumentTypes: [], documents: [] }),
    /CANDIDATE_ID_REQUIRED/
  );
});
