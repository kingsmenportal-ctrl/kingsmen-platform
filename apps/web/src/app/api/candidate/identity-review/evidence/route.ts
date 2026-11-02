export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function reply(body: unknown, status: number) {
  const payload = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : { error: "Invalid evidence response." };
  return Response.json(payload, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 8 * 1024 * 1024 + 64 * 1024) return reply({ code: "EVIDENCE_REQUEST_TOO_LARGE", error: "Evidence request exceeds the upload limit." }, 413);
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return reply({ code: "AUTHENTICATION_REQUIRED", error: "Sign in before uploading review evidence." }, 401);
  let incoming: FormData;
  try { incoming = await request.formData(); } catch { return reply({ code: "MULTIPART_REQUIRED", error: "Upload evidence as a file form." }, 400); }
  const requestId = incoming.get("request_id");
  const file = incoming.get("file");
  if (typeof requestId !== "string" || !(file instanceof File)) return reply({ code: "EVIDENCE_FIELDS_REQUIRED", error: "A request ID and evidence file are required." }, 400);
  if (file.size < 1 || file.size > 8 * 1024 * 1024) return reply({ code: "EVIDENCE_SIZE_INVALID", error: "Evidence must be between 1 byte and 8 MiB." }, 413);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return reply({ code: "NOT_CONFIGURED", error: "Identity evidence upload is not configured." }, 503);
  const outgoing = new FormData();
  outgoing.set("request_id", requestId);
  outgoing.set("file", file, file.name);
  try {
    const upstream = await fetch(`${url.replace(/\/+$/, "")}/functions/v1/candidate-identity-review-evidence-upload`, {
      method: "POST", headers: { apikey: anonKey, Authorization: authorization }, body: outgoing,
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30_000)
    });
    let data: unknown; try { data = JSON.parse(await upstream.text()); } catch { return reply({ code: "INVALID_UPSTREAM_RESPONSE", error: "Evidence service returned an invalid response." }, 502); }
    return reply(data, upstream.status);
  } catch { return reply({ code: "IDENTITY_EVIDENCE_UNAVAILABLE", error: "Identity evidence upload is temporarily unavailable." }, 503); }
}
