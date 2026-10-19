import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const origins = new Set(["https://kingsmen-portal-staging.netlify.app","http://kingsmen-portal-staging.netlify.app","https://6ad61ee1da20fa786856f07e--kingsmen-portal-staging.netlify.app","http://6ad61ee1da20fa786856f07e--kingsmen-portal-staging.netlify.app","http://localhost:8888","http://127.0.0.1:8888"]);
const trackerStatuses = new Set(["SAVED","PREPARING","READY_TO_APPLY","SUBMITTED_CANDIDATE_REPORTED","RESPONSE_RECEIVED","INTERVIEW","OFFER_RECEIVED","REJECTED","CLOSED"]);
const itemStatuses = new Set(["NOT_STARTED","IN_PROGRESS","READY_CANDIDATE_REPORTED"]);
const pathwayMap: Record<string,string> = {"HIGHER_EDUCATION":"higher_education","TVET":"tvet","SETA_LEARNERSHIP":"seta_learnership","INTERNSHIP":"internship","APPRENTICESHIP":"apprenticeship","EMPLOYMENT":"employment","higher_education":"higher_education","tvet":"tvet","seta":"seta_learnership","employment":"employment","entrepreneurship":"employment"};
function reply(status:number, body:Record<string,unknown>, origin:string|null) {
 const headers:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"};
 if(origin&&origins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 return new Response(JSON.stringify(body),{status,headers});
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!origins.has(origin))return reply(403,{error:"Origin not allowed."},null);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin??"","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"600","Vary":"Origin"}});
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
 if(p.action==="load"){
  const {data:trackers,error}=await admin.from("candidate_application_tracker").select("id,candidate_id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at,candidate_workspace_saved_opportunities(id,title,organisation,official_url,pathway,closing_date)").eq("candidate_id",candidateId).order("updated_at",{ascending:false});
  if(error){console.error("application tracker load failed",error.code??"unknown");return reply(503,{error:"Could not load application preparation records."},origin);}
  const ids=(trackers??[]).map((t:any)=>t.id);
  let items:any[]=[];
  if(ids.length){const result=await admin.from("candidate_application_preparation_items").select("id,tracker_id,item_type,title,candidate_note,official_source_url,evidence_reference,status,required_by_candidate,due_date,created_at,updated_at").eq("candidate_id",candidateId).in("tracker_id",ids).order("created_at",{ascending:true});if(result.error){console.error("preparation items load failed",result.error.code??"unknown");return reply(503,{error:"Could not load preparation checklist items."},origin);}items=result.data??[];}
  return reply(200,{ready:true,trackers:trackers??[],items,message:"Saved application preparation records loaded. No provider submission is implied."},origin);
 }
 if(p.action==="start_from_saved_route"){
  const routeId=typeof p.route_programme_id==="string"?p.route_programme_id:"";
  if(!/^[0-9a-f-]{36}$/i.test(routeId))return reply(400,{error:"A valid saved opportunity identifier is required."},origin);
  const {data:saved,error:savedError}=await admin.from("candidate_saved_routes").select("id,route_programme_id").eq("user_id",authData.user.id).eq("route_programme_id",routeId).maybeSingle();
  if(savedError||!saved){if(savedError)console.error("saved route lookup failed",savedError.code??"unknown");return reply(404,{error:"Save this opportunity to your account before creating its tracker."},origin);}
  const {data:route,error:routeError}=await admin.from("route_programmes").select("id,programme_name,provider_id,route_type,source_url,source_confidence_band,route_status,availability_status,metadata").eq("id",routeId).eq("route_status","VERIFIED").in("availability_status",["OPEN","FUTURE"]).in("source_confidence_band",["A","B"]).maybeSingle();
  if(routeError||!route){if(routeError)console.error("verified route lookup failed",routeError.code??"unknown");return reply(409,{error:"This opportunity is no longer available as a verified route."},origin);}
  const officialUrl=typeof route.source_url==="string"?route.source_url:"";
  if(!/^https:\/\//i.test(officialUrl))return reply(409,{error:"The opportunity has no usable HTTPS official source, so a tracker cannot be created."},origin);
  const meta=route.metadata&&typeof route.metadata==="object"?route.metadata as Record<string,unknown>:{};
  const organisation=String(meta.organisation??meta.provider_name??"Official provider").trim().slice(0,180)||"Official provider";
  const rawPathway=String(route.route_type??"");
  const pathway=pathwayMap[rawPathway]??pathwayMap[rawPathway.toUpperCase()];
  if(!pathway)return reply(409,{error:"This route type needs catalogue mapping before it can be tracked."},origin);
  const closingDate=typeof meta.closing_date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(meta.closing_date)?meta.closing_date:null;
  const {data:opportunity,error:oppError}=await admin.from("candidate_workspace_saved_opportunities").upsert({candidate_id:candidateId,title:String(route.programme_name).trim().slice(0,180),organisation,official_url:officialUrl,pathway,closing_date:closingDate,updated_at:new Date().toISOString()},{onConflict:"candidate_id,official_url"}).select("id").single();
  if(oppError||!opportunity){console.error("saved opportunity sync failed",oppError?.code??"unknown");return reply(503,{error:"Could not connect the saved opportunity to the candidate workspace."},origin);}
  const {data:existing,error:existingError}=await admin.from("candidate_application_tracker").select("id,candidate_id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at").eq("candidate_id",candidateId).eq("saved_opportunity_id",opportunity.id).maybeSingle();
  if(existingError){console.error("tracker duplicate lookup failed",existingError.code??"unknown");return reply(503,{error:"Could not check the application tracker."},origin);}
  if(existing)return reply(200,{ready:true,tracker:existing,already_exists:true,message:"This saved opportunity already has a preparation tracker."},origin);
  const {data:tracker,error:trackerError}=await admin.from("candidate_application_tracker").insert({candidate_id:candidateId,saved_opportunity_id:opportunity.id,status:"SAVED",candidate_note:"",evidence_reference:""}).select("id,candidate_id,saved_opportunity_id,status,candidate_note,evidence_reference,created_at,updated_at").single();
  if(trackerError||!tracker){console.error("tracker create failed",trackerError?.code??"unknown");return reply(503,{error:"Could not create the application tracker."},origin);}
  const defaults=[{item_type:"TASK",title:"Review the official opportunity requirements"},{item_type:"DOCUMENT",title:"Prepare the documents requested by the provider"},{item_type:"TASK",title:"Check eligibility and closing date"},{item_type:"TASK",title:"Review the application before any submission"}];
  const {error:itemError}=await admin.from("candidate_application_preparation_items").insert(defaults.map(i=>({...i,tracker_id:tracker.id,candidate_id:candidateId,candidate_note:"",official_source_url:officialUrl,evidence_reference:"",status:"NOT_STARTED",required_by_candidate:true})));
  if(itemError){console.error("default checklist create failed",itemError.code??"unknown");return reply(503,{error:"Tracker created, but its checklist could not be completed. Reload the tracker and contact support before retrying."},origin);}
  return reply(201,{ready:true,tracker,already_exists:false,message:"Preparation tracker and four checklist items created. This is not a provider application or submission."},origin);
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