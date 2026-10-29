import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ORIGINS = new Set(["https://kingsmen-portal-staging.netlify.app","https://6ad61ee1da20fa786856f07e--kingsmen-portal-staging.netlify.app","http://localhost:8888","http://127.0.0.1:8888"]);
const FIELDS = new Set(["province","city","highest_grade"]);
const MAX_VALUE = 240;
function reply(status:number, body:Record<string,unknown>, origin:string|null) {
  const headers:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"};
  if(origin&&ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"]=origin;
  return new Response(JSON.stringify(body),{status,headers});
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("Origin");
  if(origin&&!ORIGINS.has(origin)) return reply(403,{error:"Origin not allowed."},null);
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:{...(origin&&ORIGINS.has(origin)?{"Access-Control-Allow-Origin":origin}:{}),"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"600","Vary":"Origin"}});
  if(req.method!=="POST") return reply(405,{error:"Method not allowed."},origin);
  if(!URL||!ANON||!SERVICE) return reply(503,{error:"Profile review service is not configured."},origin);
  const token=/^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization")??"")?.[1];
  if(!token) return reply(401,{error:"Sign in to continue."},origin);
  const auth=createClient(URL,ANON,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await auth.auth.getUser(token);
  if(userError||!userData.user) return reply(401,{error:"Your session is invalid or expired."},origin);
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return reply(400,{error:"Request body must be valid JSON."},origin);}
  if(body.action!=="load"&&body.action!=="request_change") return reply(400,{error:"Unsupported profile action."},origin);
  const admin=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:link,error:linkError}=await admin.from("candidate_auth_identity_links").select("candidate_id").eq("supabase_user_id",userData.user.id).eq("link_status","VERIFIED").not("verified_at","is",null).limit(1).maybeSingle();
  if(linkError){console.error("profile identity lookup failed",linkError.code??"unknown");return reply(503,{error:"Could not verify candidate access."},origin);}
  if(!link?.candidate_id) return reply(403,{code:"IDENTITY_NOT_VERIFIED",error:"An authorised reviewer must verify your candidate identity link before accessing the official profile."},origin);
  if(body.action==="load"){
    const {data,error}=await admin.from("candidate_profiles").select("province,city,highest_grade,profile_confidence,reviewed_by_operator,reviewed_at,updated_at").eq("candidate_id",link.candidate_id).maybeSingle();
    if(error){console.error("profile load failed",error.code??"unknown");return reply(503,{error:"Could not load the candidate profile."},origin);}
    const {data:requests, error:requestError}=await admin.from("candidate_profile_change_requests").select("id,field_name,requested_value,reason,status,requested_at").eq("candidate_id",link.candidate_id).order("requested_at",{ascending:false}).limit(30);
    if(requestError){console.error("profile requests load failed",requestError.code??"unknown");return reply(503,{error:"Could not load profile correction requests."},origin);}
    return reply(200,{ready:true,profile:data??null,change_requests:requests??[]},origin);
  }
  const field=typeof body.field_name==="string"?body.field_name:"";
  const value=typeof body.requested_value==="string"?body.requested_value.trim():"";
  const reason=typeof body.reason==="string"?body.reason.trim():"";
  if(!FIELDS.has(field)||!value||value.length>MAX_VALUE||reason.length<5||reason.length>800) return reply(400,{error:"Choose a supported profile field, enter a value under 240 characters, and provide a reason (5–800 characters)."},origin);
  const allowedProvinces=new Set(["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"]);
  const grades=new Set(["Still at school","Matric / Grade 12","Certificate","Diploma","Degree","Postgraduate","TVET / occupational qualification","Other / not sure"]);
  if(field==="province"&&!allowedProvinces.has(value)) return reply(400,{error:"Choose a valid South African province."},origin);
  if(field==="highest_grade"&&!grades.has(value)) return reply(400,{error:"Choose a supported qualification category."},origin);
  if(field==="city"&&!/^[\p{L}\p{M} .'-]{2,100}$/u.test(value)) return reply(400,{error:"Enter a valid city name."},origin);
  const {data:existing,error:existingError}=await admin.from("candidate_profile_change_requests").select("id").eq("candidate_id",link.candidate_id).eq("field_name",field).eq("status","PENDING").limit(1).maybeSingle();
  if(existingError){console.error("profile request duplicate check failed",existingError.code??"unknown");return reply(503,{error:"Could not check existing requests."},origin);}
  if(existing) return reply(409,{error:"A correction request for this field is already pending review."},origin);
  const {data:created,error:createError}=await admin.from("candidate_profile_change_requests").insert({candidate_id:link.candidate_id,field_name:field,requested_value:value,reason,sensitivity:"NORMAL",status:"PENDING"}).select("id,field_name,requested_value,reason,status,requested_at").single();
  if(createError||!created){console.error("profile request insert failed",createError?.code??"unknown");return reply(503,{error:"Could not submit your correction request."},origin);}
  return reply(201,{ready:true,request:created,message:"Correction request submitted for authorised review. The official profile has not been changed."},origin);
});