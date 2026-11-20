import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20_000;
const ALLOWED_ACTIONS = new Set(["load", "save", "revoke_consent", "request_correction"]);

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
      Vary: "Authorization"
    }
  });
}

async function readBoundedUtf8(request: Request): Promise<{ raw: string } | { error: string; status: number }> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    return { error: "The profile request is too large.", status: 413 };
  }
  const reader = request.body?.getReader();
  if (!reader) return { error: "A JSON request body is required.", status: 400 };

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return { error: "The profile request is too large.", status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { error: "The profile request could not be read.", status: 400 };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { raw: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { error: "The profile request must use valid UTF-8.", status: 400 };
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return json({ ok: false, code: "JSON_REQUIRED", error: "Send the profile request as JSON." }, 415);
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = /^Bearer\s+([A-Za-z0-9._~-]+)$/i.exec(authorization)?.[1];
  if (!token || token.length > 16_384) {
    return json({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to manage your Kingsmen profile." }, 401);
  }

  const bounded = await readBoundedUtf8(request);
  if ("error" in bounded) return json({ ok: false, code: "INVALID_REQUEST_BODY", error: bounded.error }, bounded.status);

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(bounded.raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    payload = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, code: "INVALID_JSON", error: "The profile request must be a JSON object." }, 400);
  }

  if (typeof payload.action !== "string" || !ALLOWED_ACTIONS.has(payload.action)) {
    return json({ ok: false, code: "ACTION_NOT_SUPPORTED", error: "Choose a supported profile action." }, 400);
  }

  const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl || !anonKey) {
    return json({ ok: false, code: "NOT_CONFIGURED", error: "Candidate profile persistence is not configured for this deployment." }, 503);
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/candidate-master-profile`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: bounded.raw,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000)
    });
    const responseText = await upstream.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return json({ ok: false, code: "PROFILE_BACKEND_INVALID_RESPONSE", error: "The profile service returned an invalid response." }, 502);
    }
    return new Response(JSON.stringify(parsed), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
        Vary: "Authorization"
      }
    });
  } catch (error) {
    console.error("Candidate profile upstream request failed", error instanceof Error ? error.name : "unknown");
    return json({ ok: false, code: "PROFILE_BACKEND_UNAVAILABLE", error: "The profile service is temporarily unavailable. Please retry." }, 503);
  }
}
