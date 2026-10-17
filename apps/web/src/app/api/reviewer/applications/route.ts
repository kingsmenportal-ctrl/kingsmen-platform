import {requireReviewerSession,reviewerFetch,reviewerFail} from "../../../../lib/n07-reviewer-runtime";
export async function GET(request:Request){
 const auth=await requireReviewerSession(request,["APPLICATION_REVIEWER","PROVIDER_OPERATOR","EVIDENCE_VERIFIER"]);if(!auth.ok)return reviewerFail(auth.status,auth.code,auth.message);
 const url=new URL(auth.session.config.url+"/rest/v1/candidate_applications");
 url.searchParams.set("select","id,application_ref,candidate_id,opportunity_id,pathway_type,status,readiness_status,readiness_snapshot,provider_reference,submission_evidence_ref,submitted_at,last_status_reason,created_at,updated_at");
 url.searchParams.set("status","in.(READY_FOR_REVIEW,READY_TO_SUBMIT,SUBMISSION_PENDING,SUBMITTED_CONFIRMED,PROVIDER_REVIEW,MANUAL_ACTION_REQUIRED)");
 url.searchParams.set("order","updated_at.asc");url.searchParams.set("limit","100");
 try{const r=await reviewerFetch(auth.session,url.pathname+url.search);if(!r.ok)return reviewerFail(502,"REVIEW_QUEUE_QUERY_FAILED","Reviewer queue unavailable.");const rows=await r.json();if(!Array.isArray(rows))return reviewerFail(502,"REVIEW_QUEUE_INVALID","Review queue returned invalid data.");return Response.json({ok:true,productionReady:false,queue:rows,reviewerRoles:auth.session.roles,submissionIsNotAssumed:true},{headers:{"cache-control":"no-store"}});}
 catch{return reviewerFail(503,"REVIEW_QUEUE_UNAVAILABLE","Reviewer queue is temporarily unavailable.");}
}
