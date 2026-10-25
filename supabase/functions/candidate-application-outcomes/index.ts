import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const allowedOrigins = new Set(["https://kingsmen-portal-staging.netlify.app","http://localhost:8888","http://127.0.0.1:8888"]);
function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}
function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string,string> = { "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Pragma":"no-cache","Vary":"Origin" };
  if (origin && isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body),{status,headers});
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return reply(403,{error:"Origin not allowed."},null);
  if (req.method === "OPTIONS") return new Response(null,{status:204,headers:{
    ...(origin && isAllowedOrigin(origin) ? {"Access-Control-Allow-Origin":origin}:{}),
    "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Max-Age":"600","Vary":"Origin"
  }});
  if (req.method !== "POST") return reply(405,{error:"Method not allowed."},origin);
  if (!URL || !ANON || !SERVICE) return reply(503,{error:"Application outcome service is not configured."},origin);
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
  if (!token) return reply(401,{error:"A signed-in account is required."},origin);
  const auth = createClient(URL,ANON,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError} = await auth.auth.getUser(token);
  if (authError || !authData.user) return reply(401,{error:"Your session is invalid or expired. Sign in again."},origin);
  let payload: Record<string,unknown>;
  try { payload = await req.json(); } catch { return reply(400,{error:"Request body must be valid JSON."},origin); }
  if (payload.action !== "load") return reply(400,{error:"Action must be load."},origin);
  const admin = createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:link,error:linkError} = await admin.from("candidate_auth_identity_links")
    .select("candidate_id,link_status,verified_at")
    .eq("supabase_user_id",authData.user.id).eq("link_status","VERIFIED")
    .not("verified_at","is",null).maybeSingle();
  if (linkError) { console.error("outcome identity lookup failed",linkError.code ?? "unknown"); return reply(503,{error:"Could not verify candidate access."},origin); }
  if (!link?.candidate_id) return reply(403,{code:"IDENTITY_NOT_VERIFIED",error:"An authorised candidate identity link is required before application records can be shown."},origin);

  const {data:apps,error:appsError} = await admin.from("candidate_applications")
    .select("id,application_ref,opportunity_id,pathway_type,status,readiness_status,provider_reference,submission_evidence_ref,submitted_at,last_status_reason,created_at,updated_at,candidate_opportunities(title,provider_name,source_url)")
    .eq("candidate_id",link.candidate_id).order("updated_at",{ascending:false}).limit(200);
  if (appsError) { console.error("candidate outcome application query failed",appsError.code ?? "unknown"); return reply(503,{error:"Could not load application tracking records."},origin); }
  const ids = (apps ?? []).map((app:any)=>app.id);
  let evidence: any[] = [];
  let events: any[] = [];
  if (ids.length) {
    const evidenceResult = await admin.from("candidate_application_evidence")
      .select("evidence_ref,application_id,evidence_type,source_label,captured_at,verification_status,verification_note,verified_at")
      .eq("candidate_id",link.candidate_id).in("application_id",ids)
      .in("evidence_type",["PROVIDER_SUBMISSION_RECEIPT","PROVIDER_REFERENCE","PROVIDER_STATUS_NOTICE","PROVIDER_OUTCOME_NOTICE"])
      .order("created_at",{ascending:false}).limit(500);
    if (evidenceResult.error) { console.error("candidate outcome evidence query failed",evidenceResult.error.code ?? "unknown"); return reply(503,{error:"Could not load application evidence status."},origin); }
    evidence = evidenceResult.data ?? [];
    const eventResult = await admin.from("candidate_application_events")
      .select("event_ref,application_id,event_type,from_status,to_status,reason_code,evidence_ref,created_at")
      .eq("candidate_id",link.candidate_id).in("application_id",ids)
      .order("created_at",{ascending:false}).limit(1000);
    if (eventResult.error) { console.error("candidate outcome event query failed",eventResult.error.code ?? "unknown"); return reply(503,{error:"Could not load application history."},origin); }
    events = eventResult.data ?? [];
  }
  const applications = (apps ?? []).map((app:any) => {
    const ownEvidence = evidence.filter(item=>item.application_id===app.id).map(item=>({
      evidence_ref:item.evidence_ref,evidence_type:item.evidence_type,source_label:item.source_label,
      captured_at:item.captured_at,verification_status:item.verification_status,
      verified_at:item.verified_at,
      verification_note:item.verification_status==="VERIFIED" ? item.verification_note : null
    }));
    const verified = ownEvidence.filter(item=>item.verification_status==="VERIFIED" && item.verified_at);
    const receiptVerified = verified.some(item=>["PROVIDER_SUBMISSION_RECEIPT","PROVIDER_REFERENCE"].includes(item.evidence_type));
    const statusVerified = verified.some(item=>item.evidence_type==="PROVIDER_STATUS_NOTICE");
    const outcomeVerified = verified.some(item=>item.evidence_type==="PROVIDER_OUTCOME_NOTICE") &&
      ["OFFERED","ACCEPTED","REJECTED"].includes(app.status);
    return {
      id:app.id,application_ref:app.application_ref,pathway_type:app.pathway_type,status:app.status,
      readiness_status:app.readiness_status,provider_reference:app.provider_reference,
      submitted_at:app.submitted_at,last_status_reason:app.last_status_reason,
      created_at:app.created_at,updated_at:app.updated_at,
      opportunity:Array.isArray(app.candidate_opportunities)?app.candidate_opportunities[0] ?? null:app.candidate_opportunities ?? null,
      provider_receipt_verified:receiptVerified,provider_status_evidence_verified:statusVerified,
      outcome_verified:outcomeVerified,evidence:ownEvidence,
      history:events.filter(event=>event.application_id===app.id).map(event=>({
        event_ref:event.event_ref,event_type:event.event_type,from_status:event.from_status,
        to_status:event.to_status,reason_code:event.reason_code,evidence_ref:event.evidence_ref,created_at:event.created_at
      }))
    };
  });
  return reply(200,{ready:true,applications,policy:{
    provider_submission_is_not_inferred:true,
    outcome_requires_verified_provider_outcome_notice:true,
    evidence_storage_paths_and_hashes_omitted:true
  }},origin);
});
