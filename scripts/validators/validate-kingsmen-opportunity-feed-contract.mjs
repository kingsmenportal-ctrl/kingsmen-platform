import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const edge = readFileSync("supabase/functions/n15-candidate-opportunities/index.ts", "utf8");
const workbench = readFileSync("apps/web/src/app/candidate/workbench/page.tsx", "utf8");

assert.ok(edge.includes("KINGSMEN_PORTAL_ORIGINS"), "Opportunity feed must allow explicit approved deployment origins.");
assert.ok(edge.includes("ORIGIN_NOT_ALLOWED"), "Opportunity feed must reject unknown browser origins.");
assert.ok(!edge.includes('"Access-Control-Allow-Origin": "*"'), "Opportunity feed must never use wildcard CORS.");
assert.ok(edge.includes("verified_at") && edge.includes("verified_by"), "Opportunity feed must require verified identity evidence.");
assert.ok(edge.includes("AUTH_UUID.test(link.verified_by)"), "Opportunity feed must reject malformed reviewer identifiers.");
assert.ok(edge.includes("verifiedAt > Date.now()"), "Opportunity feed must reject future verification timestamps.");
assert.ok(edge.includes("candidate_auth_identity_links"), "Opportunity feed must resolve identity from the canonical identity-link table.");
assert.ok(edge.includes("only_authorised_identity: true"), "Feed must report its identity gate in the safety response.");
assert.ok(edge.includes("no_stale_or_unverified_opportunities: true"), "Feed must enforce source freshness and verification.");
assert.ok(workbench.includes("getKingsmenSupabaseAccessToken"), "Workbench must use the shared project-scoped session helper.");
assert.ok(workbench.includes("candidate-master-applications"), "Workbench must use the internal application planning endpoint.");

console.log("Kingsmen opportunity feed contract passed.");
