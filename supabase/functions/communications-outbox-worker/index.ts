import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json(405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  const configuredToken = Deno.env.get("KINGSMEN_NOTIFICATION_WORKER_TOKEN") ?? "";
  const suppliedToken = request.headers.get("x-kingsmen-worker-token") ?? "";
  if (configuredToken.length < 32 || suppliedToken.length !== configuredToken.length) {
    return json(401, { ok: false, code: "WORKER_AUTH_REQUIRED" });
  }
  let same = 0;
  for (let i = 0; i < configuredToken.length; i += 1) same |= configuredToken.charCodeAt(i) ^ suppliedToken.charCodeAt(i);
  if (same !== 0) return json(401, { ok: false, code: "WORKER_AUTH_REQUIRED" });
  if (Deno.env.get("COMMUNICATIONS_PROVIDER_MODE") !== "mock" || Deno.env.get("KINGSMEN_LIVE_MESSAGING_ENABLED") === "true") {
    return json(503, { ok: false, code: "LIVE_MESSAGING_DISABLED", liveSendExecuted: false });
  }
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(503, { ok: false, code: "WORKER_NOT_CONFIGURED" });
  // Supabase Edge Functions verify JWT by default; the internal runner must present
  // the service JWT plus the separate worker token. Neither credential is returned.
  if ((request.headers.get("authorization") ?? "") !== "Bearer " + serviceKey) {
    return json(401, { ok: false, code: "SERVICE_AUTH_REQUIRED" });
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > 1024)) {
    return json(413, { ok: false, code: "REQUEST_TOO_LARGE" });
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 1024) return json(413, { ok: false, code: "REQUEST_TOO_LARGE" });
  let body: { limit?: unknown; mockOutcome?: unknown } | null;
  try { body = JSON.parse(rawBody) as { limit?: unknown; mockOutcome?: unknown }; }
  catch { body = null; }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json(400, { ok: false, code: "INVALID_JSON" });
  const limit = typeof body.limit === "number" && Number.isInteger(body.limit) ? Math.min(Math.max(body.limit, 1), 20) : 10;
  const mockOutcome = body.mockOutcome === "fail" ? "fail" : "simulate";
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: claimed, error: claimError } = await admin.rpc("claim_kingsmen_notification_outbox", { p_limit: limit });
  if (claimError) return json(503, { ok: false, code: "OUTBOX_CLAIM_FAILED" });
  let simulated = 0;
  let requeued = 0;
  let failed = 0;
  let unsupported = 0;
  for (const item of (claimed ?? []) as Array<Record<string, unknown>>) {
    const ref = typeof item.notification_ref === "string" ? item.notification_ref : "";
    if (!ref) continue;
    if (item.channel !== "EMAIL_PRIMARY" || item.purpose !== "TRANSACTIONAL") {
      const { data, error } = await admin.rpc("record_kingsmen_notification_attempt", {
        p_notification_ref: ref, p_provider: "MOCK", p_result: "FAILED",
        p_response_code: "CHANNEL_OR_PURPOSE_NOT_ALLOWED", p_provider_message_id: null, p_retry_after_seconds: 300
      });
      if (error) return json(503, { ok: false, code: "ATTEMPT_RECORD_FAILED" });
      unsupported += 1;
      if (data?.[0]?.status === "FAILED") failed += 1;
      else requeued += 1;
      continue;
    }
    const { data, error } = await admin.rpc("record_kingsmen_notification_attempt", {
      p_notification_ref: ref,
      p_provider: "MOCK",
      p_result: mockOutcome === "fail" ? "FAILED" : "SIMULATED",
      p_response_code: mockOutcome === "fail" ? "MOCK_PROVIDER_FAILURE" : "MOCK_ONLY",
      p_provider_message_id: null,
      p_retry_after_seconds: 60
    });
    if (error) return json(503, { ok: false, code: "ATTEMPT_RECORD_FAILED" });
    const status = data?.[0]?.status;
    if (status === "SIMULATED") simulated += 1;
    else if (status === "FAILED") failed += 1;
    else if (status === "QUEUED") requeued += 1;
  }
  return json(200, { ok: true, claimed: (claimed ?? []).length, simulated, requeued, failed, unsupported,
    liveSendExecuted: false, deliveryClaimedEqualsDelivered: false });
});
