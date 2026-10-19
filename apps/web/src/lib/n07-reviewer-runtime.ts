type ReviewerConfig = { url:string; anonKey:string; serviceRoleKey:string };
export type ReviewerSession = { userId:string; roles:string[]; config:ReviewerConfig };
const fail=(status:number,code:string,message:string)=>({ok:false as const,status,code,message});
function getConfig():ReviewerConfig|null {
 const url=process.env.SUPABASE_URL?.trim().replace(/\/+$/,"");
 const anonKey=process.env.SUPABASE_ANON_KEY?.trim();
 const serviceRoleKey=(process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE)?.trim();
 return url&&anonKey&&serviceRoleKey?{url,anonKey,serviceRoleKey}:null;
}
export async function requireReviewerSession(request:Request,allowedRoles:string[]):Promise<
 | {ok:true;session:ReviewerSession}
 | {ok:false;status:number;code:string;message:string}
> {
 const config=getConfig(); if(!config)return fail(503,"SUPABASE_NOT_CONFIGURED","Reviewer data services are not configured.");
 const token=request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
 if(!token)return fail(401,"AUTHENTICATION_REQUIRED","Sign in with an authorised reviewer account.");
 let identity:Response;
 try { identity=await fetch(config.url+"/auth/v1/user",{headers:{apikey:config.anonKey,authorization:"Bearer "+token},cache:"no-store"}); }
 catch { return fail(503,"AUTH_PROVIDER_UNAVAILABLE","Reviewer identity could not be checked."); }
 if(!identity.ok)return fail(401,"INVALID_SESSION","Reviewer session is invalid or expired.");
 const user=await identity.json().catch(()=>null) as {id?:string}|null;
 if(!user?.id)return fail(401,"INVALID_SESSION","Identity provider returned no user ID.");
 const url=new URL(config.url+"/rest/v1/platform_reviewers");
 url.searchParams.set("select","role_code,is_active,revoked_at");url.searchParams.set("auth_user_id","eq."+user.id);url.searchParams.set("is_active","eq.true");url.searchParams.set("limit","50");
 let response:Response;
 try { response=await fetch(url,{headers:{apikey:config.serviceRoleKey,authorization:"Bearer "+config.serviceRoleKey,accept:"application/json"},cache:"no-store"}); }
 catch { return fail(503,"REVIEWER_LOOKUP_FAILED","Reviewer permissions could not be checked."); }
 if(!response.ok)return fail(503,"REVIEWER_LOOKUP_FAILED","Reviewer permissions could not be checked; confirm N07 migration is applied.");
 const rows=await response.json().catch(()=>null) as Array<{role_code?:string;is_active?:boolean;revoked_at?:string|null}>|null;
 const roles=Array.isArray(rows)?rows.filter(x=>x.is_active===true&&!x.revoked_at&&typeof x.role_code==="string").map(x=>x.role_code!):[];
 if(!roles.some(role=>role==="PLATFORM_ADMIN"||allowedRoles.includes(role)))return fail(403,"REVIEWER_ROLE_REQUIRED","This operation requires an explicitly provisioned reviewer role.");
 return {ok:true,session:{userId:user.id,roles,config}};
}
export async function reviewerFetch(session:ReviewerSession,path:string,init:RequestInit={}):Promise<Response>{
 return fetch(session.config.url+path,{...init,headers:{apikey:session.config.serviceRoleKey,authorization:"Bearer "+session.config.serviceRoleKey,...(init.headers||{})},cache:"no-store"});
}
export const reviewerEventRef=()=>"N07EVT-"+crypto.randomUUID();
export const reviewerRef=(prefix:string)=>prefix+"-"+crypto.randomUUID();
export const reviewerFail=(status:number,code:string,error:string)=>Response.json({ok:false,productionReady:false,code,error},{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function writeReviewerEvent(session:ReviewerSession,row:Record<string,unknown>){
 const r=await reviewerFetch(session,"/rest/v1/candidate_application_events",{method:"POST",headers:{"content-type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(row)});
 return r.ok;
}
