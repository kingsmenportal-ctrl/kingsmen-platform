import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const page = readFileSync(resolve(process.cwd(), "apps/web/src/app/candidate/applications/page.tsx"), "utf8");
const checks = [
  ["same-origin no-store request", /fetch\("\/api\/candidate\/applications"[\s\S]*?credentials: "same-origin"[\s\S]*?cache: "no-store"/.test(page)],
  ["requires explicit successful response", /response\.ok && body\.ok === true && Array\.isArray\(body\.applications\)/.test(page)],
  ["rejects malformed rows", /parsed\.some\(\(application\) => application === null\)/.test(page)],
  ["renders tracker fields", ["applicationId", "currentState", "portalHealth", "sourceConfidenceBand", "mapFallbackRequired"].every((field) => page.includes(field))],
  ["empty state only after authenticated success", /state\.kind === "ready" && state\.applications\.length === 0/.test(page)],
  ["does not claim external submission or outcomes", /not proof of external submission/.test(page)],
  ["signed-out and unavailable states remain", /state\.kind === "signed_out"/.test(page) && /state\.kind === "unavailable"/.test(page)],
  ["retry action available", /Refresh applications/.test(page) && /onClick=\{retry\}/.test(page)]
];
let failed = false;
for (const [label, passed] of checks) { console.log(`${passed ? "PASS" : "FAIL"} ${label}`); if (!passed) failed = true; }
if (failed) process.exitCode = 1;
