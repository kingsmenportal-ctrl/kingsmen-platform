import { readFileSync } from "node:fs";

const route = readFileSync("apps/api/src/finance/payfast-itn-route.ts", "utf8");
const server = readFileSync("apps/api/src/server.ts", "utf8");
const checks = [
  ["ITN accepts POST only", /request\.method !== ["']POST["']/.test(route)],
  ["ITN requires URL-encoded form content type", /application\/x-www-form-urlencoded/.test(route)],
  ["duplicate form fields are rejected", /DUPLICATE_ITN_FIELD/.test(route)],
  ["database is required and fails closed", /FINANCE_DATABASE_NOT_CONFIGURED/.test(route)],
  ["database transaction is serializable", /SET TRANSACTION ISOLATION LEVEL SERIALIZABLE/.test(route)],
  ["order is loaded from database and locked", /finance_orders WHERE order_ref = \$1 FOR UPDATE/.test(route)],
  ["merchant identity is checked", /fields\.merchant_id[\s\S]{0,100}merchantId/.test(route)],
  ["direct socket address is used for source validation", /remoteAddress:\s*request\.socket\.remoteAddress/.test(route)],
  ["callback cannot activate entitlements", /entitlement activation withheld/.test(route) && !/order_status = ['"]PAID['"]/.test(route)],
  ["official sandbox and live confirmation endpoints are fixed", /https:\/\/sandbox\.payfast\.co\.za\/eng\/query\/validate/.test(route) && /https:\/\/www\.payfast\.co\.za\/eng\/query\/validate/.test(route)],
  ["server confirmation requires exact VALID response", /return text === "VALID"/.test(route)],
  ["server confirmation uses bounded timeout", /setTimeout\(\(\) => controller\.abort\(\), 5000\)/.test(route)],
  ["server confirmation is fail-closed before receipt acceptance", /if \(result\.accepted\)[\s\S]{0,180}confirmWithPayFast\(fields\)[\s\S]{0,180}result\.accepted = false/.test(route)],
  ["server mounts the ITN route", /pathname === ["']\/api\/finance\/payfast\/itn["']/.test(server) && /handlePayFastItn\(request, response\)/.test(server)],
  ["errors fail closed without exposing details", /Payment notification temporarily unavailable/.test(route)]
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (failed.length) process.exitCode = 1;
