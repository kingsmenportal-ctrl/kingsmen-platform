import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routes = [
  "apps/web/src/app/api/personal-jobs/application-tracker/route.ts",
  "apps/web/src/app/api/personal-jobs/follow-up-inbox/route.ts",
  "apps/web/src/app/api/personal-jobs/apply-now/route.ts",
  "apps/web/src/app/api/personal-jobs/opportunity-scout/route.ts"
];

const forbidden = [
  /node:child_process|from\s+["']child_process["']/,
  /from\s+["']node:fs(?:\/promises)?["']/,
  /writeFileSync|appendFileSync|mkdirSync|spawnSync|execSync/
];

const results = routes.map((path) => {
  const source = readFileSync(path, "utf8");
  const missingFailClosedSignal = !source.includes('status: "BLOCKED"')
    || !source.includes('status: 503')
    || !source.includes('Cache-Control');
  const forbiddenMatches = forbidden
    .filter((pattern) => pattern.test(source))
    .map((pattern) => pattern.toString());
  return {
    path,
    passed: !missingFailClosedSignal && forbiddenMatches.length === 0,
    missingFailClosedSignal,
    forbiddenMatches
  };
});

const report = {
  validator: "personal-jobs-safe-boundary",
  status: results.every((result) => result.passed) ? "PASS" : "FAIL",
  passed: results.every((result) => result.passed),
  results
};

console.log(JSON.stringify(report, null, 2));
assert.equal(report.passed, true, "Personal Jobs routes must remain fail-closed without shared-file or local-process access.");
