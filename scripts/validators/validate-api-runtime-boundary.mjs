import { readFileSync } from "node:fs";

const source = readFileSync("apps/api/src/server.ts", "utf8");
const checks = [
  ["CORS must not default to wildcard", !/KINGSMEN_API_CORS_ORIGIN\s*\?\?\s*["']\*["']/.test(source) && !/access-control-allow-origin["']?,\s*["']\*["']/.test(source)],
  ["CORS requires exact configured origin match", /requestOrigin\s*===\s*configuredOrigin/.test(source)],
  ["unapproved browser origins fail closed", /CORS_ORIGIN_NOT_ALLOWED/.test(source) && /sendError\(response, 403/.test(source)],
  ["responses are non-cacheable", /setHeader\(["']cache-control["'],\s*["']no-store["']\)/.test(source)],
  ["response content type is nosniff protected", /setHeader\(["']x-content-type-options["'],\s*["']nosniff["']\)/.test(source)],
  ["request body cap uses byte length", /receivedBytes\s*\+=\s*chunk\.length/.test(source) && /receivedBytes\s*>\s*MAX_BODY_BYTES/.test(source)],
  ["oversized body is rejected only once and further chunks are not retained", /let exceededLimit = false/.test(source) && /if \(exceededLimit \|\| settled\) return/.test(source) && /if \(settled\) return;\s*settled = true;\s*resolve\(body\)/.test(source)],
  ["request body reader does not resolve after an oversized rejection", /if \(settled\) return;\s*settled = true;\s*resolve\(body\)/.test(source) && /exceededLimit = true;\s*settled = true;\s*reject\(new Error\("REQUEST_BODY_TOO_LARGE"\)\)/.test(source)],
  ["internal errors are not returned to clients", /sendError\(response, 500, ["']KINGSMEN_API_ERROR["'], ["']The request could not be completed\.["']\)/.test(source)]
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (failed.length) process.exitCode = 1;
