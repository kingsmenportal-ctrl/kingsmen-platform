import { requireReviewerSession, reviewerFetch, reviewerFail } from "../../../../lib/n07-reviewer-runtime";
const fail=(status:number,code:string,error:string)=>reviewerFail(status,code,error);
export async function POST(request:Request){
 const auth=await requireReviewerSession(request,["FINANCE_REVIEWER"]);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 let input:unknown;try{input=await request.json();}catch{return fail(400,"INVALID_JSON","Send valid JSON.");}
 const x=input&&typeof input==="object"?input as Record<string,unknown>:{};
 const action=typeof x.action==="string"?x.action:"";
 const orderId=typeof x.orderId==="string"?x.orderId.trim():"";
 const entitlementId=typeof x.entitlementId==="string"?x.entitlementId.trim():"";
 const reason=typeof x.reason==="string"?x.reason.trim().slice(0,2000):"";
 const key=typeof x.idempotencyKey==="string"?x.idempotencyKey.trim().slice(0,200):"";
 if(reason.length<12||key.length<8)return fail(400,"AUDIT_FIELDS_REQUIRED","A reason of at least 12 characters and an idempotency key are required.");
 const actorType=auth.session.roles.includes("PLATFORM_ADMIN")?"PLATFORM_ADMIN":"FINANCE_REVIEWER";
 try{
  let rpcPath:string,body:Record<string,unknown>;
  if(action==="HOLD"){
   if(!/^[0-9a-f-]{36}$/i.test(orderId))return fail(400,"ORDER_ID_REQUIRED","A valid order ID is required.");
   rpcPath="/rest/v1/rpc/n11_hold_entitlement_for_order";
   body={p_order_id:orderId,p_actor_type:actorType,p_actor_auth_user_id:auth.session.userId,p_reason:reason,p_idempotency_key:key};
  }else if(action==="REVOKE"){
   if(!/^[0-9a-f-]{36}$/i.test(entitlementId))return fail(400,"ENTITLEMENT_ID_REQUIRED","A valid entitlement ID is required.");
   rpcPath="/rest/v1/rpc/n11_transition_entitlement";
   body={p_entitlement_id:entitlementId,p_target_status:"REVOKED",p_actor_type:actorType,p_actor_auth_user_id:auth.session.userId,p_reason:reason,p_idempotency_key:key};
  }else return fail(400,"UNKNOWN_ENTITLEMENT_ACTION","Supported actions: HOLD, REVOKE. Activation is reserved for the verified PayFast event path.");
  const r=await reviewerFetch(auth.session,rpcPath,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok)return fail(409,"ENTITLEMENT_TRANSITION_REJECTED","The audited entitlement transition was rejected. Check order/entitlement state and the approved N11 migration.");
  const result=await r.json().catch(()=>null);
  const entitlementIdResult=typeof result==="string"?result:Array.isArray(result)?result[0]:null;
  if(!entitlementIdResult)return fail(502,"ENTITLEMENT_TRANSITION_UNCONFIRMED","The entitlement transition returned no result.");
  return Response.json({ok:true,productionReady:false,action,entitlementId:typeof entitlementIdResult==="string"?entitlementIdResult:entitlementIdResult.id||entitlementId,activationRule:"Reviewer actions cannot grant entitlements; only verified financial events can activate service."},{headers:{"cache-control":"no-store"}});
 }catch{return fail(503,"ENTITLEMENT_TRANSITION_FAILED","Entitlement transition failed; inspect the event history before retrying.");}
}
