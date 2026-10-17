import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const route = readFileSync("apps/web/src/app/api/admin/marketplace-review/route.ts", "utf8");
const ui = readFileSync("apps/web/src/components/marketplace-review-client.tsx", "utf8");
const migration = readFileSync("db/migrations/0056_marketplace_review_event_audit.sql", "utf8");

assert.ok(route.includes("marketplace_review_events"), "API must read marketplace audit events");
assert.ok(route.includes('searchParams.set("limit","50")'), "audit read must be bounded to 50 rows");
assert.ok(route.includes('searchParams.set("order","occurred_at.desc")'), "audit events must be newest-first");
assert.ok(route.includes("auditAvailable:Array.isArray(auditEvents)"), "API must distinguish unavailable history from an empty feed");
assert.ok(route.includes("Cache-Control"), "private API responses must set cache controls");
assert.ok(ui.includes("Recent review audit"), "reviewer UI must render audit history");
assert.ok(ui.includes("Audit history is temporarily unavailable"), "UI must surface audit failure");
assert.ok(ui.includes("e.evidence_urls"), "UI must display stored evidence links");
assert.ok(migration.includes("marketplace_review_events_reviewer_read"), "audit rows need reviewer RLS");
assert.ok(migration.includes("revoke insert, update, delete, truncate, references, trigger on public.marketplace_review_events from anon, authenticated"), "clients must not mutate audit rows");

console.log("Marketplace review audit boundary source checks passed.");
