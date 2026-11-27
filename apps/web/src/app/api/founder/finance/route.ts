import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", Vary: "Authorization" }
  });
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\\s+(\\S+)$/i.exec(authorization);
  if (!match) return json(401, { ok: false, code: "AUTHENTICATION_REQUIRED" });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !anonKey || !serviceKey) return json(503, { ok: false, code: "FINANCE_RUNTIME_NOT_CONFIGURED" });

  let base: URL;
  try { base = new URL(baseUrl); } catch { return json(503, { ok: false, code: "FINANCE_RUNTIME_NOT_CONFIGURED" }); }
  if (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1") {
    return json(503, { ok: false, code: "FINANCE_RUNTIME_NOT_CONFIGURED" });
  }

  try {
    const userResponse = await fetch(new URL("/auth/v1/user", base), {
      headers: { apikey: anonKey, Authorization: "Bearer " + match[1] },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000)
    });
    if (!userResponse.ok) return json(401, { ok: false, code: "SESSION_INVALID" });
    const user = await userResponse.json() as { id?: unknown };
    if (typeof user.id !== "string" || !/^[0-9a-f-]{36}$/i.test(user.id)) return json(401, { ok: false, code: "SESSION_INVALID" });

    const headers = { apikey: serviceKey, Authorization: "Bearer " + serviceKey };
    const reviewerUrl = new URL("/rest/v1/platform_reviewers", base);
    reviewerUrl.search = new URLSearchParams({
      select: "role_code", auth_user_id: "eq." + user.id, is_active: "eq.true",
      revoked_at: "is.null", role_code: "in.(FINANCE_REVIEWER,PLATFORM_ADMIN)", limit: "1"
    }).toString();
    const reviewerResponse = await fetch(reviewerUrl, {
      headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000)
    });
    if (!reviewerResponse.ok) return json(503, { ok: false, code: "FINANCE_AUTHORIZATION_CHECK_FAILED" });
    const reviewerRows = await reviewerResponse.json() as Array<{ role_code?: string }>;
    if (!Array.isArray(reviewerRows) || reviewerRows.length === 0) return json(403, { ok: false, code: "ACTIVE_FINANCE_REVIEWER_REQUIRED" });

    async function readTable(table: string, select: string) {
      const url = new URL("/rest/v1/" + table, base);
      url.search = new URLSearchParams({ select, order: "created_at.desc", limit: "100" }).toString();
      const response = await fetch(url, {
        headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error("FINANCE_READ_FAILED");
      return await response.json() as unknown[];
    }
    const [payments, refunds, notifications] = await Promise.all([
      readTable("finance_payments", "payment_ref,order_ref,provider,amount_gross_cents,amount_fee_cents,amount_net_cents,currency,payment_status,verified,verified_at,created_at"),
      readTable("finance_refund_requests", "refund_ref,payment_ref,order_ref,amount_cents,currency,refund_status,reason,created_at,reviewed_at,evidence_ref"),
      readTable("notification_outbox", "notification_ref,template_key,channel,status,created_at,sent_at,failed_at")
    ]);
    return json(200, {
      ok: true, authorization: "FINANCE_REVIEWER", livePaymentsEnabled: false, liveMessagingEnabled: false,
      dataWindow: "latest 100 records per queue", payments, refunds, notifications,
      refundMutationEnabled: false,
      refundMutationBlocker: "Finance read-model refund rows and the legacy candidate refund-review RPC use different order/request tables; reconcile schema provenance before exposing approval actions."
    });
  } catch {
    return json(503, { ok: false, code: "FINANCE_RUNTIME_UNAVAILABLE" });
  }
}
