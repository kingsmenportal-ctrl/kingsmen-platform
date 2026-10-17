#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const server = readFileSync(join(root, "apps/api/src/server.ts"), "utf8");
const repository = readFileSync(join(root, "apps/api/src/db/truth-vault-repository.ts"), "utf8");
const failures = [];
const protectedRoutes = [
  'pathname === "/api/jarvis/runtime-control"',
  'pathname === "/api/commands"',
  'pathname === "/api/workflow/result" || pathname === "/api/workflow-results"',
  'method === "GET" && candidateId',
  'method === "GET" && applicationId'
];
for (const route of protectedRoutes) {
  const at = server.indexOf(route);
  if (at < 0) {
    failures.push(`Missing expected route branch: ${route}`);
    continue;
  }
  const nextBranch = server.indexOf("\n      if (", at + route.length);
  const block = server.slice(at, nextBranch < 0 ? server.length : nextBranch);
  if (!block.includes("authorizeApiRequest(request, response")) failures.push(`Route is missing request authentication: ${route}`);
}
for (const marker of [
  'process.env.KINGSMEN_API_SERVICE_TOKEN',
  'process.env.KINGSMEN_WORKFLOW_SERVICE_TOKEN',
  'timingSafeEqual',
  'API_AUTH_NOT_CONFIGURED',
  'UNAUTHENTICATED'
]) {
  if (!server.includes(marker)) failures.push(`Missing API authentication control: ${marker}`);
}
if (!repository.includes('private async withTransaction') || !repository.includes('client.query("ROLLBACK")')) {
  failures.push("Truth Vault command/workflow writes must use a transaction helper with rollback.");
}
if ((repository.match(/pg_advisory_xact_lock\(hashtext\(\$1\)\)/g) ?? []).length < 3) {
  failures.push("Expected transaction-scoped advisory locks for command idempotency and workflow idempotency/run identity.");
}
const report = {
  schema: "kingsmen.n02-n03.runtime-boundary-source-validation.v1",
  result: failures.length ? "N02_N03_RUNTIME_BOUNDARIES_BLOCKED" : "N02_N03_RUNTIME_BOUNDARIES_SOURCE_VALIDATED",
  passed: failures.length === 0,
  productionReady: false,
  protectedRoutesChecked: protectedRoutes.length,
  authIsServiceToServiceOnly: true,
  liveApiAuthTestExecuted: false,
  transactionRollbackRuntimeTestExecuted: false,
  failures,
  nextAction: "Run API build and authenticated staging proof, including duplicate races, workflow persistence, restart re-read, and a controlled late-failure rollback test in an isolated staging fixture."
};
const reportPath = join(root, "reports/api/n02-n03-runtime-boundary-source-validation-latest.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
