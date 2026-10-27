export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return Response.json({ configuration: "missing_web_supabase_config", productionReady: false }, { status: 503, headers: noStore });
  }
  try {
    const response = await fetch(supabaseUrl + "/functions/v1/payfast-sandbox", {
      method: "GET",
      headers: { apikey: anonKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    const body = await response.json().catch(() => null);
    return Response.json({
      module: "N10_PAYFAST_SANDBOX",
      environment: body?.environment ?? "unknown",
      configuration: body?.configuration ?? "unknown",
      missingKeys: Array.isArray(body?.missingKeys) ? body.missingKeys : [],
      catalogueReady: body?.catalogueReady === true,
      catalogueMismatches: Array.isArray(body?.catalogueMismatches) ? body.catalogueMismatches : [],
      livePaymentsEnabled: false,
      productionReady: false,
      realTransactionProven: false
    }, { status: response.ok ? 200 : 503, headers: noStore });
  } catch {
    return Response.json({ configuration: "provider_health_unavailable", productionReady: false }, { status: 503, headers: noStore });
  }
}
