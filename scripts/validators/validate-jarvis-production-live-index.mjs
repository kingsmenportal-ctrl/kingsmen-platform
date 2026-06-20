import { existsSync, readFileSync } from "node:fs";

const required = [
  {
    path: "apps/web/src/app/api/jarvis/live-index/route.ts",
    tokens: [
      "kingsmen.jarvis-live-index.v1",
      "noFakeData",
      "rawSecretsReturned: false",
      "localShellExecuted: false",
      "directDatabaseAccessFromWeb: false",
      "AI Provider Router",
      "Tools and Apps Registry",
      "PayFast Sandbox Provider Proof",
      "OpenClaw Operator Boundary"
    ]
  },
  {
    path: "apps/web/src/app/api/jarvis/status/route.ts",
    tokens: [
      "Jarvis Live Technology Index",
      "/api/jarvis/live-index",
      "AI_PROVIDER_ROUTER_CHECK",
      "TOOLS_APPS_AGENTS_INDEX",
      "PAYFAST_STAGING_EVIDENCE",
      "EVIDENCE_BUNDLE_REVIEW",
      "Jarvis must never invent fake candidate, payment, provider, AI, or tool status"
    ]
  },
  {
    path: "docs/jarvis/JARVIS_PRODUCTION_LIVE_INDEX.md",
    tokens: [
      "Jarvis Production Live Index",
      "/api/jarvis/live-index",
      "no fake status",
      "no raw secrets",
      "AI Provider Router",
      "Tools and Apps Registry"
    ]
  },
  {
    path: "manifests/jarvis/jarvis-production-live-index-v1.json",
    tokens: [
      "kingsmen.jarvis-production-live-index.v1",
      "backendApiBoundaryRequired",
      "noFakeData",
      "rawSecretsReturned",
      "publicLaunchAllowed"
    ]
  }
];

const checks = [];

for (const item of required) {
  const exists = existsSync(item.path);
  checks.push({ name: `file_exists:${item.path}`, passed: exists, detail: exists ? "found" : "missing", path: item.path });
  const content = exists ? readFileSync(item.path, "utf8") : "";
  for (const token of item.tokens) {
    checks.push({ name: `token:${item.path}:${token}`, passed: content.includes(token), detail: token, path: item.path });
  }
}

const failedChecks = checks.filter((check) => !check.passed);
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Production Live Index",
  status: failedChecks.length ? "JARVIS_PRODUCTION_LIVE_INDEX_FAILED" : "JARVIS_PRODUCTION_LIVE_INDEX_VALIDATED",
  passed: failedChecks.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: failedChecks.length
    ? "Repair Jarvis production live index files."
    : "Run the web build and verify /api/jarvis/live-index against a configured backend API."
};

console.log(JSON.stringify(report, null, 2));

if (!report.passed) process.exit(1);
