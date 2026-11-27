import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type OutboxRow = {
  notification_ref: string;
  candidate_ref: string | null;
  channel: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string;
};

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function reply(status: number, payload: Record<string, unknown>) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "no-store", pragma: "no-cache" }
  });
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply(405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  const expected = Deno.env.get("KINGSMEN_COMMUNICATIONS_DISPATCH_SECRET") ?? "";
  const received = request.headers.get("x-kingsmen-dispatch-secret") ?? "";
  if (!expected || !safeEqual(expected, received)) return reply(401, { ok: false, code: "DISPATCH_AUTH_REQUIRED" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return reply(503, { ok: false, code: "NOT_CONFIGURED" });

  const mode = Deno.env.get("KINGSMEN_COMMUNICATIONS_MODE") ?? "disabled";
  const liveEnabled = Deno.env.get("KINGSMEN_COMMUNICATIONS_LIVE_SEND_ENABLED") === "true";
  const approvalRef = Deno.env.get("KINGSMEN_COMMUNICATIONS_APPROVAL_REF") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const from = Deno.env.get("KINGSMEN_FROM_EMAIL") ?? "";
  if (mode !== "mock" && !(mode === "resend" && liveEnabled && approvalRef && resendKey && from)) {
    return reply(503, { ok: false, code: "MESSAGING_DISABLED_OR_APPROVAL_MISSING", liveSendingEnabled: false });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Number.isInteger(body?.limit) ? Math.max(1, Math.min(20, body.limit as number)) : 10;
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: claimed, error: claimError } = await db.rpc("claim_notification_outbox", { p_limit: limit });
  if (claimError) return reply(503, { ok: false, code: "OUTBOX_CLAIM_FAILED" });

  const rows = Array.isArray(claimed) ? claimed as OutboxRow[] : [];
  let sent = 0, simulated = 0, failed = 0;
  for (const row of rows) {
    let outcome: "SENT" | "FAILED" | "SIMULATED" = "FAILED";
    let provider = mode === "mock" ? "MOCK" : "RESEND";
    let providerMessageId: string | null = null;
    let responseCode = "PROVIDER_ERROR";
    let safeResponse: Record<string, unknown> = {};
    let errorCode = "PROVIDER_DELIVERY_FAILED";

    if (row.channel !== "EMAIL_PRIMARY") {
      errorCode = "UNAPPROVED_CHANNEL";
    } else if (!row.recipient || !row.subject || !row.body) {
      errorCode = "TRANSACTIONAL_TEMPLATE_INCOMPLETE";
    } else if (mode === "mock") {
      outcome = "SIMULATED";
      responseCode = "MOCK_NO_DELIVERY";
      safeResponse = { simulated: true, deliveryConfirmed: false };
      errorCode = "";
    } else {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: "Bearer " + resendKey, "content-type": "application/json" },
          body: JSON.stringify({ from, to: [row.recipient], subject: row.subject, text: row.body }),
          signal: AbortSignal.timeout(10000)
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && typeof result?.id === "string" && result.id.length > 0) {
          outcome = "SENT";
          providerMessageId = result.id;
          responseCode = String(response.status);
          safeResponse = { acceptedByProvider: true, httpStatus: response.status };
          errorCode = "";
        } else {
          responseCode = String(response.status);
          safeResponse = { acceptedByProvider: false, httpStatus: response.status };
          errorCode = response.status >= 500 ? "PROVIDER_TEMPORARY_FAILURE" : "PROVIDER_REJECTED";
        }
      } catch {
        responseCode = "NETWORK_ERROR";
        errorCode = "PROVIDER_NETWORK_FAILURE";
      }
    }

    const { error: recordError } = await db.rpc("record_notification_delivery_attempt", {
      p_notification_ref: row.notification_ref,
      p_outcome: outcome,
      p_provider: provider,
      p_provider_message_id: providerMessageId,
      p_response_code: responseCode,
      p_safe_response: safeResponse,
      p_error_code: errorCode || null
    });
    if (recordError) {
      failed++;
      continue;
    }
    if (outcome === "SENT") sent++;
    else if (outcome === "SIMULATED") simulated++;
    else failed++;
  }
  return reply(200, {
    ok: true, claimed: rows.length, sent, simulated, failed,
    deliveryConfirmed: sent,
    liveSendingEnabled: mode === "resend" && liveEnabled && Boolean(approvalRef && resendKey && from)
  });
});
