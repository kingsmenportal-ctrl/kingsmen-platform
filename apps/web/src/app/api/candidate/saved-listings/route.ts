import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { readAuthJson } from "@/lib/auth/request-body";
import { authConfigured, getSessionTokens, getVerifiedAuthUser } from "@/lib/auth/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private", Pragma: "no-cache" };

function config() {
  const base = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  try { const url = new URL(base); if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null; return {base:url.origin,key}; } catch { return null; }
}
async function access() {
  if (!authConfigured()) return { error: NextResponse.json({ok:false,code:"IDENTITY_PROVIDER_NOT_CONFIGURED"},{status:503,headers}) };
  const user = await getVerifiedAuthUser();
  const tokens = await getSessionTokens();
  const cfg = config();
  if (!user || !tokens.accessToken) return { error: NextResponse.json({ok:false,code:"CANDIDATE_AUTH_REQUIRED"},{status:401,headers}) };
  if (!cfg) return { error: NextResponse.json({ok:false,code:"DATABASE_NOT_CONFIGURED"},{status:503,headers}) };
  return {user,token:tokens.accessToken,cfg};
}

export async function GET() {
  try {
    const auth = await access();
    if ("error" in auth) return auth.error;
    const url = new URL("/rest/v1/candidate_saved_listings",auth.cfg.base);
    url.searchParams.set("select","id,listing_id,note,created_at,organisation_listings(id,title,listing_type,province,location_text,official_source_url,application_url,application_method,eligibility,closes_at,status,source_verified_at,organisations(display_name,official_website,verification_status))");
    url.searchParams.set("user_id","eq."+auth.user.id);
    url.searchParams.set("order","created_at.desc");
    const result = await fetch(url,{headers:{apikey:auth.cfg.key,Authorization:"Bearer "+auth.token,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(8000)});
    if (!result.ok) return NextResponse.json({ok:false,code:"SAVED_LISTINGS_UNAVAILABLE"},{status:503,headers});
    const saved = await result.json();
    return NextResponse.json({ok:true,saved}, {headers});
  } catch { return NextResponse.json({ok:false,code:"SAVED_LISTINGS_ACCESS_FAILED"},{status:503,headers}); }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ok:false,code:"CROSS_ORIGIN_REJECTED"},{status:403,headers});
  const parsed = await readAuthJson(request);
  if (!parsed.ok) return NextResponse.json({ok:false,code:parsed.code},{status:parsed.status,headers});
  const body = parsed.value && typeof parsed.value === "object" ? parsed.value as Record<string,unknown> : {};
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId) || note.length > 2000) {
    return NextResponse.json({ok:false,code:"INVALID_SAVED_LISTING"},{status:400,headers});
  }
  try {
    const auth = await access();
    if ("error" in auth) return auth.error;
    const url = new URL("/rest/v1/candidate_saved_listings",auth.cfg.base);
    url.searchParams.set("on_conflict","user_id,listing_id");
    const result = await fetch(url,{method:"POST",headers:{apikey:auth.cfg.key,Authorization:"Bearer "+auth.token,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"},body:JSON.stringify({user_id:auth.user.id,listing_id:listingId,note}),cache:"no-store",signal:AbortSignal.timeout(8000)});
    if (!result.ok) return NextResponse.json({ok:false,code:result.status===401||result.status===403?"SAVED_LISTING_NOT_AUTHORISED":"SAVED_LISTING_WRITE_FAILED",message:"This listing could not be saved. It may no longer be available."},{status:result.status===401||result.status===403?403:503,headers});
    const rows = await result.json();
    return NextResponse.json({ok:true,saved:Array.isArray(rows)?rows[0]??null:null},{status:200,headers});
  } catch { return NextResponse.json({ok:false,code:"SAVED_LISTING_WRITE_FAILED"},{status:503,headers}); }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ok:false,code:"CROSS_ORIGIN_REJECTED"},{status:403,headers});
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) return NextResponse.json({ok:false,code:"INVALID_SAVED_LISTING"},{status:400,headers});
  try {
    const auth = await access();
    if ("error" in auth) return auth.error;
    const dbUrl = new URL("/rest/v1/candidate_saved_listings",auth.cfg.base);
    dbUrl.searchParams.set("user_id","eq."+auth.user.id);
    dbUrl.searchParams.set("listing_id","eq."+listingId);
    const result = await fetch(dbUrl,{method:"DELETE",headers:{apikey:auth.cfg.key,Authorization:"Bearer "+auth.token,Prefer:"return=minimal"},cache:"no-store",signal:AbortSignal.timeout(8000)});
    if (!result.ok) return NextResponse.json({ok:false,code:"SAVED_LISTING_DELETE_FAILED"},{status:503,headers});
    return NextResponse.json({ok:true,removed:true},{headers});
  } catch { return NextResponse.json({ok:false,code:"SAVED_LISTING_DELETE_FAILED"},{status:503,headers}); }
}
