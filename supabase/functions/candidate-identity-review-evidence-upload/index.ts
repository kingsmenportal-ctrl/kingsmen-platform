import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = "identity-review-evidence";
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const origins = new Set(["https://kingsmen-portal-staging.netlify.app", "http://localhost:8888", "http://127.0.0.1:8888"]);

function allowed(origin: string): boolean {
  return origins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}
function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Pragma": "no-cache", "Vary": "Origin" };
  if (origin && allowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
function safeFilename(name: string): string {
  return name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-180) || "evidence";
}
function sha256(bytes: Uint8Array): Promise<string> {
  return crypto.subtle.digest("SHA-256", bytes).then((hash) =>
    Array.from(new Uint8Array(hash)).map((value) => value.toString(16).padStart(2, "0")).join("")
  );
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !allowed(origin)) return reply(403, { error: "Origin not allowed." }, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    ...(origin && allowed(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600", "Vary": "Origin"
  }});
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." }, origin);
  if (!URL || !ANON || !SERVICE) return reply(503, { error: "Evidence service is not configured." }, origin);
  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return reply(401, { error: "A signed-in candidate session is required." }, origin);

  const auth = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer[1]);
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid or expired. Sign in again." }, origin);

  let form: FormData;
  try { form = await req.formData(); } catch { return reply(400, { error: "Upload must use multipart form data." }, origin); }
  const requestId = typeof form.get("request_id") === "string" ? String(form.get("request_id")).trim() : "";
  const file = form.get("file");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return reply(400, { error: "A valid identity-review request ID is required." }, origin);
  if (!(file instanceof File)) return reply(400, { error: "Select a PDF, JPEG, or PNG evidence file." }, origin);
  if (!TYPES.has(file.type)) return reply(415, { error: "Only PDF, JPEG, and PNG evidence files are accepted." }, origin);
  if (file.size < 1 || file.size > MAX_BYTES) return reply(413, { error: "Evidence files must be smaller than or equal to 8 MB." }, origin);

  const service = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: request, error: requestError } = await service
    .from("candidate_identity_review_requests")
    .select("id,request_status")
    .eq("id", requestId)
    .eq("supabase_user_id", authData.user.id)
    .maybeSingle();
  if (requestError) {
    console.error("identity evidence ownership lookup failed", requestError.code ?? "unknown");
    return reply(503, { error: "Request ownership could not be checked." }, origin);
  }
  if (!request) return reply(404, { error: "The identity-review request was not found for this signed-in account." }, origin);
  if (!["PENDING", "NEEDS_INFORMATION"].includes(request.request_status)) return reply(409, { error: "Evidence cannot be added to a closed identity-review request." }, origin);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = file.type === "application/pdf" && bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  const jpeg = file.type === "image/jpeg" && bytes.length >= 3 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = file.type === "image/png" && bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
    bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (!pdf && !jpeg && !png) return reply(415, { error: "The file contents do not match an allowed PDF, JPEG, or PNG type." }, origin);
  const digest = await sha256(bytes);
  const path = `${authData.user.id}/${requestId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await service.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "0",
    upsert: false
  });
  if (uploadError) {
    console.error("identity evidence private upload failed", uploadError.message ? "storage_error" : "unknown");
    return reply(503, { error: "The evidence file could not be stored privately. No upload is confirmed." }, origin);
  }

  const { data: evidence, error: insertError } = await service
    .from("candidate_identity_review_evidence")
    .insert({
      request_id: requestId,
      supabase_user_id: authData.user.id,
      storage_bucket: BUCKET,
      storage_path: path,
      original_filename: safeFilename(file.name),
      mime_type: file.type,
      size_bytes: file.size,
      sha256_hex: digest
    })
    .select("id,request_id,original_filename,mime_type,size_bytes,review_status,uploaded_at")
    .single();
  if (insertError || !evidence) {
    await service.storage.from(BUCKET).remove([path]);
    console.error("identity evidence metadata persistence failed", insertError?.code ?? "unknown");
    return reply(503, { error: "Evidence metadata could not be saved. The uploaded object was removed." }, origin);
  }
  return reply(201, { evidence, message: "Evidence stored privately and queued for reviewer inspection. It has not been verified." }, origin);
});
