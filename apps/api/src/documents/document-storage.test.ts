import { strict as assert } from "node:assert";
import { test } from "node:test";
import { prepareDocumentStorage, buildDocumentRecord } from "./document-storage";

const validInput = {
  candidateId: "123e4567-e89b-42d3-a456-426614174000",
  applicationId: "123e4567-e89b-42d3-a456-426614174001",
  documentType: "ID_DOCUMENT" as const,
  originalFilename: "identity-card.pdf",
  mimeType: "application/pdf",
  fileSizeBytes: 1024
};

test("document storage creates opaque unique references and candidate-scoped paths", () => {
  const first = prepareDocumentStorage(validInput);
  const second = prepareDocumentStorage(validInput);
  assert.notEqual(first.documentRef, second.documentRef);
  assert.match(first.documentRef, /^doc_[0-9a-f-]{36}$/i);
  assert.equal(first.storagePath.startsWith(`${validInput.candidateId}/ID_DOCUMENT/`), true);
  assert.equal(first.protectedData, true);
});

test("document storage rejects non-UUID owner identifiers before constructing a path", () => {
  assert.throws(() => prepareDocumentStorage({ ...validInput, candidateId: "../../public" }), /candidateId must be a valid UUID/);
  assert.throws(() => prepareDocumentStorage({ ...validInput, applicationId: "../other-candidate" }), /applicationId must be a valid UUID/);
});

test("document storage rejects unsupported MIME types and invalid sizes", () => {
  assert.throws(() => prepareDocumentStorage({ ...validInput, mimeType: "text/html" }), /Unsupported document MIME type/);
  assert.throws(() => prepareDocumentStorage({ ...validInput, documentType: "../public" as never }), /Unsupported document type/);
  assert.throws(() => prepareDocumentStorage({ ...validInput, fileSizeBytes: 0 }), /fileSizeBytes is outside/);
  assert.throws(() => prepareDocumentStorage({ ...validInput, fileSizeBytes: 15 * 1024 * 1024 + 1 }), /fileSizeBytes is outside/);
  assert.throws(() => prepareDocumentStorage({ ...validInput, fileSizeBytes: 1.5 }), /fileSizeBytes is outside/);
});

test("document storage rejects control characters and oversized filenames", () => {
  assert.throws(() => prepareDocumentStorage({ ...validInput, originalFilename: "id\n.pdf" }), /originalFilename is invalid/);
  assert.throws(() => prepareDocumentStorage({ ...validInput, originalFilename: "x".repeat(256) }), /originalFilename is invalid/);
});

test("document record is explicitly pending review and not verified", () => {
  const record = buildDocumentRecord(validInput);
  assert.equal(record.documentStatus, "UPLOADED");
  assert.equal(record.verificationStatus, "PENDING");
  assert.equal(record.extractionStatus, "NOT_STARTED");
  assert.equal(record.protectedData, true);
});
