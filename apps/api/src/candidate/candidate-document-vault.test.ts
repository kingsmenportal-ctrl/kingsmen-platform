import test from "node:test";
import assert from "node:assert/strict";
import {
  listVerifiedCandidateDocuments,
  resolveOwnedDocumentStorageLocator
} from "./candidate-document-vault";
import type { CandidateBackendTransactionDatabase } from "./candidate-backend-transaction";

const AUTH = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
const DOC = "6ba7b812-9dad-41d1-80b4-00c04fd430c8";

function fakeDb(rows: unknown[] = []) {
  const calls: Array<{sql:string;values?:readonly unknown[]}> = [];
  const db: CandidateBackendTransactionDatabase = {
    async query<T>(sql:string, values?:readonly unknown[]) {
      calls.push({sql,values});
      return {rows: rows as T[]};
    }
  };
  return {db,calls};
}

test("lists limited document metadata only for verified mapped candidate", async () => {
  const f = fakeDb([{
    id:DOC, document_type:"IDENTITY", display_name:"Passport.pdf",
    content_type:"application/pdf", byte_size:"1024",
    document_status:"UPLOADED", uploaded_at:"2026-10-17T10:00:00.000Z"
  }]);
  const result = await listVerifiedCandidateDocuments(f.db, AUTH);
  assert.equal(result?.length,1);
  assert.deepEqual(result?.[0],{
    documentId:DOC, documentType:"IDENTITY", displayName:"Passport.pdf",
    contentType:"application/pdf", byteSize:1024, status:"UPLOADED",
    uploadedAt:"2026-10-17T10:00:00.000Z"
  });
  assert.deepEqual(f.calls[0].values,[AUTH]);
  assert.match(f.calls[0].sql,/link\.link_status = 'VERIFIED'/);
  assert.match(f.calls[0].sql,/document\.candidate_id = candidate\.id/);
  assert.match(f.calls[0].sql,/limit 200/i);
  assert.doesNotMatch(JSON.stringify(result),/storageObjectKey|storage_object_key|signedUrl|sha256/i);
});

test("malformed auth UUID never queries database", async () => {
  const f = fakeDb();
  assert.equal(await listVerifiedCandidateDocuments(f.db,"not-a-uuid"),null);
  assert.equal(f.calls.length,0);
});

test("document locator lookup is scoped to verified owner and exact document", async () => {
  const f = fakeDb([{
    id:DOC,storage_provider:"private-s3",storage_object_key:"opaque/key",
    content_type:"application/pdf"
  }]);
  assert.deepEqual(await resolveOwnedDocumentStorageLocator(f.db,AUTH,DOC),{
    documentId:DOC,storageProvider:"private-s3",
    storageObjectKey:"opaque/key",contentType:"application/pdf"
  });
  assert.deepEqual(f.calls[0].values,[AUTH,DOC]);
  assert.match(f.calls[0].sql,/document\.id = \$2::uuid/);
  assert.match(f.calls[0].sql,/document\.document_status <> 'ARCHIVED'/);
});

test("malformed document ID never queries database", async () => {
  const f = fakeDb();
  assert.equal(await resolveOwnedDocumentStorageLocator(f.db,AUTH,"bad"),null);
  assert.equal(f.calls.length,0);
});
