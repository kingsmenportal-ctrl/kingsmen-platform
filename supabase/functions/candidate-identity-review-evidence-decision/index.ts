import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const URL=Deno.env.get("SUPABASE_URL")??"";
const ANON=Deno.env.get("SUPABASE_ANON_KEY")??"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const ORIGINS=new Set(["https://kingsmen-portal-staging.netlify.app","http://localhost:8888","http://127.0.0.1:8888"]);
const allowed=(o:string)=>ORIGINS.has(o)||/^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(o);
const reply=(s:number,b:Record<string,unknown>,o:string|null)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Pragma":"no-cache","Vary":"Origin",...(o&&allowed(o)?{"Access-Control-Allow-Origin":o}:{})}});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!allowed(origin))return reply(403,{error:"Origin not allowed."},null);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{...(origin&&allowed(origin)?{"Access-Control-Allow-Origin":origin}:{}),"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
 if(req.method!=="POST")return reply(405,{error:"Method not allowed."},origin);
 if(!URL||!ANON||!SERVICE)return reply(503,{error:"Evidence service is not configured."},origin);
 const token=/^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization")??"")?.[1];
 if(!token)return reply(401,{error:"A signed-in reviewer session is required."},origin);
 const auth=createClient(URL,ANON,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:userData,error:userError}=await auth.auth.getUser(token);
 if(userError||!userData.user)return reply(401,{error:"Your session is invalid or expired."},origin);
 let body:Record<string,unknown>;try{body=await req.json()}catch{return reply(400,{error:"Valid JSON is required."},origin)}
 const evidenceId=typeof body.evidence_id==="string"?body.evidence_id.trim():"";
 const decision=typeof body.decision==="string"?body.decision.trim().toUpperCase():"";
 const note=typeof body.note==="string"?body.note.trim():"";
 if(!/^[0-9a-f-]{36}$/i.test(evidenceId))return reply(400,{error:"A valid evidence ID is required."},origin);
 if(!["ACCEPTED","REJECTED"].includes(decision))return reply(400,{error:"Choose ACCEPTED or REJECTED."},origin);
 if(note.length<3||note.length>1200)return reply(400,{error:"A review note of 3–1,200 characters is required."},origin);
 const service=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:grant,error:grantError}=await service.from("platform_reviewers").select("auth_user_id").eq("auth_user_id",userData.user.id).eq("role_code","IDENTITY_REVIEWER").eq("is_active",true).is("revoked_at",null).maybeSingle();
 if(grantError)return reply(503,{error:"Reviewer permission could not be checked."},origin);
 if(!grant)return reply(403,{error:"Not authorised to review identity evidence."},origin);
 const {data:evidence,error:evidenceError}=await service.from("candidate_identity_review_evidence").select("id,request_id,review_status").eq("id",evidenceId).maybeSingle();
 if(evidenceError)return reply(503,{error:"Evidence metadata could not be loaded."},origin);
 if(!evidence)return reply(404,{error:"Evidence not found."},origin);
 if(evidence.review_status!=="PENDING")return reply(409,{error:"Evidence was already reviewed; conflicting re-review is not allowed."},origin);
 const now=new Date().toISOString();
 const {data:updated,error:updateError}=await service.from("candidate_identity_review_evidence").update({review_status:decision,reviewed_by:userData.user.id,reviewed_at:now,reviewer_note:note}).eq("id",evidenceId).eq("review_status","PENDING").select("id,request_id,review_status,reviewed_at,reviewed_by").maybeSingle();
 if(updateError||!updated)return reply(409,{error:"Evidence review could not be recorded. Refresh and inspect current state."},origin);
 const {error:auditError}=await service.from("candidate_identity_review_audit").insert({request_id:evidence.request_id,actor_auth_user_id:userData.user.id,actor_role:"IDENTITY_REVIEWER",action:decision==="ACCEPTED"?"EVIDENCE_ACCEPTED":"EVIDENCE_REJECTED",note,before_status:"EVIDENCE_PENDING",after_status:decision});
 if(auditError){
   await service.from("candidate_identity_review_evidence").update({review_status:"PENDING",reviewed_by:null,reviewed_at:null,reviewer_note:null}).eq("id",evidenceId).eq("reviewed_by",userData.user.id).eq("review_status",decision);
   console.error("identity evidence audit insert failed",auditError.code??"unknown");
   return reply(503,{error:"Evidence audit could not be recorded. The review update was rolled back where possible."},origin);
 }
 return reply(200,{evidence_id:updated.id,request_id:updated.request_id,review_status:updated.review_status,reviewed_at:updated.reviewed_at,message:"Evidence review and audit event recorded."},origin);
});
