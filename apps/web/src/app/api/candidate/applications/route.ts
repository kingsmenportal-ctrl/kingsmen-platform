import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_LIMIT = 16 * 1024;
const TIMEOUT_MS = 20_000;
const ALLOWED_ACTIONS = new Set([
  "load", "start_from_saved_route", "update_tracker", "add_item", "update_item", "save_n15_match", "plan_directory_target", "prepare_master_application"
]);

function respond(payload: unknown, status: number): Response {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ready: false, error: "Invalid application-preparation response." };
  return Response.json({
    ...safe,
    productionReady: false,
    candidateCanVerifySource: false,
    candidateCanMarkPaid: false,
    candidateCanMarkSubmitted: false,
    candidateCanVerifyOutcome: false,
    serviceRoleVisibleToBrowser: false
  }, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
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

async function dispatch(request: Request, incoming: Record<string, unknown>, method: "GET" | "POST") {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return respond({ ready: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to access your application tracker." }, 401);
  }
  const config = configuration();
  if (!config) return respond({ ready: false, code: "NOT_CONFIGURED", error: "Application preparation is not configured for this deployment." }, 503);

  const action = method === "GET" ? "load" : incoming.action;
  if (typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
    return respond({ ready: false, code: "ACTION_NOT_SUPPORTED", error: "The requested application-preparation action is not supported." }, 400);
  }
  // Browser-supplied candidate IDs are deliberately not forwarded. The Edge Function derives
  // ownership from the validated bearer and the verified Auth UUID -> candidate link.
  const payload: Record<string, unknown> = { action };
  if (action === "start_from_saved_route") {
    payload.route_programme_id = incoming.route_programme_id;
  } else if (action === "update_tracker") {
    payload.tracker_id = incoming.tracker_id;
    payload.status = incoming.status;
    payload.candidate_note = incoming.candidate_note;
    payload.evidence_reference = incoming.evidence_reference;
  } else if (action === "add_item") {
    payload.tracker_id = incoming.tracker_id;
    payload.title = incoming.title;
    payload.item_type = incoming.item_type;
    payload.candidate_note = incoming.candidate_note;
    payload.official_source_url = incoming.official_source_url;
  } else if (action === "update_item") {
    payload.item_id = incoming.item_id;
    payload.status = incoming.status;
    payload.candidate_note = incoming.candidate_note;
    payload.evidence_reference = incoming.evidence_reference;
  } else if (action === "save_n15_match") {
    payload.match_ref = incoming.match_ref;
    payload.pathway_type = incoming.pathway_type;
  } else if (action === "plan_directory_target") {
    payload.provider_key = incoming.provider_key;
    payload.pathway_type = incoming.pathway_type;
    payload.programme_or_role = incoming.programme_or_role;
  } else if (action === "prepare_master_application") {
    payload.target_key = incoming.target_key;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${config.url}/functions/v1/candidate-application-preparation`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch {
    return respond({ ready: false, code: "APPLICATION_PREPARATION_UNAVAILABLE", error: "Application preparation is temporarily unavailable." }, 503);
  }

  let data: unknown;
  try {
    const raw = await upstream.text();
    if (raw.length > 256 * 1024) return respond({ ready: false, code: "UPSTREAM_RESPONSE_TOO_LARGE" }, 502);
    data = JSON.parse(raw);
  } catch {
    return respond({ ready: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502);
  }
  return respond(data, upstream.status);
}

export async function GET(request: Request) {
  return dispatch(request, {}, "GET");
}

export async function POST(request: Request) {
  let incoming: Record<string, unknown>;
  try {
    incoming = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413
      : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return respond({ ready: false, code, error: "The request body is invalid." }, status);
  }
  return dispatch(request, incoming, "POST");
}
