import { randomUUID } from "node:crypto";
import { requireCandidateSession, supabaseAdminFetch } from "../../../../lib/candidate-document-runtime";
const PATHWAYS=["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"];
const fail=(status:number,code:string,error:string)=>Response.json({ok:false,productionReady:false,code,error},{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const ref=(prefix:string)=>prefix+"-"+randomUUID();
async function event(config:Parameters<typeof supabaseAdminFetch>[0],row:Record<string,unknown>){try{return (await supabaseAdminFetch(config,"/rest/v1/candidate_application_events",{method:"POST",headers:{"content-type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(row)})).ok;}catch{return false;}}
export async function GET(request:Request){
 const auth=await requireCandidateSession(request);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 const url=new URL(auth.config.url+"/rest/v1/candidate_applications");url.searchParams.set("select","id,application_ref,opportunity_id,pathway_type,status,readiness_status,readiness_snapshot,provider_reference,submission_evidence_ref,submitted_at,last_status_reason,created_at,updated_at");url.searchParams.set("candidate_id","eq."+auth.session.candidateId);url.searchParams.set("order","updated_at.desc");url.searchParams.set("limit","100");
 try{const r=await supabaseAdminFetch(auth.config,url.pathname+"?"+url.searchParams);if(!r.ok)return fail(502,"APPLICATIONS_QUERY_FAILED","Application records are unavailable; confirm the N06 schema is applied.");const rows=await r.json();if(!Array.isArray(rows))return fail(502,"APPLICATIONS_INVALID","Application store returned an invalid response.");return Response.json({ok:true,productionReady:false,applications:rows,providerSubmissionRequiresEvidence:true},{headers:{"cache-control":"no-store"}});}catch{return fail(503,"APPLICATIONS_UNAVAILABLE","Application services are temporarily unavailable.");}
}
export async function POST(request:Request){
 const auth=await requireCandidateSession(request);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 let body:unknown;try{body=await request.json();}catch{return fail(400,"INVALID_JSON","Send a valid JSON request.");}
 const input=body&&typeof body==="object"?body as Record<string,unknown>:{},opportunityId=typeof input.opportunityId==="string"?input.opportunityId.trim():"";
 if(!opportunityId)return fail(400,"OPPORTUNITY_REQUIRED","Select a published opportunity.");
 const u=new URL(auth.config.url+"/rest/v1/candidate_opportunities");u.searchParams.set("select","id,pathway_type,is_published,source_status,source_checked_at,closes_at,application_method");u.searchParams.set("id","eq."+opportunityId);u.searchParams.set("is_published","eq.true");u.searchParams.set("limit","2");
 try{
  const r=await supabaseAdminFetch(auth.config,u.pathname+"?"+u.searchParams);if(!r.ok)return fail(502,"OPPORTUNITY_QUERY_FAILED","Opportunity could not be verified.");const ops=await r.json();if(!Array.isArray(ops)||ops.length!==1)return fail(404,"OPPORTUNITY_NOT_FOUND","Published opportunity was not found.");
  const op=ops[0];if(!PATHWAYS.includes(op.pathway_type))return fail(409,"PATHWAY_INVALID","Unsupported pathway.");if(op.source_status!=="VERIFIED")return fail(409,"OPPORTUNITY_SOURCE_UNVERIFIED","Opportunity source must be verified before opening an application.");if(!op.source_checked_at||Date.now()-Date.parse(op.source_checked_at)>30*24*60*60*1000)return fail(409,"OPPORTUNITY_SOURCE_STALE","Opportunity source must be rechecked within the last 30 days.");if(op.closes_at&&Date.parse(op.closes_at)<Date.now())return fail(409,"OPPORTUNITY_CLOSED","Application deadline has passed.");
  const ins=await supabaseAdminFetch(auth.config,"/rest/v1/candidate_applications",{method:"POST",headers:{"content-type":"application/json",Prefer:"return=representation"},body:JSON.stringify({application_ref:ref("APP"),candidate_id:auth.session.candidateId,opportunity_id:op.id,pathway_type:op.pathway_type,status:"DRAFT",readiness_status:"NOT_CHECKED",readiness_snapshot:{},last_status_reason:"Candidate opened a draft."})});
  if(!ins.ok)return fail(ins.status===409?409:502,ins.status===409?"APPLICATION_ALREADY_EXISTS":"APPLICATION_CREATE_FAILED",ins.status===409?"An application already exists for this opportunity.":"Application draft could not be saved.");
  const rows=await ins.json().catch(()=>null);if(!Array.isArray(rows)||rows.length!==1||!rows[0]?.id)return fail(502,"APPLICATION_CREATE_UNCONFIRMED","Application creation could not be confirmed.");
  if(!await event(auth.config,{event_ref:ref("APPEVT"),application_id:rows[0].id,candidate_id:auth.session.candidateId,actor_auth_user_id:auth.session.userId,event_type:"APPLICATION_CREATED",to_status:"DRAFT",details:{opportunityId:op.id,pathwayType:op.pathway_type}}))return fail(503,"APPLICATION_AUDIT_UNAVAILABLE","Draft exists but its audit event failed; contact support before retrying.");
  return Response.json({ok:true,productionReady:false,application:rows[0],message:"Draft created only; no provider submission was made."},{status:201,headers:{"cache-control":"no-store"}});
 }catch{return fail(503,"APPLICATIONS_UNAVAILABLE","Application services are temporarily unavailable.");}
}
