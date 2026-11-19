import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("apps/web/src/app/operator/opportunities/ingestion/page.tsx", "utf8");
const edge = readFileSync("supabase/functions/n15-source-ingestion/index.ts", "utf8");

assert.ok(page.includes("getKingsmenSupabaseAccessToken"), "Ingestion operator must use the shared project-scoped session helper.");
assert.ok(page.includes("getKingsmenSupabaseBrowserConfig"), "Ingestion operator must use the shared browser config.");
assert.ok(!page.includes("sb-euhubhhnumtibbyufghm-auth-token"), "Ingestion operator must not hard-code a project-specific storage key.");
assert.ok(page.includes("ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED"), "Ingestion operator must explain reviewer authorization failures.");
assert.ok(edge.includes('observation_status: "NEEDS_REVIEW"'), "Discovered links must remain review-required.");
assert.ok(edge.includes("published_opportunities_created: 0"), "Source ingestion must never publish candidate-facing opportunities.");
assert.ok(edge.includes('KINGSMEN_PORTAL_ORIGINS'), "Portal CORS origins must be configurable explicitly.");
assert.ok(edge.includes("ORIGIN_NOT_ALLOWED"), "Unrecognized origins must fail closed.");
assert.ok(edge.includes("intern\\b"), "Internship link discovery must use a valid word-boundary expression.");
assert.ok(edge.includes('redirect: "manual"'), "Source fetching must not follow redirects outside the authority without review.");
assert.ok(edge.includes("withinAuthority(canonical.hostname.toLowerCase(), authorityHost)"), "Discovered links must stay within the registered authority host.");
assert.ok(!/Access-Control-Allow-Origin["']?\\s*:\\s*["']\\*["']/.test(edge), "N15 CORS must not be wildcarded.");

console.log("Kingsmen source ingestion contract passed.");
