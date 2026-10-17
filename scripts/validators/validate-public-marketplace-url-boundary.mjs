import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const helper = read("apps/web/src/lib/security/public-url.ts");
const publicRead = read("apps/web/src/app/api/public/opportunities/route.ts");
const partnerListings = read("apps/web/src/app/api/partners/listings/route.ts");
const partnerOrganisations = read("apps/web/src/app/api/partners/organisations/route.ts");
const reviewer = read("apps/web/src/app/api/admin/marketplace-review/route.ts");
const dnsMigration = read("db/migrations/0058_marketplace_public_dns_url_constraints.sql");

assert.match(helper, /url\.protocol !== "https:"/, "public URLs must require HTTPS");
assert.match(helper, /sanitizePublicSearchQuery/, "public search input must be normalized before composing PostgREST filters");
assert.match(helper, /url\.username \|\| url\.password/, "URLs with embedded credentials must be rejected");
assert.match(helper, /isIP\(unwrappedHost\) !== 0/, "raw IP-literal hosts must be rejected");
assert.match(helper, /!host\.includes\("\."\)/, "single-label intranet hostnames must be rejected");
assert.match(helper, /localhost|\.local|\.internal/, "local-only hostnames must be rejected");
assert.match(publicRead, /isPublicHttpsUrl\(r\.source_url\)/, "public route programmes must expose only secure source links");
assert.match(publicRead, /sanitizePublicSearchQuery/, "search input must be normalized before filter composition");
assert.match(publicRead, /INVALID_PROVINCE/, "province filters must be allowlisted");
assert.match(publicRead, /isPublicHttpsUrl\(l\.official_source_url\)/, "public partner listings must expose only secure official sources");
assert.match(publicRead, /!l\.application_url\|\|isPublicHttpsUrl\(l\.application_url\)/, "unsafe application destinations must not enter the directory");
assert.match(partnerListings, /const http=\(s:string\)=>isPublicHttpsUrl\(s\)/, "partner listing intake must reject insecure source/application URLs");
assert.match(partnerOrganisations, /website && !isPublicHttpsUrl\(website\)/, "partner organisation websites must use strict HTTPS validation");
assert.match(reviewer, /if\(!isPublicHttpsUrl\(item\)\)return null/, "review evidence must be a valid public HTTPS URL");
assert.match(dnsMigration, /not_ip_literal/, "database must reject raw IP-literal source hosts");
assert.doesNotMatch(publicRead, /\^https\?:\\\//, "public directory must not retain permissive HTTP URL checks");

console.log("Public marketplace URL boundary checks passed.");
