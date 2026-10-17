import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCandidateDocumentUploadPlan,
  MAX_CANDIDATE_DOCUMENT_BYTES
} from "./candidate-document-upload-policy";

const intent = {
  candidateId:"6ba7b811-9dad-41d1-80b4-00c04fd430c8",
  authUserId:"6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  documentType:"IDENTITY" as const,
  displayName:"Passport scan.pdf",
  contentType:"application/pdf",
  byteSize:1024,
  correlationId:"upload-req-20261017"
};
const objectId="6ba7b812-9dad-41d1-80b4-00c04fd430c8";

test("creates opaque server-generated storage key and short expiry",()=>{
  const plan=buildCandidateDocumentUploadPlan(intent,objectId);
  assert.ok(plan);
  assert.equal(plan.storageObjectKey,`candidate-documents/${intent.candidateId}/${objectId}`);
  assert.equal(plan.expiresInSeconds,300);
  assert.equal(plan.contentType,"application/pdf");
});

test("rejects invalid identity and generated object IDs",()=>{
  assert.equal(buildCandidateDocumentUploadPlan({...intent,authUserId:"bad"},objectId),null);
  assert.equal(buildCandidateDocumentUploadPlan(intent,"client/path"),null);
});

test("rejects dangerous names, unsupported MIME, and size overflow",()=>{
  assert.equal(buildCandidateDocumentUploadPlan({...intent,displayName:"../secret.pdf"},objectId),null);
  assert.equal(buildCandidateDocumentUploadPlan({...intent,displayName:"folder/file.pdf"},objectId),null);
  assert.equal(buildCandidateDocumentUploadPlan({...intent,contentType:"text/html"},objectId),null);
  assert.equal(buildCandidateDocumentUploadPlan({...intent,byteSize:MAX_CANDIDATE_DOCUMENT_BYTES+1},objectId),null);
  assert.equal(buildCandidateDocumentUploadPlan({...intent,byteSize:0},objectId),null);
});

test("never incorporates client filename into storage key",()=>{
  const plan=buildCandidateDocumentUploadPlan({...intent,displayName:"My identity (final).pdf"},objectId);
  assert.ok(plan);
  assert.equal(plan.storageObjectKey.includes("My identity"),false);
});
