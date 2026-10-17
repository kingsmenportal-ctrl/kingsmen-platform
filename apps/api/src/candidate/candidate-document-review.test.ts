import test from "node:test";
import assert from "node:assert/strict";
import { reviewCandidateDocument } from "./candidate-document-review";
import type { CandidateBackendTransactionDatabase } from "./candidate-backend-transaction";

const DOC="6ba7b812-9dad-41d1-80b4-00c04fd430c8";
const CANDIDATE="6ba7b811-9dad-41d1-80b4-00c04fd430c8";
const command={documentId:DOC,action:"ACCEPT" as const,reason:"Document verified against evidence",correlationId:"doc-review-20261017",expectedStatus:"UNDER_REVIEW" as const};
function fixture(opts:{updateRows?:unknown[];auditFails?:boolean}={}) {
  const calls:Array<{sql:string;values?:readonly unknown[]}>=[];
  const db:CandidateBackendTransactionDatabase={
    async query<T>(sql:string,values?:readonly unknown[]) {
      calls.push({sql,values});
      if(sql.trimStart().toLowerCase().startsWith("update")) return {rows:(opts.updateRows??[{id:DOC,candidate_id:CANDIDATE,document_status:"ACCEPTED"}]) as T[]};
      if(opts.auditFails && sql.includes("insert into public.audit_events")) throw new Error("audit unavailable");
      return {rows:[]};
    }
  };
  const reviewer={actorId:"founder-operator-7",hasPermission:async(p:string)=>p==="candidate.documents.accept"};
  return {db,calls,reviewer};
}

test("status update and audit use expected-state predicate and stable audit fields",async()=>{
 const f=fixture();
 const result=await reviewCandidateDocument(f.db,f.reviewer,command);
 assert.deepEqual(result,{documentId:DOC,previousStatus:"UNDER_REVIEW",status:"ACCEPTED"});
 assert.match(f.calls[0].sql,/document_status = \$5/);
 assert.deepEqual(f.calls[0].values,[DOC,"ACCEPTED",f.reviewer.actorId,command.reason,"UNDER_REVIEW"]);
 assert.match(f.calls[1].sql,/insert into public\.audit_events/);
 assert.equal(f.calls[1].values?.[3],command.correlationId);
 assert.equal(f.calls[1].values?.[5],CANDIDATE);
});

test("permission denied before any database mutation",async()=>{
 const f=fixture();
 await assert.rejects(()=>reviewCandidateDocument(f.db,{actorId:"operator",hasPermission:()=>false},command),/PERMISSION_REQUIRED/);
 assert.equal(f.calls.length,0);
});

test("optimistic conflict fails without audit insert",async()=>{
 const f=fixture({updateRows:[]});
 await assert.rejects(()=>reviewCandidateDocument(f.db,f.reviewer,command),/STATUS_CONFLICT_OR_NOT_FOUND/);
 assert.equal(f.calls.length,1);
});

test("audit failure propagates so transaction runtime can roll back status",async()=>{
 const f=fixture({auditFails:true});
 await assert.rejects(()=>reviewCandidateDocument(f.db,f.reviewer,command),/audit unavailable/);
 assert.equal(f.calls.length,2);
});

test("rejects weak reason and mismatched expected state",async()=>{
 const f=fixture();
 await assert.rejects(()=>reviewCandidateDocument(f.db,f.reviewer,{...command,reason:"bad"}),/REVIEW_REASON_REQUIRED/);
 await assert.rejects(()=>reviewCandidateDocument(f.db,f.reviewer,{...command,expectedStatus:"UPLOADED"}),/EXPECTED_STATUS_INVALID/);
 assert.equal(f.calls.length,0);
});
