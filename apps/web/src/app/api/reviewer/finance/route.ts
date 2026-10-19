import {requireReviewerSession,reviewerFetch,reviewerFail} from "../../../../lib/n07-reviewer-runtime";
const fail=(status:number,code:string,error:string)=>reviewerFail(status,code,error);
export async function GET(request:Request){
 const auth=await requireReviewerSession(request,["FINANCE_REVIEWER"]);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 const o=new URLSearchParams({select:"id,order_ref,candidate_id,package_code,package_name,currency,amount_minor,status,created_at,paid_at",status:"in.(PENDING_PAYMENT,PAID,REFUND_REQUESTED,PAYMENT_FAILED,PARTIALLY_REFUNDED,REFUNDED)",order:"created_at.asc",limit:"100"});
 const r=new URLSearchParams({select:"id,refund_ref,order_id,candidate_id,amount_minor,reason,status,reviewer_note,created_at,reviewed_at,completed_at",status:"in.(REQUESTED,UNDER_REVIEW,APPROVED,PROCESSING,REJECTED,COMPLETED)",order:"created_at.asc",limit:"100"});
 try{const [a,b]=await Promise.all([reviewerFetch(auth.session,"/rest/v1/candidate_service_orders?"+o),reviewerFetch(auth.session,"/rest/v1/candidate_refund_requests?"+r)]);if(!a.ok||!b.ok)return fail(502,"FINANCE_QUEUE_FAILED","Finance queue unavailable; confirm N10 migrations are applied.");const [orders,refunds]=await Promise.all([a.json(),b.json()]);if(!Array.isArray(orders)||!Array.isArray(refunds))return fail(502,"FINANCE_QUEUE_INVALID","Finance queue returned invalid data.");return Response.json({ok:true,productionReady:false,orders,refunds,providerWebhookConfigured:false},{headers:{"cache-control":"no-store"}});}catch{return fail(503,"FINANCE_QUEUE_UNAVAILABLE","Finance queue temporarily unavailable.");}
}
export async function POST(request:Request){
 const auth=await requireReviewerSession(request,["FINANCE_REVIEWER"]);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 let body:unknown;try{body=await request.json();}catch{return fail(400,"INVALID_JSON","Send valid JSON.");}
 const x=body&&typeof body==="object"?body as Record<string,unknown>:{},action=typeof x.action==="string"?x.action:"",id=typeof x.id==="string"?x.id.trim():"",reason=typeof x.reason==="string"?x.reason.trim().slice(0,2000):"";
 if(!id||reason.length<12)return fail(400,"REVIEW_FIELDS_REQUIRED","Record identifier and a review reason of at least 12 characters are required.");
 try{
  if(action==="CONFIRM_MANUAL_PAYMENT"){
   const paymentRef=typeof x.paymentReference==="string"?x.paymentReference.trim().slice(0,200):"",locator=typeof x.evidenceLocator==="string"?x.evidenceLocator.trim().slice(0,1000):"",sha=typeof x.evidenceSha256==="string"?x.evidenceSha256.trim():"";
   if(!paymentRef||!locator||!/^[a-fA-F0-9]{64}$/.test(sha))return fail(400,"PAYMENT_EVIDENCE_REQUIRED","Payment reference, evidence locator and SHA-256 evidence hash are required.");
   const r=await reviewerFetch(auth.session,"/rest/v1/rpc/n10_confirm_manual_payment",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({p_order_id:id,p_actor_auth_user_id:auth.session.userId,p_payment_reference:paymentRef,p_evidence_locator:locator,p_evidence_sha256:sha,p_reason:reason})});
   if(!r.ok)return fail(409,"MANUAL_PAYMENT_REVIEW_REJECTED","Atomic manual review failed. Confirm reviewer role, order state and N10 atomic-workflow migration.");
   const rows=await r.json();if(!Array.isArray(rows)||rows.length!==1)return fail(502,"MANUAL_PAYMENT_REVIEW_UNCONFIRMED","Atomic manual review returned no unique result.");
   return Response.json({ok:true,productionReady:false,order:rows[0],evidenceRecorded:true,reused:rows[0].reused===true,message:"Manual finance review was recorded atomically. This is not a provider-verified PayFast event and does not qualify for N11 paid entitlement activation."},{headers:{"cache-control":"no-store"}});
  }
  if(action==="REVIEW_REFUND"){
   const decision=typeof x.decision==="string"?x.decision:"";
   if(!["APPROVE","REJECT"].includes(decision))return fail(409,"PROVIDER_REFUND_RECONCILIATION_REQUIRED","Refund completion is recorded only by the PayFast provider-ledger reconciliation endpoint.");
   const r=await reviewerFetch(auth.session,"/rest/v1/rpc/n10_review_refund_request",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({p_refund_id:id,p_actor_auth_user_id:auth.session.userId,p_decision:decision,p_reason:reason})});
   if(!r.ok)return fail(409,"REFUND_REVIEW_REJECTED","Atomic refund review failed. Confirm reviewer role, refund state and N10 atomic-workflow migration.");
   const rows=await r.json();if(!Array.isArray(rows)||rows.length!==1)return fail(502,"REFUND_REVIEW_UNCONFIRMED","Atomic refund review returned no unique result.");
   return Response.json({ok:true,productionReady:false,refund:rows[0],reused:rows[0].reused===true,status:rows[0].status,message:decision==="APPROVE"?"Refund approved. No provider operation has run yet.":"Refund rejected and order state restored atomically."},{headers:{"cache-control":"no-store"}});
  }
  return fail(400,"UNKNOWN_FINANCE_ACTION","Supported actions: CONFIRM_MANUAL_PAYMENT, REVIEW_REFUND.");
 }catch{return fail(503,"FINANCE_REVIEW_FAILED","Finance review failed; inspect the current recorded state before retrying.");}
}
