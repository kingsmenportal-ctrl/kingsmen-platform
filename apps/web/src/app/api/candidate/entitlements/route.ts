import { requireCandidateSession, supabaseAdminFetch } from "../../../../lib/candidate-document-runtime";
const fail=(status:number,code:string,error:string)=>Response.json({ok:false,productionReady:false,code,error},{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function GET(request:Request){
 const auth=await requireCandidateSession(request);if(!auth.ok)return fail(auth.status,auth.code,auth.message);
 try{
  const q=new URLSearchParams({select:"id,entitlement_ref,package_code,status,granted_at,held_at,hold_reason,revoked_at,revoked_reason,created_at,updated_at",candidate_id:"eq."+auth.session.candidateId,order:"created_at.desc",limit:"100"});
  const e=new URLSearchParams({select:"id,event_ref,entitlement_id,order_id,event_type,from_status,to_status,reason,created_at",candidate_id:"eq."+auth.session.candidateId,order:"created_at.desc",limit:"200"});
  const [r,h]=await Promise.all([
   supabaseAdminFetch(auth.config,"/rest/v1/candidate_entitlements?"+q.toString()),
   supabaseAdminFetch(auth.config,"/rest/v1/candidate_entitlement_events?"+e.toString())
  ]);
  if(!r.ok||!h.ok)return fail(502,"ENTITLEMENTS_UNAVAILABLE","Entitlement state or event history could not be loaded; confirm the approved N11 migration is applied.");
  const [rows,events]=await Promise.all([r.json(),h.json()]);
  if(!Array.isArray(rows)||!Array.isArray(events))return fail(502,"ENTITLEMENTS_INVALID","Entitlement service returned invalid data.");
  return Response.json({ok:true,productionReady:false,entitlements:rows,events,activationRule:"Only a server-verified financial event can activate paid service."},{headers:{"cache-control":"no-store"}});
 }catch{return fail(503,"ENTITLEMENTS_UNAVAILABLE","Entitlement state is temporarily unavailable.");}
}
