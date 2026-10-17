import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { readAuthJson } from "@/lib/auth/request-body";
import { authConfigured, getSessionTokens, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };
const types = new Set(["EMPLOYER","RECRUITER","UNIVERSITY","TVET","PRIVATE_COLLEGE","TRAINING_PROVIDER","SETA","FUNDER","ACCOMMODATION_PROVIDER","COMMUNITY_PARTNER","OTHER"]);
const provinces = new Set(["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"]);

function dbConfig() {
  const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    return { base: url.origin, key };
  } catch { return null; }
}

async function currentUser() {
  if (!authConfigured()) return { response: NextResponse.json({ok:false,code:"IDENTITY_PROVIDER_NOT_CONFIGURED"},{status:503,headers}) };
  const user = await getVerifiedAuthUser();
  const tokens = await getSessionTokens();
  if (!user || !tokens.accessToken) return { response: NextResponse.json({ok:false,code:"CANDIDATE_AUTH_REQUIRED"},{status:401,headers}) };
  const cfg = dbConfig();
  if (!cfg) return { response: NextResponse.json({ok:false,code:"DATABASE_NOT_CONFIGURED"},{status:503,headers}) };
  return { user, token: tokens.accessToken, cfg };
}

export async function GET() {
  try {
    const auth = await currentUser();
    if ("response" in auth) return auth.response;
    const url = new URL("/rest/v1/organisations", auth.cfg.base);
    url.searchParams.set("select","id,display_name,organisation_type,official_website,contact_email,province,verification_status,created_at");
    url.searchParams.set("created_by","eq."+auth.user.id);
    url.searchParams.set("order","created_at.desc");
    const result = await fetch(url,{headers:{apikey:auth.cfg.key,Authorization:"Bearer "+auth.token,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(8000)});
    if (!result.ok) return NextResponse.json({ok:false,code:"PARTNER_RECORDS_UNAVAILABLE"},{status:503,headers});
    const organisations = await result.json();
    return NextResponse.json({ok:true,organisations}, {headers});
  } catch { return NextResponse.json({ok:false,code:"PARTNER_ACCESS_FAILED"},{status:503,headers}); }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ok:false,code:"CROSS_ORIGIN_REJECTED"},{status:403,headers});
  const parsed = await readAuthJson(request);
  if (!parsed.ok) return NextResponse.json({ok:false,code:parsed.code},{status:parsed.status,headers});
  const body = parsed.value && typeof parsed.value === "object" ? parsed.value as Record<string,unknown> : {};
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const type = typeof body.organisationType === "string" ? body.organisationType : "";
  const website = typeof body.officialWebsite === "string" ? body.officialWebsite.trim() : "";
  const email = typeof body.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
  const province = typeof body.province === "string" ? body.province : "";
  if (displayName.length < 2 || displayName.length > 180 || !types.has(type) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 ||
      (website && (!/^https?:\/\//i.test(website) || website.length > 2048)) ||
      (province && !provinces.has(province))) {
    return NextResponse.json({ok:false,code:"INVALID_ORGANISATION_DETAILS",message:"Check the organisation name, type, contact email, website and province."},{status:400,headers});
  }
  try {
    const auth = await currentUser();
    if ("response" in auth) return auth.response;
    const result = await fetch(new URL("/rest/v1/organisations",auth.cfg.base),{
      method:"POST",
      headers:{apikey:auth.cfg.key,Authorization:"Bearer "+auth.token,"Content-Type":"application/json",Prefer:"return=representation"},
      body:JSON.stringify({display_name:displayName,organisation_type:type,official_website:website||null,contact_email:email,province:province||null}),
      cache:"no-store",
      signal:AbortSignal.timeout(8000)
    });
    if (!result.ok) return NextResponse.json({ok:false,code:result.status===401||result.status===403?"PARTNER_SUBMISSION_NOT_AUTHORISED":"PARTNER_SUBMISSION_UNAVAILABLE",message:"The organisation profile could not be saved. Check account access and try again."},{status:result.status===401||result.status===403?403:503,headers});
    const rows = await result.json();
    const organisation = Array.isArray(rows) ? rows[0] : null;
    if (!organisation?.id || organisation.verification_status !== "PENDING_REVIEW") return NextResponse.json({ok:false,code:"PARTNER_SUBMISSION_RESULT_INVALID"},{status:502,headers});
    return NextResponse.json({ok:true,organisation,message:"Organisation profile submitted for review. It is not verified or publicly published yet."},{status:201,headers});
  } catch { return NextResponse.json({ok:false,code:"PARTNER_SUBMISSION_FAILED"},{status:503,headers}); }
}
