import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_ORIGINS = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);

function isAllowedOrigin(origin: string): boolean {
  if (DEFAULT_ORIGINS.has(origin)) return true;
  const configured = (Deno.env.get("KINGSMEN_PORTAL_ORIGINS") ?? "")
    .split(",").map(value => value.trim()).filter(Boolean);
  if (configured.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
  if (origin && isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
const MAX_HTML_BYTES = 512_000;
const MAX_LINKS_PER_SOURCE = 25;
const FRESHNESS_HOURS = 24;
const KEYWORDS = /opportunit|vacanc|career|job|learnership|internship|apprentice|bursar|funding|admission|apply|programme|program|scholarship|tvet|university|college/i;

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}
function tokenRole(req: Request): string {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role ?? "";
  } catch { return ""; }
}
function canonicalHttps(input: string): URL | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
    return url;
  } catch { return null; }
}
function withinAuthority(host: string, authority: string): boolean {
  return host === authority || host.endsWith("." + authority);
}
function inferSector(text: string, authorityType = ""): string {
  const value = (text + " " + authorityType).toLowerCase();
  if (/nsfas|student aid|funding|bursar|scholarship/.test(value)) return "BURSARY";
  if (/internship|intern\b/.test(value)) return "INTERNSHIP";
  if (/apprentice/.test(value)) return "APPRENTICESHIP";
  if (/learnership|seta/.test(value)) return "LEARNERSHIP";
  if (/tvet|technical vocational/.test(value)) return "TVET";
  if (/cao|university|admission|higher education/.test(value)) return "UNIVERSITY";
  if (/qcto|qualification/.test(value)) return "QCTO";
  if (/accommodation|residence|housing/.test(value)) return "ACCOMMODATION";
  if (/job|vacanc|employment|career|recruit/.test(value)) return "EMPLOYER";
  return "EMPLOYER";
}
async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error("SOURCE_HTML_SIZE_LIMIT");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}
function extractLinks(html: string, pageUrl: URL, authorityHost: string) {
  const links: { title: string; url: string }[] = [];
  const anchorPattern = /<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1] ?? match[2] ?? match[3] ?? "";
    const title = (match[4] ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, " ").trim();
    if (title.length < 8 || title.length > 180 || !KEYWORDS.test(title + " " + href)) continue;
    let parsed: URL;
    try { parsed = new URL(href, pageUrl); } catch { continue; }
    const canonical = canonicalHttps(parsed.toString());
    if (!canonical || !withinAuthority(canonical.hostname.toLowerCase(), authorityHost)) continue;
    if (/\.(pdf|png|jpe?g|gif|svg|zip|docx?|xlsx?|pptx?)(?:$|\?)/i.test(canonical.pathname)) continue;
    links.push({ title, url: canonical.toString() });
    if (links.length >= MAX_LINKS_PER_SOURCE) break;
  }
  return [...new Map(links.map(x => [x.url, x])).values()];
}
async function inspectAuthority(authority: any, supabase: any) {
  const base = canonicalHttps(authority.base_url);
  if (!authority.active || !base) return { authority_ref: authority.authority_ref, status: "SKIPPED_INVALID_OR_INACTIVE", created: 0, skipped: 0 };
  const authorityHost = base.hostname.toLowerCase();
  const checkedAt = new Date();
  try {
    const response = await fetch(base.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: { "Accept": "text/html,application/xhtml+xml", "User-Agent": "KingsmenSourceScout/1.0 (+official-source-review; no automated applications)" }
    });
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      return { authority_ref: authority.authority_ref, status: "REDIRECT_REQUIRES_REVIEW", http_status: response.status, created: 0, skipped: 0 };
    }
    if (!response.ok) {
      await response.body?.cancel();
      return { authority_ref: authority.authority_ref, status: "HTTP_ERROR", http_status: response.status, created: 0, skipped: 0 };
    }
    const type = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      await response.body?.cancel();
      return { authority_ref: authority.authority_ref, status: "NON_HTML_SOURCE", created: 0, skipped: 0 };
    }
    const html = await readLimited(response);
    const links = extractLinks(html, base, authorityHost);
    const rows = [];
    for (const link of links) {
      const fingerprint = await digest(authority.authority_ref + "|" + link.url);
      rows.push({
        observation_ref: "n15_" + fingerprint.slice(0, 48),
        authority_ref: authority.authority_ref,
        source_url: link.url,
        source_title: link.title,
        sector: inferSector(link.title, authority.authority_type),
        observed_claim: "Unreviewed official-source link candidate. Opening status, deadline, eligibility, fees, accreditation and outcome have not been verified.",
        source_confidence: "HIGH",
        observation_status: "NEEDS_REVIEW",
        observed_at: checkedAt.toISOString(),
        last_checked_at: checkedAt.toISOString(),
        stale_after: new Date(checkedAt.getTime() + FRESHNESS_HOURS * 3600_000).toISOString(),
        valid_until: null,
        evidence_refs: [base.toString()],
        review_reason: "AUTOMATED_LINK_DISCOVERY_ONLY; HUMAN_VERIFICATION_REQUIRED"
      });
    }
    if (!rows.length) return { authority_ref: authority.authority_ref, status: "FETCHED_NO_CANDIDATE_LINKS", http_status: response.status, created: 0, skipped: 0 };
    const { data: before, error: beforeError } = await supabase.from("external_source_observations")
      .select("observation_ref").in("observation_ref", rows.map(x => x.observation_ref));
    if (beforeError) throw beforeError;
    const prior = new Set((before ?? []).map((x: any) => x.observation_ref));
    const { error } = await supabase.from("external_source_observations")
      .upsert(rows, { onConflict: "observation_ref" });
    if (error) throw error;
    return {
      authority_ref: authority.authority_ref, status: "FETCHED",
      http_status: response.status, links_found: rows.length,
      created: rows.filter(x => !prior.has(x.observation_ref)).length,
      updated: rows.filter(x => prior.has(x.observation_ref)).length,
      note: "All observations remain NEEDS_REVIEW; none is published as an open opportunity."
    };
  } catch (error) {
    return {
      authority_ref: authority.authority_ref, status: "FETCH_FAILED",
      reason: error instanceof Error ? error.message.slice(0, 180) : "UNKNOWN_SOURCE_FETCH_ERROR",
      created: 0, skipped: 0
    };
  }
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return json({ status: "FORBIDDEN", reason: "ORIGIN_NOT_ALLOWED" }, 403, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ status: "METHOD_NOT_ALLOWED" }, 405, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key || !anonKey) return json({ status: "CONFIGURATION_ERROR", reason: "SUPABASE_SERVICE_CONFIGURATION_MISSING" }, 500, origin);

  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const callerRole = tokenRole(req);
  if (callerRole !== "service_role") {
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: authError } = await authClient.auth.getUser(bearer);
    if (authError || !userData.user) return json({ status: "UNAUTHENTICATED" }, 401, origin);
    const reviewerClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: reviewer, error: reviewerError } = await reviewerClient.from("platform_reviewers")
      .select("role_code").eq("auth_user_id", userData.user.id).eq("is_active", true)
      .in("role_code", ["PLATFORM_ADMIN", "PROVIDER_OPERATOR", "APPLICATION_REVIEWER", "EVIDENCE_VERIFIER"])
      .limit(1).maybeSingle();
    if (reviewerError) return json({ status: "DATABASE_ERROR", reason: "REVIEWER_AUTHORIZATION_LOOKUP_FAILED" }, 500, origin);
    if (!reviewer) return json({ status: "FORBIDDEN", reason: "ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED" }, 403, origin);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const runRef = "n15_run_" + crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const { error: runError } = await supabase.from("n15_ingestion_runs").insert({
    run_ref: runRef, status: "RUNNING", started_at: startedAt
  });
  if (runError) return json({ status: "DATABASE_ERROR", reason: "INGESTION_RUN_CREATE_FAILED" }, 500, origin);
  const { data: authorities, error: authorityError } = await supabase.from("opportunity_source_authorities")
    .select("authority_ref,authority_name,authority_type,base_url,active,sector_scope")
    .eq("active", true).order("authority_ref").limit(100);
  if (authorityError) {
    await supabase.from("n15_ingestion_runs").update({ status: "FAILED", finished_at: new Date().toISOString(), summary: { error: "AUTHORITY_READ_FAILED" } }).eq("run_ref", runRef);
    return json({ status: "DATABASE_ERROR", reason: "AUTHORITY_READ_FAILED", run_ref: runRef }, 500, origin);
  }
  const results: any[] = [];
  for (let i = 0; i < (authorities ?? []).length; i += 4) {
    const batch = (authorities ?? []).slice(i, i + 4);
    results.push(...await Promise.all(batch.map((authority: any) => inspectAuthority(authority, supabase))));
  }
  const sourcesSucceeded = results.filter(x => ["FETCHED", "FETCHED_NO_CANDIDATE_LINKS"].includes(x.status)).length;
  const created = results.reduce((n, x) => n + (x.created ?? 0), 0);
  const updated = results.reduce((n, x) => n + (x.updated ?? 0), 0);
  const skipped = results.reduce((n, x) => n + (x.skipped ?? 0), 0);
  const status = sourcesSucceeded === results.length ? "COMPLETED" : sourcesSucceeded > 0 ? "PARTIAL" : "FAILED";
  const summary = {
    run_ref: runRef, status, sources_checked: results.length, sources_succeeded: sourcesSucceeded,
    observations_created: created, observations_updated: updated, observations_skipped: skipped,
    review_required: created + updated, published_opportunities_created: 0, results
  };
  const { error: finishError } = await supabase.from("n15_ingestion_runs").update({
    status, sources_checked: results.length, sources_succeeded: sourcesSucceeded,
    observations_created: created, observations_updated: updated, observations_skipped: skipped,
    summary, finished_at: new Date().toISOString()
  }).eq("run_ref", runRef);
  if (finishError) return json({ status: "DATABASE_ERROR", reason: "INGESTION_RUN_FINISH_FAILED", run_ref: runRef }, 500, origin);
  return json(summary, status === "FAILED" ? 502 : 200, origin);
});
