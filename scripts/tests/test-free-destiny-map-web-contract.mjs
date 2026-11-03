import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const form = readFileSync("apps/web/src/components/candidate/FreeDestinyMapIntakeForm.tsx", "utf8");
const page = readFileSync("apps/web/src/app/free-destiny-map/page.tsx", "utf8");
const api = readFileSync("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts", "utf8");
const bodyReader = readFileSync("apps/web/src/lib/free-destiny-map-intake-body.ts", "utf8");

const requiredRoutes = [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment",
  "nsfas_bursary",
  "accommodation",
  "cv_revamp",
  "documents",
  "source_check",
  "phoenix_fallback",
  "confused_full_map"
];

for (const route of requiredRoutes) {
  assert.ok(form.includes('["' + route + '"'), "Missing route option: " + route);
}

assert.ok(form.includes('fetch("/api/public/free-destiny-map/intake/local"'), "Form must use the existing public intake endpoint");
assert.ok(form.includes('method: "POST"'), "Form must POST its intake payload");
assert.ok(form.includes("clientRequestId: requestId.current"), "Form must send a stable retry/idempotency input");
assert.ok(form.includes('name="consentToProcessBasicInfo" required'), "Basic information consent must be mandatory");
assert.ok(form.includes('name="consentToBeContacted" required'), "Contact consent must be mandatory");
assert.ok(form.includes("accepted the intake command"), "Receipt copy must not overstate persistence");
assert.ok(form.includes("does not confirm durable database storage"), "Receipt must distinguish acceptance from durable persistence");
assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|service_role|documentBase64/i.test(form) && !/name=["\'](?:idNumber|passportNumber|bankAccount|password)["\']/i.test(form), "Public form must not expose credentials or request sensitive identifiers");
assert.ok(page.includes("FreeDestinyMapIntakeForm"), "Free Destiny Map page must mount the live form");
assert.ok(api.includes("postKingsmenCommand"), "Public route must use the backend command boundary");
assert.ok(api.includes("readBoundedRequestBody(request, MAX_BODY_BYTES)"), "Public route must enforce a streaming byte limit");
assert.ok(api.includes('mediaType !== "application/json"'), "Public route must reject non-JSON content types");
assert.ok(!api.includes("request.text()"), "Public route must not buffer an unbounded request body");
assert.ok(bodyReader.includes("request.body.getReader()"), "Body reader must consume the stream incrementally");
assert.ok(bodyReader.includes('new TextDecoder("utf-8", { fatal: true })'), "Body reader must reject malformed UTF-8");

console.log("Free Destiny Map web contract: PASS");
console.log("Verified: all six pathways plus support routes, consent gates, POST wiring, retry identifier, sensitive-field boundary, and honest receipt semantics.");
