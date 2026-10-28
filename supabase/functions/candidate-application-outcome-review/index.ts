import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const origins = new Set(["https://kingsmen-portal-staging.netlify.app","http://localhost:8888","http://127.0.0.1:8888"]);
const isAllowed = (origin:string) => origins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
function reply(status:number,body:Record<string,unknown>,origin:string|null){const headers:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Pragma":"no-cache","Vary":"Origin"};if(origin&&isAllowed(origin))headers["Access-Control-Allow-Origin"]=origin;return new Response(JSON.stringify(body),{status,headers});}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!isAllowed(origin))return reply(403,{error:"Origin not allowed."},null);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{...(origin&&isAllowed(origin)?{"Access-Control-Allow-Origin":origin}:{}),"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"600","Vary":"Origin"}});
 if(req.method!=="POST")return reply(405,{error:"Method not allowed."},origin);
 if(!URL||!ANON||!SERVICE)return reply(503,{error:"Outcome review service is not configured."},origin);
 const token=/^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization")??"")?.[1];
 if(!token)return reply(401,{error:"A signed-in reviewer session is required."},origin);
 const auth=createClient(URL,ANON,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await auth.auth.getUser(token);
 if(authError||!authData.user)return reply(401,{error:"Reviewer session is invalid or expired."},origin);
 let payload:Record<string,unknown>;
 try{payload=await req.json();}catch{return reply(400,{error:"Request body must be valid JSON."},origin);}
 const admin=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:role,error:roleError}=await admin.from("platform_reviewers").select("role_code")
   .eq("auth_user_id",authData.user.id).eq("is_active",true).is("revoked_at",null)
   .in("role_code",["APPLICATION_REVIEWER","PLATFORM_ADMIN"]).limit(1).maybeSingle();
 if(roleError){console.error("outcome reviewer role lookup failed",roleError.code??"unknown");return reply(503,{error:"Could not verify reviewer permissions."},origin);}
 if(!role)return reply(403,{code:"APPLICATION_OUTCOME_REVIEWER_REQUIRED",error:"An active application-outcome reviewer permission is required."},origin);

 if(payload.action==="list_ready"){
   const {data:evidence,error:evidenceError}=await admin.from("candidate_application_evidence")
    .select("id,evidence_ref,application_id,candidate_id,evidence_type,source_label,captured_at,verification_status,verified_at,verification_note,created_at")
    .eq("evidence_type","PROVIDER_OUTCOME_NOTICE").eq("verification_status","VERIFIED")
    .not("verified_by_auth_user_id","is",null).not("verified_at","is",null)
    .order("verified_at",{ascending:false}).limit(200);
   if(evidenceError){console.error("outcome review queue query failed",evidenceError.code??"unknown");return reply(503,{error:"Could not load verified outcome notices."},origin);}
   const ids=[...new Set((evidence??[]).map((e:any)=>e.application_id))];
   let apps:any[]=[];
   if(ids.length){
     const result=await admin.from("candidate_applications")
      .select("id,application_ref,candidate_id,opportunity_id,pathway_type,status,provider_reference,candidate_opportunities(title,provider_name,source_url)")
      .in("id",ids).limit(200);
     if(result.error){console.error("outcome review application query failed",result.error.code??"unknown");return reply(503,{error:"Could not load linked application details."},origin);}
     apps=result.data??[];
   }
   const queue=(evidence??[]).map((e:any)=>({...e,application:apps.find((a:any)=>a.id===e.application_id)??null}));
   return reply(200,{ready:true,queue,reviewer_role:role.role_code},origin);
 }
 if(payload.action==="confirm"){
   const applicationId=typeof payload.application_id==="string"?payload.application_id:"";
   const evidenceRef=typeof payload.evidence_ref==="string"?payload.evidence_ref.trim():"";
   const outcomeType=typeof payload.outcome_type==="string"?payload.outcome_type:"";
   const providerReference=typeof payload.provider_reference==="string"?payload.provider_reference.trim():"";
   const summary=typeof payload.summary==="string"?payload.summary.trim():"";
   const nextStep=typeof payload.next_step==="string"?payload.next_step.trim():"";
   if(!/^[0-9a-f-]{36}$/i.test(applicationId)||!evidenceRef||evidenceRef.length>200||
      !["PROVIDER_OFFER","PROVIDER_ACCEPTANCE","PROVIDER_REJECTION","ENROLMENT_CONFIRMED","PLACEMENT_CONFIRMED","EMPLOYMENT_STARTED"].includes(outcomeType)||
      providerReference.length>200||summary.length<12||summary.length>2000||nextStep.length>2000){
     return reply(400,{error:"Outcome decision fields are invalid."},origin);
   }
   const reviewer=createClient(URL,ANON,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
   const {data,error}=await reviewer.rpc("record_candidate_application_outcome",{
     p_application_id:applicationId,p_evidence_ref:evidenceRef,p_outcome_type:outcomeType,
     p_provider_reference:providerReference,p_summary:summary,p_next_step:nextStep
   });
   if(error){const status=error.code==="42501"?403:error.code==="P0002"?404:error.code==="22023"?400:error.code==="23514"?409:503;if(status===503)console.error("outcome decision RPC failed",error.code??"unknown");return reply(status,{error:status===403?"Application-outcome reviewer permission is required.":status===404?"Application not found.":status===400?"Outcome decision fields are invalid.":status===409?"Outcome cannot be confirmed until the required verified evidence and status gates pass.":"Could not persist the outcome decision."},origin);}
   return reply(200,{ready:true,result:data,message:"Provider outcome recorded in the append-only ledger against verified provider-outcome evidence."},origin);
 }
 return reply(400,{error:"Action must be list_ready or confirm."},origin);
});
