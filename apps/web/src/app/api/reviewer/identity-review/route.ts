import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_LIMIT = 8 * 1024;
const TIMEOUT_MS = 20_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reply(payload: unknown, status: number): Response {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "Invalid reviewer service response." };
  return Response.json(safe, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Vary: "Authorization",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}

function configuration() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    return { url: url.toString().replace(/\/+$/, ""), anonKey };
  } catch { return null; }
}

async function invoke(request: Request, functionSlug: string, method: "GET" | "POST", payload?: Record<string, unknown>) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return reply({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in with the authorised reviewer account." }, 401);
  }
  const config = configuration();
  if (!config) return reply({ ok: false, code: "NOT_CONFIGURED", error: "Identity-review service is not configured for this deployment." }, 503);

  let upstream: Response;
  try {
    upstream = await fetch(config.url + "/functions/v1/" + functionSlug, {
      method,
      headers: {
        apikey: config.anonKey,
        Authorization: authorization,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {})
      },
      ...(method === "POST" ? { body: JSON.stringify(payload ?? {}) } : {}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch {
    return reply({ ok: false, code: "REVIEWER_SERVICE_UNAVAILABLE", error: "Identity-review service is temporarily unavailable." }, 503);
  }

  let body: unknown;
  try {
    const raw = await upstream.text();
    if (raw.length > 512 * 1024) return reply({ ok: false, code: "UPSTREAM_RESPONSE_TOO_LARGE", error: "Reviewer service response exceeded the safe limit." }, 502);
    body = JSON.parse(raw);
  } catch {
    return reply({ ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "Reviewer service returned an invalid response." }, 502);
  }
  return reply(body, upstream.status);
}

export async function GET(request: Request) {
  return invoke(request, "candidate-identity-review-queue", "GET");
}

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413
      : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return reply({ ok: false, code, error: "Reviewer action request is invalid." }, status);
  }

  const action = input.action;
  if (action === "evidence_read") {
    const evidenceId = typeof input.evidence_id === "string" ? input.evidence_id : "";
    if (!UUID.test(evidenceId)) return reply({ ok: false, code: "EVIDENCE_ID_INVALID", error: "A valid evidence reference is required." }, 400);
    return invoke(request, "candidate-identity-review-evidence-read", "POST", { evidence_id: evidenceId });
  }

  if (action === "evidence_decision") {
    const evidenceId = typeof input.evidence_id === "string" ? input.evidence_id : "";
    const decision = input.decision;
    const note = typeof input.note === "string" ? input.note.trim() : "";
    if (!UUID.test(evidenceId)) return reply({ ok: false, code: "EVIDENCE_ID_INVALID", error: "A valid evidence reference is required." }, 400);
    if (decision !== "ACCEPTED" && decision !== "REJECTED") return reply({ ok: false, code: "EVIDENCE_DECISION_INVALID", error: "Choose ACCEPTED or REJECTED." }, 400);
    if (note.length < 3 || note.length > 1200) return reply({ ok: false, code: "REVIEW_NOTE_INVALID", error: "Record a review note between 3 and 1,200 characters." }, 400);
    return invoke(request, "candidate-identity-review-evidence-decision", "POST", { evidence_id: evidenceId, decision, note });
  }

  if (action === "decision") {
    const requestId = typeof input.request_id === "string" ? input.request_id : "";
    const decision = input.decision;
    const candidateReference = typeof input.candidate_reference === "string" ? input.candidate_reference.trim() : "";
    const note = typeof input.note === "string" ? input.note.trim() : "";
    if (!UUID.test(requestId)) return reply({ ok: false, code: "REQUEST_ID_INVALID", error: "A valid identity-review request is required." }, 400);
    if (decision !== "APPROVED" && decision !== "REJECTED" && decision !== "NEEDS_INFORMATION") {
      return reply({ ok: false, code: "IDENTITY_DECISION_INVALID", error: "Choose an allowed identity-review decision." }, 400);
    }
    if (decision === "APPROVED" && (candidateReference.length < 2 || candidateReference.length > 120)) {
      return reply({ ok: false, code: "CANDIDATE_REFERENCE_REQUIRED", error: "The exact candidate reference is required for approval." }, 400);
    }
    if (note.length < 3 || note.length > 1200) return reply({ ok: false, code: "REVIEW_NOTE_INVALID", error: "Record a review rationale between 3 and 1,200 characters." }, 400);
    return invoke(request, "candidate-identity-review-decision", "POST", {
      request_id: requestId,
      decision,
      candidate_reference: candidateReference || null,
      note
    });
  }

  return reply({ ok: false, code: "ACTION_NOT_SUPPORTED", error: "The requested reviewer action is not supported." }, 400);
}
