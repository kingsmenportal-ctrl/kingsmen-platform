import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const helper = await readFile(path.join(root, "apps/web/src/lib/private-document-proxy.ts"), "utf8");
const routes = [
  "apps/web/src/app/api/candidate/documents/upload-url/route.ts",
  "apps/web/src/app/api/candidate/documents/read-url/route.ts",
  "apps/web/src/app/api/candidate/documents/status/route.ts",
  "apps/web/src/app/api/founder/documents/review/route.ts",
  "apps/web/src/app/api/founder/documents/review/download-url/route.ts",
  "apps/web/src/app/operator/documents/page.tsx",
  "apps/web/src/components/operator/DocumentReviewConsole.tsx"
];
const source = await Promise.all(routes.map((route) => readFile(path.join(root, route), "utf8")));
assert.ok(helper.includes("Bearer" + String.fromCharCode(92) + "s+"), "upstream proxy must require a bearer token");
assert.ok(helper.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), "proxy must use the public anon key only");
assert.ok(helper.includes("/functions/v1/candidate-private-documents"), "proxy must call the existing private document runtime");
assert.ok(helper.includes('cache: "no-store"'), "private responses must not be cached");
assert.ok(helper.includes("AbortSignal.timeout"), "upstream calls must have a timeout");
assert.ok(helper.includes("allowlistedBody"), "request bodies must be allowlisted");
assert.ok(helper.includes("MAX_BODY_BYTES"), "request bodies must be bounded");
assert.ok(!helper.includes("SUPABASE_SERVICE_ROLE_KEY"), "web API route must not access service role credentials");
assert.ok(!helper.toLowerCase().includes("service_role"), "web API route must not reference service-role access");
assert.match(source[0], /create_upload/);
assert.match(source[1], /create_download_url/);
assert.match(source[2], /proxyPrivateDocumentRequest\(request\)/);
assert.match(source[3], /list_review_queue/);
assert.match(source[3], /review_document/);
assert.match(source[4], /create_reviewer_download_url/);
assert.match(source[5], /DocumentReviewConsole/);
assert.match(source[6], /Document review queue/);
assert.ok(!source.join("\\n").includes("SIGNER_RUNTIME_REQUIRED"), "placeholder signed URLs must be removed");
assert.ok(!source.join("\\n").includes("productionReady: false"), "placeholder route success must be removed");
console.log("PASS: candidate upload/read/status and reviewer decision routes call the existing private-document runtime.");
console.log("PASS: requests are bounded, no-store, allowlisted, bearer-authenticated and do not expose service-role credentials.");
