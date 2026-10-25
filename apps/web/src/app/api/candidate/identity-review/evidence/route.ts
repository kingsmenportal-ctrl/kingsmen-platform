export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\\s+\\S+$/i.test(authorization)) return Response.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ error: "IDENTITY_REVIEW_NOT_CONFIGURED" }, { status: 503 });
  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: "MULTIPART_FORM_REQUIRED" }, { status: 400 }); }
  try {
    const response = await fetch(`${base}/functions/v1/candidate-identity-review-evidence-upload`, { method: "POST", headers: { apikey: key, Authorization: authorization }, body: form, cache: "no-store" });
    return Response.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "IDENTITY_EVIDENCE_UPLOAD_UNAVAILABLE" }, { status: 502 }); }
}
