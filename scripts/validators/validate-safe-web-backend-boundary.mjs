import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, "reports/web/safe-web-backend-boundary-latest.json");

function full(path) {
  return join(repoRoot, path);
}

function read(path) {
  if (!existsSync(full(path))) return null;
  return readFileSync(full(path), "utf8");
}

function checkFile(path, requiredTokens = []) {
  const content = read(path);
  const missingTokens = content === null ? requiredTokens : requiredTokens.filter((token) => !content.includes(token));

  return {
    path,
    exists: content !== null,
    bytes: content?.length ?? 0,
    requiredTokens,
    missingTokens,
    passed: content !== null && missingTokens.length === 0
  };
}

const requiredFileChecks = [
  checkFile("apps/web/src/lib/kingsmen-backend-client.ts", [
    "KINGSMEN_BACKEND_BASE_URL",
    "backend_api_only",
    "noLocalShell: true",
    "noLocalFileWrites: true",
    "postKingsmenCommand",
    "getKingsmenApiHealth",
    "createKingsmenWebCommandEnvelope"
  ]),
  checkFile("apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts", [
    "postKingsmenCommand",
    "candidate.intake.received",
    "web_to_backend_api_boundary",
    "localWriteAttempted: false",
    "officialApplicationSubmitted: false",
    "paymentInstructionSent: false"
  ]),
  checkFile("apps/web/src/app/api/jarvis/status/route.ts", [
    "getKingsmenApiHealth",
    "Backend API Boundary",
    "Web Runtime Boundary",
    "no local shell execution"
  ]),
  checkFile("apps/web/src/app/api/jarvis/command/route.ts", [
    "postKingsmenCommand",
    "system.health.requested",
    "localShellExecuted: false",
    "directDatabaseAccessFromWeb: false"
  ]),
  checkFile("docs/web/KINGSMEN_SAFE_WEB_BACKEND_BOUNDARY.md", [
    "KINGSMEN_BACKEND_BASE_URL",
    "Public `apps/web` API routes may not",
    "The Next.js web app is a user interface and proxy surface"
  ])
];

const guardedPublicRouteFiles = [
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "apps/web/src/app/api/jarvis/status/route.ts",
  "apps/web/src/app/api/jarvis/command/route.ts"
];

const forbiddenPatterns = [
  {
    code: "CHILD_PROCESS_IMPORT_FORBIDDEN",
    description: "Public web routes must not import process execution modules.",
    pattern: /node:child_process|from\s+["']child_process["']/i
  },
  {
    code: "FS_WRITE_IMPORT_FORBIDDEN",
    description: "Public web routes must not import filesystem write helpers.",
    pattern: /from\s+["']node:fs["']|from\s+["']node:fs\/promises["']|appendFile|appendFileSync|writeFile|writeFileSync/i
  },
  {
    code: "LOCAL_WINDOWS_PATH_FORBIDDEN",
    description: "Public web routes must not depend on local workstation paths.",
    pattern: /C:\\|C:\//i
  },
  {
    code: "LOCAL_SHELL_BINARY_FORBIDDEN",
    description: "Public web routes must not call local shell/database binaries.",
    pattern: /powershell|pwsh|psql\.exe|cmd\.exe|Invoke-WebRequest/i
  },
  {
    code: "LOCAL_JSONL_WRITE_FORBIDDEN",
    description: "Public web routes must not write local JSONL proof records.",
    pattern: /jsonl|data\/local|localDataFile|proof-file writer/i
  }
];

const checks = [...requiredFileChecks];
const blockers = [];

for (const check of requiredFileChecks) {
  if (!check.passed) {
    blockers.push({
      code: "REQUIRED_FILE_OR_TOKEN_MISSING",
      path: check.path,
      detail: check.exists ? `Missing tokens: ${check.missingTokens.join(", ")}` : "File does not exist."
    });
  }
}

for (const path of guardedPublicRouteFiles) {
  const content = read(path);

  if (content === null) {
    blockers.push({
      code: "GUARDED_ROUTE_MISSING",
      path,
      detail: "A required guarded web route is missing."
    });
    continue;
  }

  for (const rule of forbiddenPatterns) {
    const passed = !rule.pattern.test(content);
    checks.push({
      path,
      rule: rule.code,
      passed,
      detail: passed ? "not found" : rule.description
    });

    if (!passed) {
      blockers.push({
        code: rule.code,
        path,
        detail: rule.description
      });
    }
  }
}

const client = read("apps/web/src/lib/kingsmen-backend-client.ts") ?? "";
if (client.includes("process.env.KINGSMEN_DATABASE_URL") || client.includes("DATABASE_URL")) {
  blockers.push({
    code: "WEB_DIRECT_DATABASE_ENV_FORBIDDEN",
    path: "apps/web/src/lib/kingsmen-backend-client.ts",
    detail: "The web backend client must use KINGSMEN_BACKEND_BASE_URL, not database URLs."
  });
}

const passed = blockers.length === 0;
const report = {
  validator: "validate-safe-web-backend-boundary",
  generatedAtIso: new Date().toISOString(),
  status: passed ? "SAFE_WEB_BACKEND_BOUNDARY_VALIDATED" : "SAFE_WEB_BACKEND_BOUNDARY_BLOCKED",
  passed,
  productionReady: false,
  publicLaunchReady: false,
  boundary: {
    webCallsBackendApiOnly: true,
    directDatabaseAccessFromWeb: false,
    localShellExecutionFromWeb: false,
    localProofFileWritesFromWeb: false,
    backendUrlEnv: "KINGSMEN_BACKEND_BASE_URL"
  },
  checks,
  blockers,
  nextAction: passed
    ? "Run staging web/API smoke proof with KINGSMEN_BACKEND_BASE_URL configured."
    : "Repair blocked web boundary files before public deployment."
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
