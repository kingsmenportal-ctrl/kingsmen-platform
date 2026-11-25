import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED = new Set(["https://kingsmen-portal-staging.netlify.app", "http://localhost:8888", "http://127.0.0.1:8888"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const pathwayForSector: Record<string,string> = {
  UNIVERSITY: "HIGHER_EDUCATION", CAO: "HIGHER_EDUCATION", TVET: "TVET",
  SETA: "SETA_LEARNERSHIP", LEARNERSHIP: "SETA_LEARNERSHIP",
  INTERNSHIP: "INTERNSHIP", APPRENTICESHIP: "APPRENTICESHIP", EMPLOYER: "EMPLOYMENT",
  BURSARY: "HIGHER_EDUCATION", NSFAS: "HIGHER_EDUCATION", QCTO: "SETA_LEARNERSHIP",
  ACCOMMODATION: "HIGHER_EDUCATION", PRIVATE_COLLEGE: "HIGHER_EDUCATION"
};
function reply(status:number, body:Record<string,unknown>, origin:string|null) {
  const headers:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"};
  if(origin&&(ALLOWED.has(origin)||/^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin)))headers["Access-Control-Allow-Origin"]=origin;
  return new Response(JSON.stringify(body),{status,headers});
}
function isAllowed(origin:string) { return ALLOWED.has(origin)||/^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin); }

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("Origin");
  if(origin&&!isAllowed(origin))return reply(403,{ok:false,code:"ORIGIN_NOT_ALLOWED",error:"Origin not allowed."},null);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
    ...(origin&&isAllowed(origin)?{"Access-Control-Allow-Origin":origin}:{}),
    "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"600","Vary":"Origin"
  }});
  if(req.method!=="POST")return reply(405,{ok:false,code:"METHOD_NOT_ALLOWED"},origin);
  if(!URL||!ANON||!SERVICE)return reply(503,{ok:false,code:"NOT_CONFIGURED",error:"Verified opportunity saving is not configured."},origin);
  const token=/^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization")??"")?.[1];
  if(!token)return reply(401,{ok:false,code:"AUTHENTICATION_REQUIRED",error:"Sign in to save an opportunity."},origin);
  const auth=createClient(URL,ANON,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:userData,error:authError}=await auth.auth.getUser(token);
  if(authError||!userData.user)return reply(401,{ok:false,code:"SESSION_INVALID",error:"Your session is invalid or expired."},origin);
  let payload:Record<string,unknown>;
  try{const raw=await req.text();if(raw.length>8000)return reply(413,{ok:false,code:"REQUEST_TOO_LARGE"},origin);payload=JSON.parse(raw) as Record<string,unknown>;}catch{return reply(400,{ok:false,code:"INVALID_JSON"},origin);}
  if(payload.action!=="save")return reply(400,{ok:false,code:"ACTION_NOT_SUPPORTED",error:"Use save."},origin);
  const matchRef=typeof payload.match_ref==="string"?payload.match_ref.trim():"";
  if(!matchRef||matchRef.length>160)return reply(400,{ok:false,code:"MATCH_REFERENCE_REQUIRED",error:"A valid N15 match reference is required."},origin);

  const admin=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:link,error:linkError}=await admin.from("candidate_auth_identity_links")
    .select("candidate_id,link_status,verified_at,verified_by").eq("supabase_user_id",userData.user.id).maybeSingle();
  if(linkError)return reply(503,{ok:false,code:"IDENTITY_LOOKUP_FAILED"},origin);
  const verifiedAt=Date.parse(link?.verified_at??"");
  if(!link||link.link_status!=="VERIFIED"||!Number.isFinite(verifiedAt)||verifiedAt>Date.now()||typeof link.verified_by!=="string"||!UUID.test(link.verified_by))
    return reply(403,{ok:false,code:"IDENTITY_REVIEW_REQUIRED",error:"An authorised reviewer must verify your candidate identity before an opportunity can be saved to an application."},origin);
  const candidateId=String(link.candidate_id);

  const {data:candidate,error:candidateError}=await admin.from("candidates")
    .select("id,public_ref").eq("id",candidateId).maybeSingle();
  if(candidateError||!candidate?.public_ref) {
    console.error("candidate consent identity lookup failed",candidateError?.code??"missing_candidate");
    return reply(503,{ok:false,code:"CONSENT_LOOKUP_FAILED",error:"The candidate consent state could not be verified."},origin);
  }
  const {data:consentRows,error:consentError}=await admin.from("privacy_consent_records")
    .select("consent_status,revoked_at,consent_text_snapshot,granted_at")
    .eq("candidate_ref",candidate.public_ref).eq("consent_type","PROFILE_PROCESSING")
    .order("granted_at",{ascending:false}).order("id",{ascending:false}).limit(20);
  if(consentError) {
    console.error("candidate consent lookup failed",consentError.code??"unknown");
    return reply(503,{ok:false,code:"CONSENT_LOOKUP_FAILED",error:"The candidate consent state could not be verified."},origin);
  }
  const latestConsent=(consentRows??[])[0]??null;
  const consentActive=Boolean(latestConsent?.consent_status==="ACTIVE"&&!latestConsent?.revoked_at&&
    typeof latestConsent?.consent_text_snapshot==="string"&&latestConsent.consent_text_snapshot.trim().length>0&&
    Number.isFinite(Date.parse(latestConsent?.granted_at??""))&&Date.parse(latestConsent.granted_at)<=Date.now());
  if(!consentActive) {
    return reply(403,{ok:false,code:"CONSENT_REQUIRED",error:"Active profile-processing consent is required before saving an opportunity to the application workbench. Review consent in your profile and try again."},origin);
  }
  const {data:match,error:matchError}=await admin.from("candidate_opportunity_matches")
    .select("candidate_match_ref,candidate_ref,programme_ref,provider_ref,sector,match_status,source_confidence,human_review_required,sealed_exact_target,recommendation_summary")
    .eq("candidate_match_ref",matchRef).eq("candidate_ref",candidateId).eq("match_status","APPROVED")
    .eq("source_confidence","OFFICIAL_VERIFIED").eq("human_review_required",false).eq("sealed_exact_target",false).maybeSingle();
  if(matchError)return reply(503,{ok:false,code:"MATCH_LOOKUP_FAILED"},origin);
  if(!match)return reply(409,{ok:false,code:"VERIFIED_MATCH_NOT_AVAILABLE",error:"This match is no longer approved for this candidate."},origin);

  const {data:programme,error:programmeError}=await admin.from("opportunity_programmes").select("*").eq("programme_ref",match.programme_ref).maybeSingle();
  const {data:provider,error:providerError}=await admin.from("opportunity_providers").select("*").eq("provider_ref",match.provider_ref).maybeSingle();
  if(programmeError||providerError)return reply(503,{ok:false,code:"SOURCE_LOOKUP_FAILED"},origin);
  if(!programme||!provider||programme.opening_status!=="OPEN"||programme.candidate_facing_safe!==true||
    programme.source_confidence!=="OFFICIAL_VERIFIED"||provider.source_confidence!=="OFFICIAL_VERIFIED"||
    provider.safe_to_recommend!==true||provider.accreditation_status==="REJECTED"||
    !Array.isArray(programme.evidence_refs)||programme.evidence_refs.length===0||
    !Array.isArray(provider.evidence_refs)||provider.evidence_refs.length===0||
    typeof programme.exact_link!=="string"||!/^https:\/\//i.test(programme.exact_link))
    return reply(409,{ok:false,code:"SOURCE_GATE_FAILED",error:"The opportunity no longer satisfies the official-source publication requirements."},origin);

  const now=new Date();
  const {data:observations,error:observationError}=await admin.from("external_source_observations")
    .select("observed_at,last_checked_at,stale_after,evidence_refs")
    .eq("observation_status","VERIFIED").eq("source_confidence","OFFICIAL_VERIFIED").eq("source_url",programme.exact_link)
    .gte("last_checked_at",new Date(now.getTime()-24*60*60*1000).toISOString())
    .lte("observed_at",now.toISOString()).lte("last_checked_at",now.toISOString()).gt("stale_after",now.toISOString())
    .order("last_checked_at",{ascending:false}).limit(1);
  if(observationError)return reply(503,{ok:false,code:"SOURCE_EVIDENCE_LOOKUP_FAILED"},origin);
  const observation=observations?.[0];
  const observed=Date.parse(observation?.observed_at??"");
  const checked=Date.parse(observation?.last_checked_at??"");
  const stale=Date.parse(observation?.stale_after??"");
  if(!observation||!Number.isFinite(observed)||!Number.isFinite(checked)||!Number.isFinite(stale)||
    observed>checked||checked>now.getTime()||stale<=now.getTime()||stale<=checked||
    !Array.isArray(observation.evidence_refs)||!observation.evidence_refs.length)
    return reply(409,{ok:false,code:"SOURCE_EVIDENCE_STALE",error:"The official-source evidence is missing or stale. Refresh the opportunity before saving it."},origin);

  const sector=String(match.sector??"");
  let pathway=pathwayForSector[sector];
  if(sector==="BURSARY"||sector==="NSFAS"||sector==="ACCOMMODATION"||sector==="PRIVATE_COLLEGE") {
    const requested=typeof payload.pathway_type==="string"?payload.pathway_type:"";
    const allowed:Record<string,string[]>={BURSARY:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP"],NSFAS:["HIGHER_EDUCATION","TVET"],ACCOMMODATION:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"],PRIVATE_COLLEGE:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP"]};
    if(!allowed[sector]?.includes(requested))return reply(400,{ok:false,code:"PATHWAY_REQUIRED",error:"Choose a pathway that matches this opportunity."},origin);
    pathway=requested;
  }
  if(!pathway)return reply(409,{ok:false,code:"PATHWAY_UNMAPPED",error:"This opportunity classification needs a pathway mapping."},origin);
  const deadlineResult=await admin.from("opportunity_deadlines").select("opens_at,closes_at,deadline_status,evidence_refs,timezone")
    .eq("programme_ref",programme.programme_ref).eq("provider_ref",provider.provider_ref).eq("deadline_status","CONFIRMED")
    .eq("source_confidence","OFFICIAL_VERIFIED").gt("closes_at",now.toISOString()).order("closes_at",{ascending:true}).limit(1);
  if(deadlineResult.error)return reply(503,{ok:false,code:"DEADLINE_LOOKUP_FAILED"},origin);
  const deadline=deadlineResult.data?.[0]??null;
  if(deadline&&(!Array.isArray(deadline.evidence_refs)||!deadline.evidence_refs.length))
    return reply(409,{ok:false,code:"DEADLINE_EVIDENCE_INVALID"},origin);
  const closingDate=deadline?.closes_at?String(deadline.closes_at).slice(0,10):null;
  const officialUrl=programme.exact_link;
  const title=String(programme.programme_name??"").trim().slice(0,180);
  const organisation=String(provider.provider_name??"Official provider").trim().slice(0,180)||"Official provider";
  const targetKey=`n15:${match.candidate_match_ref}`.slice(0,120);
  const {data:existingTarget,error:targetLookupError}=await admin.from("candidate_master_application_targets")
    .select("id,application_id,planning_status").eq("candidate_id",candidateId).eq("target_key",targetKey).maybeSingle();
  if(targetLookupError)return reply(503,{ok:false,code:"TARGET_LOOKUP_FAILED"},origin);
  if(!existingTarget) {
    const {error:targetInsertError}=await admin.from("candidate_master_application_targets").insert({
      candidate_id:candidateId,target_key:targetKey,pathway_type:pathway,provider_name:organisation,
      programme_or_role:title,provider_application_url:officialUrl,
      source_reference:`N15 match reference: ${match.candidate_match_ref}`,source_confidence:"OFFICIAL_VERIFIED",
      planning_status:"SAVED",idempotency_key:`n15-save:${candidateId}:${match.candidate_match_ref}`,
      created_by_auth_user_id:userData.user.id
    });
    if(targetInsertError&&targetInsertError.code!=="23505")return reply(503,{ok:false,code:"TARGET_SAVE_FAILED",error:"The opportunity could not be saved to the application workbench."},origin);
  }
  const {data:target,error:targetReadError}=await admin.from("candidate_master_application_targets")
    .select("id,application_id,planning_status").eq("candidate_id",candidateId).eq("target_key",targetKey).single();
  if(targetReadError||!target)return reply(503,{ok:false,code:"TARGET_READ_FAILED"},origin);

  const {data:applicationResult,error:applicationError}=await auth.rpc("prepare_candidate_application_from_master_target",{p_target_key:targetKey});
  if(applicationError) {
    console.error("candidate master application prepare failed",applicationError.code??"unknown");
    return reply(503,{ok:false,code:"APPLICATION_PREPARATION_FAILED",savedTarget:true,targetKey,message:"The opportunity was saved, but the parent application could not be prepared yet. Reload and retry."},origin);
  }
  if(!applicationResult||applicationResult.ok!==true) {
    const code=typeof applicationResult?.code==="string"?applicationResult.code:"APPLICATION_PREPARATION_FAILED";
    return reply(409,{ok:false,code,savedTarget:true,targetKey,message:"The opportunity target was saved, but the application lifecycle declined to create a draft."},origin);
  }

  const {data:savedOpportunity,error:savedOpportunityError}=await admin.from("candidate_workspace_saved_opportunities").upsert({
    candidate_id:candidateId,title,organisation,official_url:officialUrl,pathway:pathway.toLowerCase(),closing_date:closingDate,updated_at:now.toISOString()
  },{onConflict:"candidate_id,official_url"}).select("id").single();
  if(savedOpportunityError||!savedOpportunity) {
    console.error("candidate workbench opportunity link failed",savedOpportunityError?.code??"unknown");
    return reply(200,{ok:true,targetKey,application:applicationResult,trackerLinked:false,message:"Parent application draft created. The legacy tracker link could not be confirmed; the parent draft remains saved."},origin);
  }
  const {data:existingTracker,error:trackerLookupError}=await admin.from("candidate_application_tracker")
    .select("id").eq("candidate_id",candidateId).eq("saved_opportunity_id",savedOpportunity.id).maybeSingle();
  if(trackerLookupError)return reply(200,{ok:true,targetKey,application:applicationResult,trackerLinked:false,message:"Parent application draft created. Tracker status needs a refresh."},origin);
  let trackerId=existingTracker?.id??null;
  if(!trackerId) {
    const {data:newTracker,error:newTrackerError}=await admin.from("candidate_application_tracker").insert({
      candidate_id:candidateId,saved_opportunity_id:savedOpportunity.id,status:"PREPARING",
      candidate_note:"Draft prepared from an approved N15 match. Provider submission has not occurred.",
      evidence_reference:`N15 match reference: ${match.candidate_match_ref}; source checked: ${observation.last_checked_at}`
    }).select("id").single();
    if(newTrackerError||!newTracker) {
      console.error("candidate tracker link failed",newTrackerError?.code??"unknown");
      return reply(200,{ok:true,targetKey,application:applicationResult,trackerLinked:false,message:"Parent application draft created. Tracker status needs a refresh."},origin);
    }
    trackerId=newTracker.id;
  }
  return reply(200,{
    ok:true,targetKey,trackerId,trackerLinked:true,application:applicationResult,
    opportunity:{title,provider:organisation,pathway,officialUrl,closingDate,sourceCheckedAt:observation.last_checked_at},
    message:"Opportunity saved and parent application draft prepared. No provider submission has occurred."
  },origin);
});
