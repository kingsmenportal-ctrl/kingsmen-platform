import { requireCandidateSession, supabaseAdminFetch } from "../../../../../lib/candidate-document-runtime";
const PATHWAYS=["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"];
const fail=(status:number,code:string,error:string)=>Response.json({ok:false,productionReady:false,code,error},{status,headers:{"cache-control":"no-store"}});
export async function GET(request:Request){
 const auth=await requireCandidateSession(request);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 const q=new URL(request.url),pathway=q.searchParams.get("pathway")||"",savedOnly=q.searchParams.get("saved")==="true";
 if(pathway&&!PATHWAYS.includes(pathway))return fail(400,"PATHWAY_INVALID","Choose a supported pathway.");
 try{
  let ids:string[]=[];if(savedOnly||q.searchParams.get("includeSaved")==="true"){const s=new URL(auth.config.url+"/rest/v1/candidate_saved_opportunities");s.searchParams.set("select","opportunity_id");s.searchParams.set("candidate_id","eq."+auth.session.candidateId);s.searchParams.set("limit","500");const sr=await supabaseAdminFetch(auth.config,s.pathname+"?"+s.searchParams);if(!sr.ok)return fail(502,"SAVED_QUERY_FAILED","Saved opportunities unavailable.");const rows=await sr.json();if(!Array.isArray(rows))return fail(502,"SAVED_INVALID","Saved opportunity response invalid.");ids=rows.map((x:any)=>x.opportunity_id).filter((x:any)=>typeof x==="string");}
  const u=new URL(auth.config.url+"/rest/v1/candidate_opportunities");u.searchParams.set("select","id,opportunity_ref,title,provider_name,pathway_type,description,location_text,source_url,application_url,application_method,required_document_types,required_profile_fields,opens_at,closes_at,source_checked_at,source_status");u.searchParams.set("is_published","eq.true");if(pathway)u.searchParams.set("pathway_type","eq."+pathway);u.searchParams.set("order","closes_at.asc.nullslast");u.searchParams.set("limit","200");const r=await supabaseAdminFetch(auth.config,u.pathname+"?"+u.searchParams);if(!r.ok)return fail(502,"OPPORTUNITIES_QUERY_FAILED","Opportunity discovery unavailable.");const rows=await r.json();if(!Array.isArray(rows))return fail(502,"OPPORTUNITIES_INVALID","Opportunity response invalid.");return Response.json({ok:true,productionReady:false,pathways:PATHWAYS,opportunities:rows.filter((x:any)=>!savedOnly||ids.includes(x.id)).map((x:any)=>({...x,isSaved:ids.includes(x.id)}))},{headers:{"cache-control":"no-store"}});
 }catch{return fail(503,"OPPORTUNITIES_UNAVAILABLE","Opportunity services unavailable.");}
}
export async function POST(request:Request){
 const auth=await requireCandidateSession(request);if(!auth.ok)return fail(auth.status,auth.code,auth.message);let body:unknown;try{body=await request.json();}catch{return fail(400,"INVALID_JSON","Send a valid JSON request.");}
 const input=body&&typeof body==="object"?body as Record<string,unknown>:{},id=typeof input.opportunityId==="string"?input.opportunityId.trim():"",action=input.action==="remove"?"remove":"save";if(!id)return fail(400,"OPPORTUNITY_REQUIRED","Select an opportunity.");
 const u=new URL(auth.config.url+"/rest/v1/candidate_opportunities");u.searchParams.set("select","id");u.searchParams.set("id","eq."+id);u.searchParams.set("is_published","eq.true");u.searchParams.set("limit","2");
 try{const r=await supabaseAdminFetch(auth.config,u.pathname+"?"+u.searchParams);if(!r.ok)return fail(502,"OPPORTUNITY_QUERY_FAILED","Opportunity could not be verified.");const rows=await r.json();if(!Array.isArray(rows)||rows.length!==1)return fail(404,"OPPORTUNITY_NOT_FOUND","Published opportunity not found.");
 const s=new URL(auth.config.url+"/rest/v1/candidate_saved_opportunities");s.searchParams.set("candidate_id","eq."+auth.session.candidateId);s.searchParams.set("opportunity_id","eq."+id);let result;
 if(action==="remove")result=await supabaseAdminFetch(auth.config,s.pathname+"?"+s.searchParams,{method:"DELETE",headers:{Prefer:"return=minimal"}});
 else result=await supabaseAdminFetch(auth.config,"/rest/v1/candidate_saved_opportunities",{method:"POST",headers:{"content-type":"application/json",Prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({candidate_id:auth.session.candidateId,opportunity_id:id})});
 if(!result.ok)return fail(502,action==="remove"?"UNSAVE_FAILED":"SAVE_FAILED","Saved opportunity change failed.");return Response.json({ok:true,productionReady:false,action,opportunityId:id},{headers:{"cache-control":"no-store"}});
 }catch{return fail(503,"SAVED_UNAVAILABLE","Saved opportunity service unavailable.");}
}
