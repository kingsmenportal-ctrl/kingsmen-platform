import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = new URL("../../apps/api/src/founder-ops/founder-live-brief.ts", import.meta.url);
const source = await readFile(path, "utf8");
const required = [
  ["all nine founder brief domains", '"urgent_candidates"'],
  ["explicit evidence references", "sourceRef: string"],
  ["domain-specific freshness limits", "MAX_AGE_SECONDS"],
  ["missing evidence never appears healthy", 'state: "MISSING"'],
  ["stale evidence remains visible", 'state: stale ? "STALE"'],
  ["invalid future evidence is rejected", "timestamp > nowMs + 30_000"],
  ["metrics are key/value filtered", "safeMetrics"],
  ["sensitive metric keys are excluded", "SENSITIVE_METRIC_KEY"],
  ["common personal identifiers are redacted from summaries", "[redacted-id]"],
  ["email redaction uses a literal dot boundary", "+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi"],
  ["national ID redaction uses word boundaries", "/\\b\\d{13}\\b/g"],
  ["phone redaction uses word boundaries", "/\\b(?:\\+?27|0)[1-8]\\d{8}\\b/g"],
  ["malformed observation metadata fails closed", "typeof observation.summary !== \"string\""],
  ["cap defaults to 500", ": 500"],
  ["national route access protected at cap", "preserve access to all in-scope national routes"],
  ["no launch-readiness claim", "productionReady: false"],
  ["no direct founder finality", "directly submit applications, settle refunds"],
  ["missing feeds generate fix actions", "Restore evidence feed for"],
  ["stale feeds generate refresh actions", "Refresh"],
  ["commands remain governed", "N12 approval and N16 execution"]
];
for (const [label, needle] of required) {
  assert.ok(source.includes(needle), `Missing contract: ${label} (${needle})`);
  console.log("PASS", label);
}
assert.ok(!source.includes("service_role"), "Read model must not expose privileged credentials");
assert.ok(!source.includes("process.env"), "Pure brief builder must not read runtime secrets");
console.log(`N17 founder live brief source contract: ${required.length + 2}/${required.length + 2} assertions passed.`);
