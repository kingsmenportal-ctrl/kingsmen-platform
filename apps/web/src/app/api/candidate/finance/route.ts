import {requireCandidateSession,supabaseAdminFetch} from "../../../../lib/candidate-document-runtime";
import {getPayFastRuntime} from "../../../../lib/payfast-runtime";
const fail=(status:number,code:string,error:string)=>Response.json({ok:false,productionReady:false,code,error},{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
async function query(config:Parameters<typeof supabaseAdminFetch>[0],table:string,params:URLSearchParams){return supabaseAdminFetch(config,"/rest/v1/"+table+"?"+params.toString());}
export async function GET(request:Request){
 const auth=await requireCandidateSession(request);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 const packages=new URLSearchParams({select:"id,package_code,display_name,currency,price_minor,entitlement_snapshot",active:"eq.true",order:"price_minor.asc"});
 const orders=new URLSearchParams({select:"id,order_ref,package_code,package_name,currency,amount_minor,status,created_at,updated_at,paid_at",candidate_id:"eq."+auth.session.candidateId,order:"created_at.desc",limit:"100"});
 const refunds=new URLSearchParams({select:"id,refund_ref,order_id,amount_minor,reason,status,reviewer_note,created_at,reviewed_at,completed_at",candidate_id:"eq."+auth.session.candidateId,order:"created_at.desc",limit:"100"});
 try{const [p,o,r]=await Promise.all([query(auth.config,"service_packages",packages),query(auth.config,"candidate_service_orders",orders),query(auth.config,"candidate_refund_requests",refunds)]);if(!p.ok||!o.ok||!r.ok)return fail(502,"FINANCE_QUERY_FAILED","Finance records are unavailable; confirm N10 migrations are applied.");const [packageRows,orderRows,refundRows]=await Promise.all([p.json(),o.json(),r.json()]);if(!Array.isArray(packageRows)||!Array.isArray(orderRows)||!Array.isArray(refundRows))return fail(502,"FINANCE_INVALID_RESPONSE","Finance service returned an invalid response.");return Response.json({ok:true,productionReady:false,packages:packageRows,orders:orderRows,refunds:refundRows,paymentProviderConfigured:Boolean(getPayFastRuntime()),paymentStatusSource:"server-validated PayFast ITN only for provider-backed activation"},{headers:{"cache-control":"no-store"}});}catch{return fail(503,"FINANCE_UNAVAILABLE","Finance service is temporarily unavailable.");}
}
export async function POST(request:Request){
 const auth=await requireCandidateSession(request);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 let body:unknown;try{body=await request.json();}catch{return fail(400,"INVALID_JSON","Send valid JSON.");}
 const x=body&&typeof body==="object"?body as Record<string,unknown>:{},action=typeof x.action==="string"?x.action:"",key=typeof x.idempotencyKey==="string"?x.idempotencyKey.trim().slice(0,200):"";
 if(!key)return fail(400,"IDEMPOTENCY_KEY_REQUIRED","An idempotency key is required.");
 try{
  if(action==="CREATE_ORDER"){
   const code=typeof x.packageCode==="string"?x.packageCode.trim().toUpperCase():"";
   if(!/^[A-Z0-9_]{2,80}$/.test(code))return fail(400,"PACKAGE_CODE_INVALID","Select a package from the official catalogue.");
   const created=await supabaseAdminFetch(auth.config,"/rest/v1/rpc/n10_create_candidate_order",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({p_candidate_id:auth.session.candidateId,p_actor_auth_user_id:auth.session.userId,p_package_code:code,p_idempotency_key:key})});
   if(!created.ok)return fail(409,"ORDER_CREATE_REJECTED","Order creation was rejected. Confirm the active package, candidate identity link and N10 atomic-workflow migration.");
   const rows=await created.json();if(!Array.isArray(rows)||rows.length!==1)return fail(502,"ORDER_CREATE_UNCONFIRMED","Atomic order creation returned no unique result.");
   const row=rows[0],order={id:row.id,order_ref:row.order_ref,package_code:row.package_code,package_name:row.package_name,currency:row.currency,amount_minor:row.amount_minor,status:row.status,created_at:row.created_at};
   return Response.json({ok:true,productionReady:false,order,reused:row.reused===true,checkoutConfigured:Boolean(getPayFastRuntime()),message:"Order and audit records were committed atomically. Creating an order never takes payment or marks it paid."},{status:row.reused?200:201,headers:{"cache-control":"no-store"}});
  }
  if(action==="REQUEST_REFUND"){
   const orderId=typeof x.orderId==="string"?x.orderId.trim():"",reason=typeof x.reason==="string"?x.reason.trim().slice(0,3000):"";
   if(!/^[0-9a-f-]{36}$/i.test(orderId)||reason.length<20)return fail(400,"REFUND_FIELDS_REQUIRED","A valid order and reason of at least 20 characters are required.");
   const created=await supabaseAdminFetch(auth.config,"/rest/v1/rpc/n10_request_candidate_refund",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({p_candidate_id:auth.session.candidateId,p_actor_auth_user_id:auth.session.userId,p_order_id:orderId,p_reason:reason,p_idempotency_key:key})});
   if(!created.ok)return fail(409,"REFUND_REQUEST_REJECTED","Refund request requires a paid order with a verified PayFast payment event and a valid candidate identity link.");
   const rows=await created.json();if(!Array.isArray(rows)||rows.length!==1)return fail(502,"REFUND_REQUEST_UNCONFIRMED","Atomic refund request returned no unique result.");
   const row=rows[0],refund={id:row.id,refund_ref:row.refund_ref,order_id:row.order_id,amount_minor:row.amount_minor,reason:row.reason,status:row.status,created_at:row.created_at};
   return Response.json({ok:true,productionReady:false,refund,reused:row.reused===true,automaticApproval:false,message:"Refund request and audit records were committed atomically; finance approval and PayFast reconciliation are still required."},{status:row.reused?200:201,headers:{"cache-control":"no-store"}});
  }
  return fail(400,"UNKNOWN_FINANCE_ACTION","Supported actions: CREATE_ORDER, REQUEST_REFUND.");
 }catch{return fail(503,"FINANCE_OPERATION_FAILED","Finance operation could not be completed; check the current order/refund state before retrying.");}
}
