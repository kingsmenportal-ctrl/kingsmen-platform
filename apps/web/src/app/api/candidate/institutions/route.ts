export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 12_000;
const RESPONSE_LIMIT = 256 * 1024;

type ProviderRow = {
  provider_key: string; provider_name: string; provider_type: string; province: string | null;
  base_url: string | null; verification_status: string; public_safe: boolean;
  default_confidence_band: string; notes: string;
};

function respond(payload: Record<string, unknown>, status: number) {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" }
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
  } catch {
    return null;
  }
}

function isProviderRow(value: unknown): value is ProviderRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.provider_key === "string"
    && typeof row.provider_name === "string"
    && typeof row.provider_type === "string"
    && (row.province === null || typeof row.province === "string")
    && (row.base_url === null || (typeof row.base_url === "string" && row.base_url.startsWith("https://")))
    && row.verification_status === "VERIFIED"
    && row.public_safe === true
    && (row.default_confidence_band === "A" || row.default_confidence_band === "B")
    && typeof row.notes === "string";
}

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return respond({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to load the live institution directory." }, 401);
  }
  const config = configuration();
  if (!config) return respond({ ok: false, code: "NOT_CONFIGURED", error: "The live directory source is not configured for this deployment." }, 503);

  const endpoint = new URL(`${config.url}/rest/v1/route_providers`);
  endpoint.searchParams.set("select", "provider_key,provider_name,provider_type,province,base_url,verification_status,public_safe,default_confidence_band,notes");
  endpoint.searchParams.set("public_safe", "eq.true");
  endpoint.searchParams.set("verification_status", "eq.VERIFIED");
  endpoint.searchParams.set("default_confidence_band", "in.(A,B)");
  endpoint.searchParams.set("order", "provider_name.asc");
  endpoint.searchParams.set("limit", "100");

  let upstream: Response;
  try {
    upstream = await fetch(endpoint.toString(), {
      method: "GET",
      headers: { apikey: config.anonKey, Authorization: authorization, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch {
    return respond({ ok: false, code: "DIRECTORY_SOURCE_UNAVAILABLE", error: "The live directory source is temporarily unavailable." }, 503);
  }
  if (!upstream.ok) {
    const status = upstream.status === 401 || upstream.status === 403 ? upstream.status : 502;
    const code = status === 401 ? "AUTHENTICATION_FAILED" : status === 403 ? "DIRECTORY_ACCESS_DENIED" : "DIRECTORY_UPSTREAM_ERROR";
    return respond({ ok: false, code, error: "The live directory source did not return an authorised response." }, status);
  }

  let rows: unknown;
  try {
    const raw = await upstream.text();
    if (raw.length > RESPONSE_LIMIT) return respond({ ok: false, code: "DIRECTORY_RESPONSE_TOO_LARGE", error: "The live directory response exceeded the allowed size." }, 502);
    rows = JSON.parse(raw);
  } catch {
    return respond({ ok: false, code: "INVALID_DIRECTORY_RESPONSE", error: "The live directory source returned an invalid response." }, 502);
  }
  if (!Array.isArray(rows)) return respond({ ok: false, code: "INVALID_DIRECTORY_RESPONSE", error: "The live directory response had an unexpected format." }, 502);
  return respond({ ok: true, records: rows.filter(isProviderRow) }, 200);
}
