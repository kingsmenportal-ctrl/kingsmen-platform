import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  programme_name: string;
  route_type: string;
  qualification_type: string | null;
  province: string | null;
  delivery_mode: string;
  application_method: string;
  source_url: string;
  source_confidence_band: string;
  route_status: string;
  availability_status: string;
  eligibility_summary: string;
  updated_at: string;
  route_providers?: {
    provider_name: string;
    provider_type: string;
    base_url: string | null;
    verification_status: string;
    public_safe: boolean;
  };
};

function unavailable(message: string, status = 503) {
  return NextResponse.json(
    { ok: false, status: "UNAVAILABLE", code: "PUBLIC_OPPORTUNITY_READ_UNAVAILABLE", message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }
  );
}

export async function GET(request: Request) {
  const base = process.env.SUPABASE_URL ?? process.env.KINGSMEN_SUPABASE_URL;
  const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonToken = process.env.SUPABASE_ANON_KEY;
  if (!base || !apiKey || !anonToken) {
    return unavailable("The verified opportunity data connection is not configured. No sample opportunities are shown as real.");
  }

  const url = new URL(request.url);
  const sector = url.searchParams.get("sector")?.trim().toUpperCase();
  const province = url.searchParams.get("province")?.trim();
  const search = url.searchParams.get("q")?.trim().slice(0, 100);
  const allowedSectors = new Set(["UNIVERSITY", "TVET", "SETA", "LEARNERSHIP", "BURSARY", "ACCOMMODATION", "EMPLOYER", "PRIVATE_COLLEGE", "NSFAS", "CAO"]);
  if (sector && !allowedSectors.has(sector)) {
    return NextResponse.json({ ok: false, code: "INVALID_SECTOR" }, { status: 400 });
  }

  const query = new URL("/rest/v1/route_programmes", base);
  query.searchParams.set("select", "id,programme_name,route_type,qualification_type,province,delivery_mode,application_method,source_url,source_confidence_band,route_status,availability_status,eligibility_summary,updated_at,route_providers!inner(provider_name,provider_type,base_url,verification_status,public_safe)");
  query.searchParams.set("route_status", "eq.VERIFIED");
  query.searchParams.set("availability_status", "in.(OPEN,FUTURE)");
  query.searchParams.set("source_confidence_band", "in.(A,B)");
  query.searchParams.set("route_providers.public_safe", "eq.true");
  query.searchParams.set("route_providers.verification_status", "eq.VERIFIED");
  query.searchParams.set("order", "updated_at.desc");
  query.searchParams.set("limit", "100");
  if (sector) query.searchParams.set("route_type", "eq." + sector);
  if (province) query.searchParams.set("province", "eq." + province);
  if (search) query.searchParams.set("or", "(programme_name.ilike.*" + search.replace(/[(),.*%_]/g, "") + "*,eligibility_summary.ilike.*" + search.replace(/[(),.*%_]/g, "") + "*)");

  try {
    const response = await fetch(query, {
      headers: { apikey: apiKey, Authorization: "Bearer " + anonToken, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return unavailable("The verified opportunity source could not be reached.");
    const rows = await response.json() as Row[];
    const now = Date.now();
    const opportunities = rows.filter(row => {
      if (!row.route_providers?.public_safe || row.route_providers.verification_status !== "VERIFIED") return false;
      if (!row.source_url || !/^https?:\/\//i.test(row.source_url)) return false;
      if (!row.updated_at || !Number.isFinite(Date.parse(row.updated_at)) || now - Date.parse(row.updated_at) > 1000 * 60 * 60 * 24 * 90) return false;
      return true;
    }).map(row => ({
      id: row.id,
      title: row.programme_name,
      category: row.route_type,
      qualification: row.qualification_type,
      province: row.province,
      deliveryMode: row.delivery_mode,
      applicationMethod: row.application_method,
      sourceUrl: row.source_url,
      provider: row.route_providers?.provider_name ?? "Verified provider",
      eligibilitySummary: row.eligibility_summary,
      availability: row.availability_status,
      verifiedAt: row.updated_at,
      sourceConfidence: row.source_confidence_band
    }));
    return NextResponse.json(
      { ok: true, source: "verified_database", count: opportunities.length, opportunities, checkedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120", "X-Content-Type-Options": "nosniff" } }
    );
  } catch {
    return unavailable("The verified opportunity source timed out or was unavailable.");
  }
}
