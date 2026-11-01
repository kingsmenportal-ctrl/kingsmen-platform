import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(
  new URL("../../apps/web/src/observability/LiveObservabilityPanel.tsx", import.meta.url),
  "utf8"
);
const controlPlane = readFileSync(
  new URL("../../apps/web/src/app/control-plane/page.tsx", import.meta.url),
  "utf8"
);

const required = [
  'const storageKey = "sb-" + projectRef + "-auth-token";',
  "readFounderAccessToken(projectRef)",
  "endpoint.hostname.split",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "functions/v1/n13-observability-runtime",
  'Authorization: "Bearer " + token',
  "apikey: anonKey",
  'cache: "no-store"',
  'requestRuntime("GET")',
  'requestRuntime("POST")',
  "confirmCapture",
  "Confirm aggregate capture",
  "productionReady === true",
  "NOT VERIFIED",
  '"GREEN"',
  '"AMBER"',
  '"RED"',
  '"UNKNOWN"',
  "latestSnapshot",
  "serviceChecks",
  "aggregateMetrics"
];

for (const contract of required) {
  assert.ok(component.includes(contract), "Missing N13 UI contract: " + contract);
}

assert.ok(component.indexOf('if (!confirmCapture)') < component.indexOf('requestRuntime("POST")'),
  "Aggregate capture must require a deliberate confirmation step.");
assert.ok(component.includes("setConfirmCapture(false)"),
  "Capture confirmation must be cancellable and reset.");
assert.ok(component.includes('method,') && component.includes('method: "GET" | "POST"'),
  "Runtime calls must remain restricted to GET and explicit POST.");
assert.ok(!component.includes("sb-euhubhhnumtibbyufghm-auth-token"),
  "The browser component must not hardcode a single Supabase project's Auth storage key.");
assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(component),
  "The browser component must never reference a service-role credential.");
assert.ok(!/\.from\(["'](candidates|applications|candidate_private_documents)["']\)/.test(component),
  "The browser component must not query candidate-owned tables directly.");
assert.ok(!/id_number|document_url|candidate_id|candidate_email|phone_number/i.test(component),
  "The UI must not select or render candidate-level personal information.");
assert.ok(!/productionReady\s*:\s*true/.test(component),
  "The UI must not manufacture a production-ready status.");

assert.ok(controlPlane.includes('import { LiveObservabilityPanel } from "../../observability/LiveObservabilityPanel";'),
  "The live N13 panel must be mounted through the Founder Control Plane.");
assert.ok(controlPlane.includes('["Live observability", "observability"]'),
  "Founder navigation must link to the N13 workspace.");
assert.ok(controlPlane.includes('id: "observability"') && controlPlane.includes("<LiveObservabilityPanel />"),
  "The N13 workspace must render the authenticated panel.");
assert.ok(controlPlane.includes("13 REGISTERED SURFACES"),
  "The registered workspace count must include the N13 panel.");

console.log(JSON.stringify({
  status: "PASS",
  module: "N13 Founder Observability UI",
  checks: [
    "authenticated Supabase user token and public anon key only",
    "direct Edge Function requests are uncached",
    "read and aggregate capture verbs are bounded",
    "capture requires explicit two-step founder confirmation",
    "all four health states and production-not-verified state are rendered",
    "aggregate-only telemetry; no candidate table or PII reads",
    "panel is mounted in Founder Control Plane navigation"
  ]
}, null, 2));
