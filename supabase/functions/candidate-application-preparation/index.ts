import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const origins = new Set(["https://kingsmen-portal-staging.netlify.app","http://localhost:8888","http://127.0.0.1:8888"]);
function isAllowedOrigin(origin: string): boolean {
  return origins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}
const trackerStatuses = new Set(["SAVED","PREPARING","READY_TO_APPLY","SUBMITTED_CANDIDATE_REPORTED"]);
const itemStatuses = new Set(["NOT_STARTED","IN_PROGRESS","READY_CANDIDATE_REPORTED"]);
const pathwayMap: Record<string,string> = {"HIGHER_EDUCATION":"higher_education","TVET":"tvet","SETA":"seta_learnership","SETA_LEARNERSHIP":"seta_learnership","INTERNSHIP":"internship","INTERNSHIPS":"internship","APPRENTICESHIP":"apprenticeship","APPRENTICESHIPS":"apprenticeship","EMPLOYMENT":"employment","EMPLOYER":"employment","higher_education":"higher_education","tvet":"tvet","seta":"seta_learnership","seta_learnership":"seta_learnership","internship":"internship","internships":"internship","apprenticeship":"apprenticeship","apprenticeships":"apprenticeship","employment":"employment","employer":"employment"};
function reply(status:number, body:Record<string,unknown>, origin:string|null) {
 const headers:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"};
 if(origin&&isAllowedOrigin(origin))headers["Access-Control-Allow-Origin"]=origin;
 return new Response(JSON.stringify(body),{status,headers});
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!isAllowedOrigin(origin))return reply(403,{error:"Origin not allowed."},null);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{...(origin&&isAllowedOrigin(origin)?{"Access-Control-Allow-Origin":origin}:{}),"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"600","Vary":"Origin"}});
 if(req.method!=="POST")return reply(405,{error:"Method not allowed."},origin);
 if(!URL||!ANON||!SERVICE)return reply(503,{error:"Application preparation service is not configured."},origin);
 const token=/^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization")??"")?.[1];
 if(!token)return reply(401,{error:"A signed-in account is required."},origin);
 const auth=createClient(URL,ANON,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await auth.auth.getUser(token);
 if(authError||!authData.user)return reply(401,{error:"Your session is invalid or expired. Sign in again."},origin);
 let p:Record<string,unknown>;try{p=await req.json();}catch{return reply(400,{error:"Request body must be valid JSON."},origin);}
 const admin=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:link,error:linkError}=await admin.from("candidate_auth_identity_links").select("candidate_id").eq("supabase_user_id",authData.user.id).eq("link_status","VERIFIED").not("verified_at","is",null).limit(1).maybeSingle();
 if(linkError){console.error("application identity lookup failed",linkError.code??"unknown");return reply(503,{error:"Could not verify candidate access."},origin);}
 if(!link?.candidate_id)return reply(403,{code:"IDENTITY_NOT_VERIFIED",error:"Application records remain locked until an authorised reviewer verifies your candidate identity link."},origin);
 const candidateId=link.candidate_id as string;
 if(p.action==="save_n15_match"){
  const matchRef=typeof p.match_ref==="string"?p.match_ref.trim():"";
  const pathwayType=typeof p.pathway_type==="string"?p.pathway_type:"";
  const supportedPathways=new Set(["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"]);
  if(!matchRef||matchRef.length>100||/[\\u0000-\\u001f]/.test(matchRef)||!supportedPathways.has(pathwayType))return reply(400,{ready:false,code:"N15_INPUT_INVALID",error:"A valid N15 match and supported pathway are required."},origin);
  const storedPathway=pathwayMap[pathwayType];
  if(!storedPathway)return reply(400,{ready:false,code:"PATHWAY_NOT_SUPPORTED",error:"That application pathway is not supported."},origin);
  const {data:match,error:matchError}=await admin.from("candidate_opportunity_matches")
   .select("candidate_match_ref,candidate_ref,programme_ref,provider_ref,sector,match_status,source_confidence,human_review_required,sealed_exact_target,evidence_refs,recommendation_summary")
   .eq("candidate_match_ref",matchRef).eq("candidate_ref",candidateId).eq("match_status","APPROVED")
   .eq("source_confidence","OFFICIAL_VERIFIED").eq("human_review_required",false).eq("sealed_exact_target",false).maybeSingle();
  if(matchError){console.error("N15 save match lookup failed",matchError.code??"unknown");return reply(503,{ready:false,error:"Could not verify the opportunity. Try again later."},origin);}
  if(!match||!match.programme_ref||!match.provider_ref)return reply(409,{ready:false,code:"VERIFIED_MATCH_NOT_AVAILABLE",error:"This listing no longer satisfies the N15 publication gates."},origin);
  const supportedBySector:Record<string,string[]> = {
   UNIVERSITY:["HIGHER_EDUCATION"],CAO:["HIGHER_EDUCATION","TVET"],TVET:["TVET"],
   SETA:["SETA_LEARNERSHIP","APPRENTICESHIP","INTERNSHIP"],LEARNERSHIP:["SETA_LEARNERSHIP"],
   INTERNSHIP:["INTERNSHIP"],APPRENTICESHIP:["APPRENTICESHIP"],EMPLOYER:["EMPLOYMENT"],
   BURSARY:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP"],
   NSFAS:["HIGHER_EDUCATION","TVET"],QCTO:["SETA_LEARNERSHIP","APPRENTICESHIP"],
   ACCOMMODATION:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"],
   PRIVATE_COLLEGE:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP"]
  };
  if(!(supportedBySector[match.sector]??[]).includes(pathwayType))return reply(409,{ready:false,code:"MATCH_PATHWAY_MISMATCH",error:"Choose one of this opportunity's supported pathways."},origin);
  const {data:programme,error:programmeError}=await admin.from("opportunity_programmes")
   .select("programme_ref,programme_name,provider_ref,exact_link,location_text,opening_status,candidate_facing_safe,source_confidence,evidence_refs")
   .eq("programme_ref",match.programme_ref).maybeSingle();
  const {data:provider,error:providerError}=await admin.from("opportunity_providers")
   .select("provider_ref,provider_name,safe_to_recommend,source_confidence,accreditation_status,evidence_refs")
   .eq("provider_ref",match.provider_ref).maybeSingle();
  if(programmeError||providerError){console.error("N15 programme/provider lookup failed",programmeError?.code??providerError?.code??"unknown");return reply(503,{ready:false,error:"Opportunity source checks are unavailable."},origin);}
  if(!programme||!provider||programme.opening_status!=="OPEN"||programme.candidate_facing_safe!==true||
    programme.source_confidence!=="OFFICIAL_VERIFIED"||provider.source_confidence!=="OFFICIAL_VERIFIED"||
    provider.safe_to_recommend!==true||provider.accreditation_status==="REJECTED"||
    !Array.isArray(programme.evidence_refs)||programme.evidence_refs.length===0||
    !Array.isArray(provider.evidence_refs)||provider.evidence_refs.length===0||
    typeof programme.exact_link!=="string"||!programme.exact_link.startsWith("https://")) {
    return reply(409,{ready:false,code:"SOURCE_NOT_VERIFIED",error:"The opportunity or provider is no longer verified and open. Nothing was saved."},origin);
  }
  const now=new Date();
  const cutoff=new Date(now.getTime()-24*60*60*1000).toISOString();
  const {data:observations,error:observationError}=await admin.from("external_source_observations")
   .select("observation_ref,source_url,observed_at,last_checked_at,stale_after,evidence_refs")
   .eq("observation_status","VERIFIED").eq("source_confidence","OFFICIAL_VERIFIED").eq("source_url",programme.exact_link)
   .gte("last_checked_at",cutoff).lte("observed_at",now.toISOString()).lte("last_checked_at",now.toISOString())
   .gt("stale_after",now.toISOString()).order("last_checked_at",{ascending:false}).limit(1);
  if(observationError){console.error("N15 observation check failed",observationError.code??"unknown");return reply(503,{ready:false,error:"Source freshness could not be checked."},origin);}
  const observation=observations?.[0];
  const observedAt=Date.parse(observation?.observed_at??"");
  const checkedAt=Date.parse(observation?.last_checked_at??"");
  const staleAfter=Date.parse(observation?.stale_after??"");
  if(!observation||!Number.isFinite(observedAt)||!Number.isFinite(checkedAt)||!Number.isFinite(staleAfter)||
    observedAt>checkedAt||checkedAt>now.getTime()||staleAfter<=checkedAt||staleAfter<=now.getTime()||
    !Array.isArray(observation.evidence_refs)||observation.evidence_refs.length===0) {
    return reply(409,{ready:false,code:"SOURCE_STALE_OR_UNPROVEN",error:"The source evidence is missing, stale or inconsistent. Nothing was saved."},origin);
  }
  const {data:deadlineRows,error:deadlineError}=await admin.from("opportunity_deadlines")
   .select("closes_at,deadline_status,source_confidence,evidence_refs")
   .eq("programme_ref",programme.programme_ref).eq("provider_ref",provider.provider_ref)
   .eq("deadline_status","CONFIRMED").eq("source_confidence","OFFICIAL_VERIFIED")
   .gt("closes_at",now.toISOString()).order("closes_at",{ascending:true}).limit(1);
  if(deadlineError){console.error("N15 deadline check failed",deadlineError.code??"unknown");return reply(503,{ready:false,error:"Deadline evidence could not be checked."},origin);}
  const deadline=deadlineRows?.[0]??null;
  if(deadline&&(!Array.isArray(deadline.evidence_refs)||deadline.evidence_refs.length===0))return reply(409,{ready:false,code:"DEADLINE_EVIDENCE_MISSING",error:"Deadline evidence is incomplete. Nothing was saved."},origin);
  const targetKey="N15-"+matchRef;
  if(targetKey.length>120)return reply(400,{ready:false,code:"TARGET_KEY_TOO_LONG",error:"The match reference is too long to save safely."},origin);
  const officialPath=storedPathway;
  const closingDate=deadline?.closes_at?String(deadline.closes_at).slice(0,10):null;
  const {data:savedOpportunity,error:savedOpportunityError}=await admin.from("candidate_workspace_saved_opportunities")
   .upsert({candidate_id:candidateId,title:String(programme.programme_name).trim().slice(0,180),
    organisation:String(provider.provider_name).trim().slice(0,180),official_url:programme.exact_link,
    pathway:officialPath,closing_date:closingDate,updated_at:now.toISOString()},
    {onConflict:"candidate_id,official_url"}).select("id,title,organisation,official_url,pathway,closing_date").single();
  if(savedOpportunityError||!savedOpportunity){console.error("N15 saved opportunity write failed",savedOpportunityError?.code??"unknown");return reply(503,{ready:false,error:"The verified opportunity could not be saved. Retry safely."},origin);}
  let target:any=null;
  const {data:existingTarget,error:existingTargetError}=await admin.from("candidate_master_application_targets")
   .select("id,target_key,pathway_type,provider_name,programme_or_role,planning_status,application_id,created_at,updated_at")
   .eq("candidate_id",candidateId).eq("target_key",targetKey).maybeSingle();
  if(existingTargetError){console.error("N15 target lookup failed",existingTargetError.code??"unknown");return reply(503,{ready:false,error:"Could not reload the saved application target."},origin);}
  if(existingTarget) target=existingTarget;
  else {
   const {data:createdTarget,error:targetError}=await admin.from("candidate_master_application_targets").insert({
    candidate_id:candidateId,target_key:targetKey,pathway_type:pathwayType,
    provider_name:String(provider.provider_name).trim().slice(0,240),
    programme_or_role:String(programme.programme_name).trim().slice(0,240),
    provider_application_url:programme.exact_link,
    source_reference:"N15 match reference: "+matchRef,
    source_confidence:"UNVERIFIED",planning_status:"PLANNING",
    idempotency_key:crypto.randomUUID(),created_by_auth_user_id:authData.user.id
   }).select("id,target_key,pathway_type,provider_name,programme_or_role,planning_status,application_id,created_at,updated_at").single();
   if(targetError||!createdTarget){console.error("N15 master target create failed",targetError?.code??"unknown");return reply(503,{ready:false,error:"The saved listing exists, but its parent-application target could not be created. Retry to reconcile it."},origin);}
   target=createdTarget;
  }
  const {error:auditError}=await admin.from("candidate_master_application_events").upsert({
    candidate_id:candidateId,actor_auth_user_id:authData.user.id,event_type:"TARGETS_PLANNED",
    idempotency_key:"N15-save:"+matchRef,
    details:{action:"N15_OPPORTUNITY_SAVED",target_key:targetKey,n15_match_ref:matchRef,pathway_type:pathwayType,
      official_url:programme.exact_link,source_checked_at:observation.last_checked_at,
      programme_evidence_refs:programme.evidence_refs,provider_evidence_refs:provider.evidence_refs,
      observation_evidence_refs:observation.evidence_refs,provider_submission_sent:false}
   },{onConflict:"candidate_id,event_type,idempotency_key"});
  if(auditError){console.error("N15 save audit event failed",auditError.code??"unknown");return reply(503,{ready:false,error:"The opportunity and target were saved but the audit event could not be reconciled. Retry or contact support."},origin);}
  return reply(200,{ready:true,saved:true,opportunity:savedOpportunity,target, target_key:target.target_key,
   message:"Saved from the current approved N15 match with fresh official-source evidence. No provider application was submitted."},origin);
 }
 if(p.action==="plan_directory_target"){
  const providerKey=typeof p.provider_key==="string"?p.provider_key.trim():"";
  const pathwayType=typeof p.pathway_type==="string"?p.pathway_type.trim():"";
  const programmeOrRole=typeof p.programme_or_role==="string"?p.programme_or_role.trim():"";
  const allowedPathways=new Set(["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"]);
  if(!/^[a-z0-9_:-]{3,100}$/i.test(providerKey))return reply(400,{ready:false,code:"PROVIDER_KEY_INVALID",error:"Choose an institution/provider from the Kingsmen directory."},origin);
  if(!allowedPathways.has(pathwayType))return reply(400,{ready:false,code:"PATHWAY_NOT_SUPPORTED",error:"Choose one of Kingsmen's six supported pathways."},origin);
  if(programmeOrRole.length<2||programmeOrRole.length>240||/[\\u0000-\\u001f]/.test(programmeOrRole))return reply(400,{ready:false,code:"PROGRAMME_OR_ROLE_INVALID",error:"Enter a programme, service or role between 2 and 240 characters."},origin);

  const {data:provider,error:providerError}=await admin.from("route_providers")
   .select("provider_key,provider_name,provider_type,base_url,verification_status,public_safe,default_confidence_band,source_authority_id,notes")
   .eq("provider_key",providerKey).maybeSingle();
  if(providerError){console.error("directory planning provider lookup failed",providerError.code??"unknown");return reply(503,{ready:false,code:"PROVIDER_REGISTRY_UNAVAILABLE",error:"The provider registry could not be checked. No planning target was saved."},origin);}
  if(!provider)return reply(404,{ready:false,code:"PROVIDER_NOT_IMPORTED",error:"This directory entry has not yet been imported into Kingsmen's canonical provider registry. You can still view its official source, but a saved application plan is not available yet."},origin);
  if(["BLOCKED","RISK","STALE"].includes(String(provider.verification_status)))return reply(409,{ready:false,code:"PROVIDER_NOT_SAFE_TO_PLAN",error:"This provider record is blocked, risky or stale. Kingsmen has not created a plan."},origin);

  const allowedByProviderType:Record<string,string[]> = {
   UNIVERSITY:["HIGHER_EDUCATION"],
   TVET:["TVET"],
   SETA:["SETA_LEARNERSHIP","APPRENTICESHIP"],
   LEARNERSHIP_PROVIDER:["SETA_LEARNERSHIP","APPRENTICESHIP"],
   BURSARY_PROVIDER:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP"],
   ACCOMMODATION_PROVIDER:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"],
   EMPLOYER:["EMPLOYMENT","INTERNSHIP","APPRENTICESHIP","SETA_LEARNERSHIP"],
   PRIVATE_COLLEGE:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP"],
   APPLICATION_PORTAL:["HIGHER_EDUCATION","TVET"],
   GOVERNMENT_AUTHORITY:["HIGHER_EDUCATION","TVET","EMPLOYMENT"],
   QUALITY_AUTHORITY:["SETA_LEARNERSHIP","APPRENTICESHIP"]
  };
  const specialProviderPathways:Record<string,string[]> = {
   nsfas_official:["HIGHER_EDUCATION","TVET"],
   funder_nsf:["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","APPRENTICESHIP"],
   funder_funza_lushaka:["HIGHER_EDUCATION"],
   labour_department_vacancies:["EMPLOYMENT"],
   cao_official:["HIGHER_EDUCATION","TVET"]
  };
  const permitted=(specialProviderPathways[providerKey]??allowedByProviderType[String(provider.provider_type)]??[]);
  if(!permitted.includes(pathwayType))return reply(409,{ready:false,code:"PROVIDER_PATHWAY_MISMATCH",error:"This pathway does not match the provider's registered service type. No plan was saved."},origin);

  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(providerKey+"|"+pathwayType+"|"+programmeOrRole.toLocaleLowerCase()));
  const digestHex=Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("").slice(0,32);
  const targetKey=("DIR-"+providerKey+"-"+digestHex).slice(0,120);
  const idempotencyKey="DIR-PLAN-"+digestHex;

  const {data:existing,error:existingError}=await admin.from("candidate_master_application_targets")
   .select("id,target_key,pathway_type,provider_name,programme_or_role,provider_application_url,source_reference,source_confidence,planning_status,application_id,created_at,updated_at")
   .eq("candidate_id",candidateId).eq("target_key",targetKey).maybeSingle();
  if(existingError){console.error("directory planning duplicate lookup failed",existingError.code??"unknown");return reply(503,{ready:false,code:"PLANNING_LOOKUP_FAILED",error:"Could not check for an existing planning target."},origin);}

  let target=existing;
  if(!target){
   const sourceReference="Kingsmen provider registry: "+provider.provider_key+"; directory planning only; registry state="+provider.verification_status+"; source authority id="+String(provider.source_authority_id??"not linked");
   const {data:created,error:createError}=await admin.from("candidate_master_application_targets").insert({
    candidate_id:candidateId,target_key:targetKey,pathway_type:pathwayType,
    provider_name:String(provider.provider_name).trim().slice(0,180),
    programme_or_role:programmeOrRole,
    provider_application_url:null,
    source_reference:sourceReference,
    source_confidence:"UNVERIFIED",
    planning_status:"PLANNING",
    idempotency_key:idempotencyKey,
    created_by_auth_user_id:authData.user.id,
    application_id:null
   }).select("id,target_key,pathway_type,provider_name,programme_or_role,provider_application_url,source_reference,source_confidence,planning_status,application_id,created_at,updated_at").single();
   if(createError||!created){console.error("directory planning target insert failed",createError?.code??"unknown");return reply(503,{ready:false,code:"PLANNING_TARGET_SAVE_FAILED",error:"The provider plan could not be saved. No provider application was sent."},origin);}
   target=created;
  }

  const {error:auditError}=await admin.from("candidate_master_application_events").upsert({
   candidate_id:candidateId,actor_auth_user_id:authData.user.id,event_type:"TARGETS_PLANNED",idempotency_key:idempotencyKey,
   details:{action:"DIRECTORY_PROVIDER_PLAN_CREATED",target_key:targetKey,provider_key:provider.provider_key,
    provider_type:provider.provider_type,provider_verification_status:provider.verification_status,
    provider_public_safe:provider.public_safe,source_confidence:"UNVERIFIED",planning_status:"PLANNING",
    pathway_type:pathwayType,programme_or_role:programmeOrRole,provider_submission_sent:false,
    provider_receipt_confirmed:false,provider_integration:"NOT_CONNECTED"}
  },{onConflict:"candidate_id,event_type,idempotency_key"});
  if(auditError){console.error("directory planning audit write failed",auditError.code??"unknown");return reply(503,{ready:false,code:"PLANNING_AUDIT_FAILED",error:"The target was saved but its audit event could not be reconciled. Refresh the tracker before retrying."},origin);}

  return reply(200,{ready:true,saved:true,target,created:!existing,
   provider_submission_sent:false,provider_integration:"NOT_CONNECTED",
   message:"Private Kingsmen planning target saved. This is not a provider application, open programme, verified intake or submission. Kingsmen will require current programme, eligibility and route evidence before preparing a provider-specific application."},origin);
 }
 if(p.action==="prepare_application_packet"){
  const targetKey=typeof p.target_key==="string"?p.target_key.trim():"";
  if(!targetKey||targetKey.length>120)return reply(400,{ready:false,code:"TARGET_KEY_INVALID",error:"Choose a saved provider target before preparing an application packet."},origin);

  const rawAnswers=p.application_answers&&typeof p.application_answers==="object"&&!Array.isArray(p.application_answers)
    ? p.application_answers as Record<string,unknown> : {};
  const answerLimits:Record<string,number> = {
    motivation_statement:3000,
    experience_summary:3000,
    skills_summary:1800,
    qualification_summary:1800,
    availability:500,
    preferred_location:180,
    additional_information:1800
  };
  const answers:Record<string,string>={};
  for(const [field,limit] of Object.entries(answerLimits)){
    const value=rawAnswers[field];
    if(value===undefined||value===null||value==="")continue;
    if(typeof value!=="string"||value.length>limit||/[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f]/.test(value))
      return reply(400,{ready:false,code:"APPLICATION_ANSWER_INVALID",error:"One of the application preparation fields is invalid or exceeds its size limit."},origin);
    answers[field]=value.trim();
  }

  const rawDocumentIds=p.selected_document_ids===undefined?[]:p.selected_document_ids;
  if(!Array.isArray(rawDocumentIds)||rawDocumentIds.length>20||rawDocumentIds.some((value:any)=>typeof value!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)))
    return reply(400,{ready:false,code:"APPLICATION_DOCUMENT_SELECTION_INVALID",error:"Select up to 20 valid documents from your own Document Vault."},origin);
  const selectedDocumentIds=[...new Set(rawDocumentIds as string[])];
  if(selectedDocumentIds.length!==rawDocumentIds.length)
    return reply(400,{ready:false,code:"APPLICATION_DOCUMENT_DUPLICATE",error:"A document can only be selected once."},origin);

  const {data:target,error:targetError}=await admin.from("candidate_master_application_targets")
   .select("id,target_key,candidate_id,pathway_type,provider_name,programme_or_role,source_reference,planning_status,application_id")
   .eq("candidate_id",candidateId).eq("target_key",targetKey).maybeSingle();
  if(targetError){console.error("application packet target lookup failed",targetError.code??"unknown");return reply(503,{ready:false,code:"APPLICATION_TARGET_LOOKUP_FAILED",error:"Could not load this saved application target."},origin);}
  if(!target)return reply(404,{ready:false,code:"APPLICATION_TARGET_NOT_FOUND",error:"This saved application target could not be found for your verified candidate account."},origin);

  const providerKeyMatch=/^Kingsmen provider registry:\\s*([a-z0-9_:-]{3,100})\\s*;/i.exec(String(target.source_reference??""));
  if(!providerKeyMatch)return reply(409,{ready:false,code:"PROVIDER_REGISTRY_LINK_REQUIRED",error:"This target is not yet linked to a canonical provider record. A reusable application packet cannot be assembled until that provider link is verified."},origin);
  const providerKey=providerKeyMatch[1];
  const {data:provider,error:providerError}=await admin.from("route_providers")
   .select("provider_key,provider_name,provider_type,verification_status,base_url,public_safe,default_confidence_band")
   .eq("provider_key",providerKey).maybeSingle();
  if(providerError){console.error("application packet provider lookup failed",providerError.code??"unknown");return reply(503,{ready:false,code:"PROVIDER_LOOKUP_FAILED",error:"The provider registry is temporarily unavailable."},origin);}
  if(!provider||["BLOCKED","RISK","STALE"].includes(String(provider.verification_status)))
    return reply(409,{ready:false,code:"PROVIDER_NOT_AVAILABLE_FOR_PREPARATION",error:"This provider record is missing, blocked, risky or stale. No application packet was created."},origin);
  if(provider.provider_name!==target.provider_name)
    return reply(409,{ready:false,code:"PROVIDER_TARGET_MISMATCH",error:"The saved target does not match its canonical provider record. Contact support before continuing."},origin);

  const {data:candidate,error:candidateError}=await admin.from("candidates").select("public_ref").eq("id",candidateId).maybeSingle();
  if(candidateError||!candidate?.public_ref){console.error("application packet candidate reference lookup failed",candidateError?.code??"unknown");return reply(503,{ready:false,code:"CANDIDATE_REFERENCE_UNAVAILABLE",error:"Could not verify your candidate profile reference."},origin);}
  const {data:consents,error:consentError}=await admin.from("privacy_consent_records")
   .select("consent_status,revoked_at,consent_text_snapshot,granted_at")
   .eq("candidate_ref",candidate.public_ref).eq("consent_type","PROFILE_PROCESSING")
   .order("granted_at",{ascending:false}).order("id",{ascending:false}).limit(1);
  if(consentError){console.error("application packet consent lookup failed",consentError.code??"unknown");return reply(503,{ready:false,code:"CONSENT_LOOKUP_FAILED",error:"Could not check the current profile-processing consent state."},origin);}
  const consent=consents?.[0];
  if(!consent||consent.consent_status!=="ACTIVE"||consent.revoked_at!==null||
    typeof consent.consent_text_snapshot!=="string"||!consent.consent_text_snapshot.trim()||
    !consent.granted_at||Date.parse(consent.granted_at)>Date.now())
    return reply(403,{ready:false,code:"ACTIVE_PROFILE_CONSENT_REQUIRED",error:"Active profile-processing consent is required before a reusable application packet can be prepared."},origin);

  const {data:profile,error:profileError}=await admin.from("candidate_master_profiles")
   .select("profile_data,pathway_preferences,consent_version,consent_at")
   .eq("candidate_id",candidateId).maybeSingle();
  if(profileError){console.error("application packet profile lookup failed",profileError.code??"unknown");return reply(503,{ready:false,code:"CANDIDATE_PROFILE_UNAVAILABLE",error:"Could not load your saved candidate profile."},origin);}
  if(!profile)return reply(409,{ready:false,code:"CANDIDATE_PROFILE_REQUIRED",error:"Save your candidate profile before preparing provider application information."},origin);
  const rawProfile=profile.profile_data&&typeof profile.profile_data==="object"&&!Array.isArray(profile.profile_data)
    ? profile.profile_data as Record<string,unknown> : {};
  const profileFields=["displayName","phone","province","highestQualification","studyInterests","employmentInterests","preferredLocation"];
  const profileSnapshot:Record<string,string>={};
  for(const key of profileFields){if(typeof rawProfile[key]==="string")profileSnapshot[key]=(rawProfile[key] as string).trim().slice(0,600);}

  let documents:any[]=[];
  if(selectedDocumentIds.length){
    const result=await admin.from("candidate_private_documents")
     .select("id,document_type,original_filename,mime_type,size_bytes,status")
     .eq("candidate_id",candidateId).in("id",selectedDocumentIds)
     .in("status",["UPLOADED_CANDIDATE_REPORTED","UNDER_REVIEW","VERIFIED"]);
    if(result.error){console.error("application packet document lookup failed",result.error.code??"unknown");return reply(503,{ready:false,code:"DOCUMENT_LOOKUP_FAILED",error:"Could not verify the selected Document Vault files."},origin);}
    documents=result.data??[];
    if(documents.length!==selectedDocumentIds.length)
      return reply(409,{ready:false,code:"DOCUMENT_NOT_OWNED_OR_AVAILABLE",error:"One or more selected files are not available in your own Document Vault. Refresh and select your own uploaded files."},origin);
  }

  const missingProfileFields=profileFields.filter(key=>typeof profileSnapshot[key]!=="string"||!profileSnapshot[key].trim());
  const {data:existingPacket,error:existingPacketError}=await admin.from("candidate_application_packets")
   .select("id,packet_ref").eq("candidate_id",candidateId).eq("target_id",target.id).maybeSingle();
  if(existingPacketError){console.error("application packet reload failed",existingPacketError.code??"unknown");return reply(503,{ready:false,code:"APPLICATION_PACKET_LOOKUP_FAILED",error:"Could not check for an existing preparation packet."},origin);}
  const packetRef=existingPacket?.packet_ref??("KMAP-"+crypto.randomUUID().replace(/-/g,"").slice(0,16).toUpperCase());
  const now=new Date().toISOString();

  const {data:packet,error:packetError}=await admin.from("candidate_application_packets").upsert({
    packet_ref:packetRef,candidate_id:candidateId,target_id:target.id,
    pathway_type:target.pathway_type,provider_key:providerKey,provider_name:target.provider_name,
    programme_or_role:target.programme_or_role,packet_status:"PROVIDER_REQUIREMENTS_PENDING",
    template_status:"NO_VERIFIED_PROVIDER_TEMPLATE",candidate_profile_snapshot:profileSnapshot,
    application_answers:answers,missing_profile_fields:missingProfileFields,
    selected_document_count:documents.length,provider_requirements_status:"NOT_VERIFIED",
    provider_submission_sent:false,provider_receipt_confirmed:false,provider_integration_state:"NOT_CONNECTED",
    created_by_auth_user_id:authData.user.id,updated_by_auth_user_id:authData.user.id,updated_at:now
  },{onConflict:"candidate_id,target_id"})
   .select("id,packet_ref,target_id,pathway_type,provider_key,provider_name,programme_or_role,packet_status,template_status,candidate_profile_snapshot,application_answers,missing_profile_fields,selected_document_count,provider_requirements_status,provider_submission_sent,provider_receipt_confirmed,provider_integration_state,created_at,updated_at")
   .single();
  if(packetError||!packet){console.error("application packet save failed",packetError?.code??"unknown");return reply(503,{ready:false,code:"APPLICATION_PACKET_SAVE_FAILED",error:"The reusable application information could not be saved. No provider application was sent."},origin);}

  const {error:clearDocumentsError}=await admin.from("candidate_application_packet_documents")
   .delete().eq("packet_id",packet.id).eq("candidate_id",candidateId);
  if(clearDocumentsError){console.error("application packet document reconciliation failed",clearDocumentsError.code??"unknown");return reply(503,{ready:false,code:"APPLICATION_PACKET_DOCUMENT_RECONCILIATION_FAILED",error:"The packet was saved but document selections could not be reconciled. Refresh and retry."},origin);}
  if(documents.length){
    const documentRows=documents.map(document=>({
      packet_id:packet.id,candidate_id:candidateId,private_document_id:document.id,
      document_type_snapshot:document.document_type,original_filename_snapshot:document.original_filename,
      selected_by_auth_user_id:authData.user.id
    }));
    const {error:documentInsertError}=await admin.from("candidate_application_packet_documents").insert(documentRows);
    if(documentInsertError){console.error("application packet document selection save failed",documentInsertError.code??"unknown");return reply(503,{ready:false,code:"APPLICATION_PACKET_DOCUMENT_SAVE_FAILED",error:"The packet is saved but selected documents could not be attached. Refresh and retry."},origin);}
  }

  const {error:auditError}=await admin.from("candidate_master_application_events").upsert({
    candidate_id:candidateId,actor_auth_user_id:authData.user.id,event_type:"TARGETS_PLANNED",
    idempotency_key:"APPLICATION-PACKET:"+targetKey,
    details:{action:"REUSABLE_APPLICATION_PACKET_PREPARED",packet_ref:packetRef,target_key:targetKey,
      provider_key:providerKey,pathway_type:target.pathway_type,packet_status:"PROVIDER_REQUIREMENTS_PENDING",
      template_status:"NO_VERIFIED_PROVIDER_TEMPLATE",provider_requirements_status:"NOT_VERIFIED",
      profile_field_count:Object.keys(profileSnapshot).length,missing_profile_fields:missingProfileFields,
      selected_document_count:documents.length,selected_document_types:documents.map(document=>document.document_type),
      provider_submission_sent:false,provider_receipt_confirmed:false,provider_integration_state:"NOT_CONNECTED"}
  },{onConflict:"candidate_id,event_type,idempotency_key"});
  if(auditError){console.error("application packet audit write failed",auditError.code??"unknown");return reply(503,{ready:false,code:"APPLICATION_PACKET_AUDIT_FAILED",error:"The preparation packet was saved but its audit event could not be reconciled. Refresh the tracker before retrying."},origin);}

  return reply(200,{ready:true,packet,documents:documents.map(document=>({
    id:document.id,document_type:document.document_type,original_filename:document.original_filename,
    mime_type:document.mime_type,size_bytes:document.size_bytes,status:document.status
  })),message:"Reusable Kingsmen application profile and selected Document Vault references saved. Provider-specific form requirements, eligibility and submission route remain unverified; nothing was sent to the institution."},origin);
 }
 if(p.action==="prepare_master_application"){
  const targetKey=typeof p.target_key==="string"?p.target_key.trim():"";
  if(!targetKey||targetKey.length>120)return reply(400,{ready:false,code:"TARGET_KEY_INVALID",error:"A valid saved application target is required."},origin);
  const userClient=createClient(URL,ANON,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:prepared,error:prepareError}=await userClient.rpc("prepare_candidate_application_from_master_target",{p_target_key:targetKey});
  if(prepareError){console.error("master application prepare RPC failed",prepareError.code??"unknown");return reply(503,{ready:false,code:"MASTER_APPLICATION_PREPARATION_FAILED",error:"The parent application could not be prepared. Your saved opportunity remains available."},origin);}
  if(!prepared||prepared.ok!==true)return reply(409,{ready:false,code:prepared?.code??"MASTER_APPLICATION_NOT_READY",error:prepared?.message??"The saved opportunity no longer meets application preparation gates. Your saved information remains available.",detail:prepared},origin);
  return reply(200,{ready:true,application:prepared,message:"Application preparation record persisted. This does not submit anything to the provider."},origin);
 }
 if(p.action==="load"){
  const {data:trackers,error}=await admin.from("candidate_application_tracker").select("id,candidate_id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at,candidate_workspace_saved_opportunities(id,title,organisation,official_url,pathway,closing_date)").eq("candidate_id",candidateId).order("updated_at",{ascending:false});
  if(error){console.error("application tracker load failed",error.code??"unknown");return reply(503,{error:"Could not load application preparation records."},origin);}
  const ids=(trackers??[]).map((t:any)=>t.id);
  let items:any[]=[];
  if(ids.length){const result=await admin.from("candidate_application_preparation_items").select("id,tracker_id,item_type,title,candidate_note,official_source_url,evidence_reference,status,required_by_candidate,due_date,created_at,updated_at").eq("candidate_id",candidateId).in("tracker_id",ids).order("created_at",{ascending:true});if(result.error){console.error("preparation items load failed",result.error.code??"unknown");return reply(503,{error:"Could not load preparation checklist items."},origin);}items=result.data??[];}
  const {data:masterTargets,error:masterTargetError}=await admin.from("candidate_master_application_targets")
   .select("id,target_key,pathway_type,provider_name,programme_or_role,provider_application_url,source_reference,source_confidence,planning_status,application_id,created_at,updated_at")
   .eq("candidate_id",candidateId).order("updated_at",{ascending:false});
  if(masterTargetError){console.error("master application targets load failed",masterTargetError.code??"unknown");return reply(503,{error:"Could not load parent-application targets."},origin);}
  const applicationIds=(masterTargets??[]).map((t:any)=>t.application_id).filter((id:any)=>typeof id==="string");
  let parentApplications:any[]=[];
  if(applicationIds.length){
   const result=await admin.from("candidate_applications")
    .select("id,application_ref,pathway_type,status,readiness_status,readiness_snapshot,created_at,updated_at")
    .eq("candidate_id",candidateId).in("id",applicationIds).order("updated_at",{ascending:false});
   if(result.error){console.error("master applications load failed",result.error.code??"unknown");return reply(503,{error:"Could not load prepared application records."},origin);}
   parentApplications=result.data??[];
  }
  const {data:masterEvents,error:masterEventError}=await admin.from("candidate_master_application_events")
   .select("event_type,details,created_at").eq("candidate_id",candidateId).order("created_at",{ascending:false}).limit(100);
  if(masterEventError){console.error("master application timeline load failed",masterEventError.code??"unknown");return reply(503,{error:"Could not load application timeline evidence."},origin);}
  const {data:applicationEvents,error:applicationEventError}=await admin.from("candidate_application_events")
   .select("application_id,event_type,from_status,to_status,reason_code,evidence_ref,details,created_at")
   .eq("candidate_id",candidateId).order("created_at",{ascending:false}).limit(200);
  if(applicationEventError){console.error("application timeline load failed",applicationEventError.code??"unknown");return reply(503,{error:"Could not load application timeline evidence."},origin);}
  return reply(200,{ready:true,trackers:trackers??[],items,masterTargets:masterTargets??[],
   parentApplications,masterEvents:masterEvents??[],applicationEvents:applicationEvents??[],
   message:"Saved application and preparation records loaded. No provider submission is implied."},origin);
 }
 if(p.action==="start_from_saved_route"){
  const routeId=typeof p.route_programme_id==="string"?p.route_programme_id:"";
  if(!/^[0-9a-f-]{36}$/i.test(routeId))return reply(400,{error:"A valid saved opportunity identifier is required."},origin);
  const {data:saved,error:savedError}=await admin.from("candidate_saved_routes").select("id,route_programme_id").eq("user_id",authData.user.id).eq("route_programme_id",routeId).maybeSingle();
  if(savedError||!saved){if(savedError)console.error("saved route lookup failed",savedError.code??"unknown");return reply(404,{error:"Save this opportunity to your account before creating its tracker."},origin);}
  const {data:route,error:routeError}=await admin.from("route_programmes").select("id,programme_name,provider_id,route_type,source_url,source_confidence_band,route_status,availability_status,updated_at,metadata,route_providers(public_safe,verification_status,default_confidence_band)").eq("id",routeId).eq("route_status","VERIFIED").in("availability_status",["OPEN","FUTURE"]).in("source_confidence_band",["A","B"]).gte("updated_at",new Date(Date.now()-90*24*60*60*1000).toISOString()).maybeSingle();
  if(routeError||!route){if(routeError)console.error("verified route lookup failed",routeError.code??"unknown");return reply(409,{error:"This opportunity is no longer available as a recent verified route."},origin);}
  const providerValue=route.route_providers as unknown;
  const provider=Array.isArray(providerValue)?providerValue[0] as Record<string,unknown>|undefined:providerValue as Record<string,unknown>|null;
  if(!provider||provider.public_safe!==true||provider.verification_status!=="VERIFIED"||!(["A","B"] as unknown[]).includes(provider.default_confidence_band))return reply(409,{error:"The provider is not currently verified and publicly approved for this opportunity."},origin);
  const meta=route.metadata&&typeof route.metadata==="object"?route.metadata as Record<string,unknown>:{};
  const dateParts=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Johannesburg",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const datePart=(kind:string)=>dateParts.find((part)=>part.type===kind)?.value??"";
  const southAfricanToday=`${datePart("year")}-${datePart("month")}-${datePart("day")}`;
  const openingDate=typeof meta.opening_date==="string"&&/^\\d{4}-\\d{2}-\\d{2}$/.test(meta.opening_date)?meta.opening_date:null;
  const closingDate=typeof meta.closing_date==="string"&&/^\\d{4}-\\d{2}-\\d{2}$/.test(meta.closing_date)?meta.closing_date:null;
  if(route.availability_status==="OPEN"&&(!closingDate||closingDate<southAfricanToday))return reply(409,{error:"This opportunity is expired or has no verified closing date. Refresh the official listing before tracking it."},origin);
  if(route.availability_status==="FUTURE"&&(!openingDate||openingDate<=southAfricanToday||(closingDate!==null&&closingDate<southAfricanToday)))return reply(409,{error:"This upcoming opportunity has no valid future opening date or its closing date has passed."},origin);
  const officialUrl=typeof route.source_url==="string"?route.source_url:"";
  if(!/^https:\/\//i.test(officialUrl))return reply(409,{error:"The opportunity has no usable HTTPS official source, so a tracker cannot be created."},origin);
  const organisation=String(meta.organisation??meta.provider_name??"Official provider").trim().slice(0,180)||"Official provider";
  const rawPathway=String(route.route_type??"");
  const pathway=pathwayMap[rawPathway]??pathwayMap[rawPathway.toUpperCase()];
  if(!pathway)return reply(409,{error:"This route type needs catalogue mapping before it can be tracked."},origin);
  const {data:opportunity,error:oppError}=await admin.from("candidate_workspace_saved_opportunities").upsert({candidate_id:candidateId,title:String(route.programme_name).trim().slice(0,180),organisation,official_url:officialUrl,pathway,closing_date:closingDate,updated_at:new Date().toISOString()},{onConflict:"candidate_id,official_url"}).select("id").single();
  if(oppError||!opportunity){console.error("saved opportunity sync failed",oppError?.code??"unknown");return reply(503,{error:"Could not connect the saved opportunity to the candidate workspace."},origin);}
  const {data:existing,error:existingError}=await admin.from("candidate_application_tracker").select("id,candidate_id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at").eq("candidate_id",candidateId).eq("saved_opportunity_id",opportunity.id).maybeSingle();
  if(existingError){console.error("tracker duplicate lookup failed",existingError.code??"unknown");return reply(503,{error:"Could not check the application tracker."},origin);}
  const defaultsByPathway: Record<string,Array<{item_type:"TASK"|"DOCUMENT";title:string}>> = {
   higher_education:[
    {item_type:"DOCUMENT",title:"Prepare identity document; confirm certification rules with the institution"},
    {item_type:"DOCUMENT",title:"Prepare latest school/tertiary results and qualification records requested by the institution"},
    {item_type:"TASK",title:"Check programme-specific admission requirements and subject/point thresholds"},
    {item_type:"TASK",title:"Confirm application fee, closing date and required submission channel"},
    {item_type:"TASK",title:"Check funding options separately; do not assume bursary or NSFAS approval"}
   ],
   tvet:[
    {item_type:"DOCUMENT",title:"Prepare identity document and proof of residence if the college requests it"},
    {item_type:"DOCUMENT",title:"Prepare latest school results, certificates or prior qualification records requested"},
    {item_type:"TASK",title:"Confirm NC(V), NATED/Report 191 or occupational programme entry requirements"},
    {item_type:"TASK",title:"Confirm campus, intake, fees and the official closing date"},
    {item_type:"TASK",title:"Review the college's application form and required supporting evidence"}
   ],
   seta_learnership:[
    {item_type:"DOCUMENT",title:"Prepare an up-to-date CV tailored to the learnership or skills programme"},
    {item_type:"DOCUMENT",title:"Prepare identity and qualification/results records requested by the SETA or host"},
    {item_type:"TASK",title:"Check age, qualification, employment and other published eligibility conditions"},
    {item_type:"TASK",title:"Confirm whether the opportunity is a learnership, internship or skills programme"},
    {item_type:"TASK",title:"Verify the host, stipend terms, closing date and official application channel"}
   ],
   internship:[
    {item_type:"DOCUMENT",title:"Prepare a role-specific CV and a concise motivation letter if requested"},
    {item_type:"DOCUMENT",title:"Prepare academic records and proof of study/completion requested by the host"},
    {item_type:"TASK",title:"Check study-year, qualification, experience and work-authorisation requirements"},
    {item_type:"TASK",title:"Confirm internship duration, location, stipend and closing date"},
    {item_type:"TASK",title:"Review all answers and attachments before applying through the official channel"}
   ],
   apprenticeship:[
    {item_type:"DOCUMENT",title:"Prepare CV, identity document and school/technical qualification records requested"},
    {item_type:"DOCUMENT",title:"Prepare trade, aptitude or prior-learning evidence only where the host requests it"},
    {item_type:"TASK",title:"Confirm the trade, occupational qualification and training-provider details"},
    {item_type:"TASK",title:"Check entry criteria, workplace location, duration and stipend/contract terms"},
    {item_type:"TASK",title:"Verify the employer or training provider and official application channel"}
   ],
   employment:[
    {item_type:"DOCUMENT",title:"Prepare a vacancy-targeted CV and motivation letter if requested"},
    {item_type:"DOCUMENT",title:"Prepare identity, qualification and work-authorisation evidence requested by the employer"},
    {item_type:"TASK",title:"Check essential requirements, experience, location, shifts and closing date"},
    {item_type:"TASK",title:"Prepare references or portfolio evidence only where the vacancy asks for them"},
    {item_type:"TASK",title:"Review the vacancy and application details before submitting to the employer"}
   ]
  };
  const defaults=defaultsByPathway[pathway];
  if(!defaults)return reply(409,{error:"A pathway-specific preparation checklist is not configured; no generic checklist was created."},origin);
  if(existing){
   const {data:existingItems,error:existingItemsError}=await admin.from("candidate_application_preparation_items").select("id").eq("tracker_id",existing.id).eq("candidate_id",candidateId).limit(1);
   if(existingItemsError){console.error("existing checklist lookup failed",existingItemsError.code??"unknown");return reply(503,{error:"Could not check the existing preparation checklist."},origin);}
   if(!existingItems?.length){
    const {error:repairError}=await admin.from("candidate_application_preparation_items").insert(defaults.map(i=>({...i,tracker_id:existing.id,candidate_id:candidateId,candidate_note:"",official_source_url:officialUrl,evidence_reference:"",status:"NOT_STARTED",required_by_candidate:i.item_type==="TASK"})));
    if(repairError){console.error("existing checklist repair failed",repairError.code??"unknown");return reply(503,{error:"The tracker exists, but its checklist still needs repair. Please retry shortly."},origin);}
   }
   return reply(200,{ready:true,tracker:existing,already_exists:true,message:"This saved opportunity already has a preparation tracker; its default checklist was checked and repaired if missing."},origin);
  }
  const {data:tracker,error:trackerError}=await admin.from("candidate_application_tracker").insert({candidate_id:candidateId,saved_opportunity_id:opportunity.id,status:"SAVED",candidate_note:"",evidence_reference:""}).select("id,candidate_id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at").single();
  if(trackerError||!tracker){console.error("tracker create failed",trackerError?.code??"unknown");return reply(503,{error:"Could not create the application tracker."},origin);}
  const {error:itemError}=await admin.from("candidate_application_preparation_items").insert(defaults.map(i=>({...i,tracker_id:tracker.id,candidate_id:candidateId,candidate_note:"",official_source_url:officialUrl,evidence_reference:"",status:"NOT_STARTED",required_by_candidate:true})));
  if(itemError){
   console.error("default checklist create failed",itemError.code??"unknown");
   return reply(503,{error:"Tracker exists but its checklist could not be completed. Retry creating the tracker to repair the missing checklist; existing candidate data will be preserved."},origin);
  }
  return reply(201,{ready:true,tracker,already_exists:false,message:`Preparation tracker and ${defaults.length} pathway-specific checklist items created. This is not a provider application or submission.`},origin);
 }
 if(p.action==="update_tracker"){
  const id=typeof p.tracker_id==="string"?p.tracker_id:"";
  const status=typeof p.status==="string"?p.status:"";
  const note=typeof p.candidate_note==="string"?p.candidate_note:"";
  const evidence=typeof p.evidence_reference==="string"?p.evidence_reference:"";
  if(!/^[0-9a-f-]{36}$/i.test(id)||!trackerStatuses.has(status)||note.length>1200||evidence.length>500)return reply(400,{error:"Tracker update contains an invalid identifier, status or field length."},origin);
  if(status==="SUBMITTED_CANDIDATE_REPORTED"&&!evidence.trim())return reply(400,{error:"Add a reference to your own submission evidence before recording a candidate-reported submission."},origin);
  const {data,error}=await admin.from("candidate_application_tracker").update({status,candidate_note:note,evidence_reference:evidence,updated_at:new Date().toISOString()}).eq("id",id).eq("candidate_id",candidateId).select("id,status,candidate_note,evidence_reference,updated_at").maybeSingle();
  if(error){console.error("tracker update failed",error.code??"unknown");return reply(503,{error:"Could not update this tracker."},origin);}
  if(!data)return reply(404,{error:"Application tracker not found for this candidate."},origin);
  return reply(200,{ready:true,tracker:data,message:status==="SUBMITTED_CANDIDATE_REPORTED"?"Your submission is recorded as candidate-reported only; Kingsmen has not independently verified provider receipt.":"Application preparation tracker updated. No provider status has been independently changed."},origin);
 }
 if(p.action==="add_item"){
  const trackerId=typeof p.tracker_id==="string"?p.tracker_id:"";
  const title=typeof p.title==="string"?p.title.trim():"";
  const itemType=p.item_type==="DOCUMENT"?"DOCUMENT":p.item_type==="TASK"?"TASK":"";
  const note=typeof p.candidate_note==="string"?p.candidate_note:"";
  const source=typeof p.official_source_url==="string"?p.official_source_url:"";
  if(!/^[0-9a-f-]{36}$/i.test(trackerId)||!itemType||title.length<2||title.length>160||note.length>1200||source.length>1000||(source&&!/^https:\/\//i.test(source)))return reply(400,{error:"Checklist item fields are invalid."},origin);
  const {data:parent,error:parentError}=await admin.from("candidate_application_tracker").select("id").eq("id",trackerId).eq("candidate_id",candidateId).maybeSingle();
  if(parentError||!parent){if(parentError)console.error("checklist parent lookup failed",parentError.code??"unknown");return reply(404,{error:"Tracker not found for this candidate."},origin);}
  const {data,error}=await admin.from("candidate_application_preparation_items").insert({tracker_id:trackerId,candidate_id:candidateId,item_type:title?itemType:itemType,title,candidate_note:note,official_source_url:source,evidence_reference:"",status:"NOT_STARTED",required_by_candidate:true}).select("id,tracker_id,item_type,title,candidate_note,official_source_url,evidence_reference,status,required_by_candidate,due_date,created_at,updated_at").single();
  if(error||!data){console.error("checklist item create failed",error?.code??"unknown");return reply(503,{error:"Could not add the checklist item."},origin);}
  return reply(201,{ready:true,item:data},origin);
 }
 if(p.action==="update_item"){
  const id=typeof p.item_id==="string"?p.item_id:"";
  const status=typeof p.status==="string"?p.status:"";
  const note=typeof p.candidate_note==="string"?p.candidate_note:"";
  const evidence=typeof p.evidence_reference==="string"?p.evidence_reference:"";
  if(!/^[0-9a-f-]{36}$/i.test(id)||!itemStatuses.has(status)||note.length>1200||evidence.length>1000||(status==="READY_CANDIDATE_REPORTED"&&!evidence.trim()))return reply(400,{error:"Checklist update is invalid. Candidate-reported ready items require an evidence reference."},origin);
  const {data,error}=await admin.from("candidate_application_preparation_items").update({status,candidate_note:note,evidence_reference:evidence,updated_at:new Date().toISOString()}).eq("id",id).eq("candidate_id",candidateId).select("id,tracker_id,status,candidate_note,evidence_reference,updated_at").maybeSingle();
  if(error){console.error("checklist item update failed",error.code??"unknown");return reply(503,{error:"Could not update the checklist item."},origin);}
  if(!data)return reply(404,{error:"Checklist item not found for this candidate."},origin);
  return reply(200,{ready:true,item:data,message:"Checklist progress is candidate-reported; evidence has not been independently verified."},origin);
 }
 return reply(400,{error:"Unsupported action."},origin);
});