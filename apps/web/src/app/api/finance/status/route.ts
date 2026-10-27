export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieToken = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith("km_candidate_access_token="))?.slice("km_candidate_access_token=".length) ?? "";
  const authorizationHeader = request.headers.get("authorization") ?? "";
  const authorization = authorizationHeader.startsWith("Bearer ") ? authorizationHeader : cookieToken ? "Bearer " + decodeURIComponent(cookieToken) : "";
  if (!authorization.startsWith("Bearer ") || authorization.length < 40) {
    return Response.json({ error: "candidate_authentication_required" }, { status: 401, headers: noStore });
  }
  if (!supabaseUrl || !anonKey) {
    return Response.json({ error: "finance_status_not_configured" }, { status: 503, headers: noStore });
  }
  const body = await request.json().catch(() => ({}));
  const orderRef = typeof body?.orderRef === "string" ? body.orderRef : "";
  if (orderRef && !/^[A-Za-z0-9_-]{6,100}$/.test(orderRef)) {
    return Response.json({ error: "invalid_order_reference" }, { status: 400, headers: noStore });
  }
  try {
    const response = await fetch(supabaseUrl + "/functions/v1/payfast-sandbox?action=status", {
      method: "POST",
      headers: { apikey: anonKey, authorization, "content-type": "application/json" },
      body: JSON.stringify(orderRef ? { orderRef } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });
    const result = await response.json().catch(() => ({ error: "invalid_finance_status_response" }));
    return Response.json(result, { status: response.status, headers: noStore });
  } catch {
    return Response.json({ error: "finance_status_unavailable" }, { status: 503, headers: noStore });
  }
}
