export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ") || authorization.length < 40) {
    return Response.json({ error: "candidate_authentication_required" }, { status: 401, headers: noStore });
  }
  if (!supabaseUrl || !anonKey) {
    return Response.json({ error: "finance_checkout_not_configured" }, { status: 503, headers: noStore });
  }
  const body = await request.json().catch(() => null);
  const planCode = typeof body?.planCode === "string" ? body.planCode : "";
  const idempotencyKey = request.headers.get("idempotency-key") ?? (typeof body?.idempotencyKey === "string" ? body.idempotencyKey : "");
  if (!/^[A-Z0-9_]{3,80}$/.test(planCode) || !/^[A-Za-z0-9._:-]{8,160}$/.test(idempotencyKey)) {
    return Response.json({ error: "valid_plan_code_and_idempotency_key_required" }, { status: 400, headers: noStore });
  }
  try {
    const response = await fetch(supabaseUrl + "/functions/v1/payfast-sandbox", {
      method: "POST",
      headers: { apikey: anonKey, authorization, "content-type": "application/json", "idempotency-key": idempotencyKey },
      body: JSON.stringify({ planCode, idempotencyKey }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });
    const result = await response.json().catch(() => ({ error: "invalid_payment_provider_response" }));
    return Response.json(result, { status: response.status, headers: noStore });
  } catch {
    return Response.json({ error: "finance_checkout_provider_unavailable" }, { status: 503, headers: noStore });
  }
}
