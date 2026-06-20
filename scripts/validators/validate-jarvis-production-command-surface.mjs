import { readFileSync, existsSync } from "node:fs";

const required = [
  {
    path: "apps/web/src/app/jarvis/page.tsx",
    tokens: ["JarvisProductionCommandClient", "force-dynamic"]
  },
  {
    path: "apps/web/src/app/jarvis/JarvisProductionCommandClient.tsx",
    tokens: [
      "use client",
      "/api/jarvis/status",
      "/api/jarvis/command",
      "No fake data",
      "backend command envelope submission",
      "Voice context",
      "Start visual",
      "Evidence drawer",
      "Doctrine lock",
      "localShellRequested: false",
      "directDatabaseAccessRequested: false"
    ]
  },
  {
    path: "apps/web/src/app/jarvis/JarvisProductionCommand.module.css",
    tokens: [".shell", ".hero", ".orb", ".commandDeck", ".statusOk", ".statusReview", ".evidenceItem", "@media"]
  },
  {
    path: "apps/web/src/app/api/jarvis/status/route.ts",
    tokens: ["getKingsmenApiHealth", "Backend API Boundary", "commands", "doctrine"]
  },
  {
    path: "apps/web/src/app/api/jarvis/command/route.ts",
    tokens: ["postKingsmenCommand", "localShellExecuted: false", "directDatabaseAccessFromWeb: false", "SAFE_READ"]
  },
  {
    path: "manifests/jarvis/jarvis-production-command-surface-v1.json",
    tokens: ["kingsmen.jarvis-production-command-surface.v1", "noFakeData", "backendApiBoundaryRequired", "webLocalShellExecutionAllowed"]
  },
  {
    path: "docs/jarvis/JARVIS_PRODUCTION_COMMAND_SURFACE.md",
    tokens: ["Jarvis Production Command Surface", "/api/jarvis/status", "/api/jarvis/command", "npm run jarvis:validate:production"]
  },
  {
    path: "package.json",
    tokens: ["jarvis:validate:production"]
  }
];

const checks = [];

for (const item of required) {
  const exists = existsSync(item.path);
  checks.push({ name: `file_exists:${item.path}`, passed: exists, detail: exists ? "found" : "missing", path: item.path });
  const content = exists ? readFileSync(item.path, "utf8") : "";

  for (const token of item.tokens) {
    checks.push({
      name: `token:${item.path}:${token}`,
      passed: content.includes(token),
      detail: token,
      path: item.path
    });
  }
}

const failed = checks.filter((check) => !check.passed);
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Production Command Surface",
  status: failed.length ? "JARVIS_PRODUCTION_COMMAND_SURFACE_FAILED" : "JARVIS_PRODUCTION_COMMAND_SURFACE_VALIDATED",
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  backendApiBoundaryRequired: true,
  webLocalShellExecutionAllowed: false,
  webDirectDatabaseAccessAllowed: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks: failed,
  nextAction: failed.length
    ? "Repair failed Jarvis production surface checks."
    : "Run the web build and verify /jarvis against a running backend API."
};

console.log(JSON.stringify(report, null, 2));

if (!report.passed) {
  process.exit(1);
}
