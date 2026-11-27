import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function reply(status: number, payload: Record<string, unknown>) {
  return Response.json(payload, { status, headers: { "cache-control": "no-store", pragma: "no-cache" } });
}

function decodeSecret(value: string): Uint8Array | null {
  const raw = value.startsWith("whsec_") ? value.slice(6) : value;
  try {
    const binary = atob(raw);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifySvix(rawBody: string, id: string, timestamp: string, signatureHeader: string, secret: string) {
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const keyBytes = decodeSecret(secret);
  if (!keyBytes) return false;
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = new TextEncoder().encode(id + "." + timestamp + "." + rawBody);
  const signature = await crypto.subtle.sign("HMAC", key, signed);
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return signatureHeader.split(" ").some((part) => {
    const [version, candidate] = part.split(",", 2);
    return version === "v1" && constantTimeEqual(candidate ?? "", expected);
  });
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply(405, { ok: false, code: "METHOD_NOT_ALLOWED" });
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
  const id = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signature = request.headers.get("svix-signature") ?? "";
  if (!secret || !id || !timestamp || !signature) return reply(401, { ok: false, code: "WEBHOOK_AUTH_REQUIRED" });

  // Bound the streamed byte count before buffering/decoding; character length is not a byte limit.
  const maxBodyBytes = 64 * 1024;
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBodyBytes) {
        await reader.cancel();
        return reply(413, { ok: false, code: "WEBHOOK_TOO_LARGE" });
      }
      chunks.push(value);
    }
  }
  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let rawBody: string;
  try {
    rawBody = new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes);
  } catch {
    return reply(400, { ok: false, code: "INVALID_WEBHOOK_ENCODING" });
  }
  let valid = false;
  try { valid = await verifySvix(rawBody, id, timestamp, signature, secret); } catch { valid = false; }
  if (!valid) return reply(401, { ok: false, code: "WEBHOOK_SIGNATURE_INVALID" });

  let event: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    event = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, code: "INVALID_WEBHOOK_BODY" });
  }

  const type = String(event.type ?? "");
  const eventMap: Record<string, string> = {
    "email.delivered": "DELIVERED",
    "email.bounced": "BOUNCED",
    "email.complained": "COMPLAINED",
    "email.delivery_delayed": "DELAYED"
  };
  const mapped = eventMap[type];
  const data = event.data && typeof event.data === "object" ? event.data as Record<string, unknown> : {};
  const providerMessageId = typeof data.email_id === "string" ? data.email_id : "";
  if (!mapped || !providerMessageId) {
    return reply(200, { ok: true, ignored: true, code: "UNSUPPORTED_PROVIDER_EVENT" });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return reply(503, { ok: false, code: "NOT_CONFIGURED" });
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: result, error } = await db.rpc("record_notification_provider_event", {
    p_event_id: id,
    p_provider_message_id: providerMessageId,
    p_event: mapped,
    p_safe_payload: { provider: "RESEND", event_type: type, created_at: typeof event.created_at === "string" ? event.created_at : null }
  });
  if (error) return reply(503, { ok: false, code: "PROVIDER_EVENT_RECORD_FAILED" });
  return reply(200, { ok: true, result });
});
