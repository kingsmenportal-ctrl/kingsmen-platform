import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/playwright-scout-map-fallback-boundary/route.ts",
  proof: "scripts/staging/Invoke-KingsmenJarvisPlaywrightScoutMapFallbackBoundaryProof.ps1",
  docs: "docs/jarvis/JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY.md",
  manifest: "manifests/jarvis/jarvis-playwright-scout-map-fallback-boundary-v1.json",
  command: "apps/web/src/app/api/jarvis/command/route.ts",
  packageJson: "package.json"
};

const checks = [];

function add(name, passed, detail, path) {
  checks.push({ name, passed, detail, path });
}

function read(path) {
  if (!fs.existsSync(path)) {
    add(`file_exists:${path}`, false, "missing", path);
    return "";
  }
  add(`file_exists:${path}`, true, "found", path);
  return fs.readFileSync(path, "utf8");
}

const contents = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, read(path)]));

function token(pathKey, value) {
  const path = files[pathKey];
  add(`token:${path}:${value}`, contents[pathKey].includes(value), value, path);
}

function absent(pathKey, value) {
  const path = files[pathKey];
  add(`forbidden_absent:${path}:${value}`, !contents[pathKey].includes(value), value, path);
}

function absentRegex(pathKey, name, pattern) {
  const path = files[pathKey];
  add(`forbidden_absent:${path}:${name}`, !pattern.test(contents[pathKey]), name, path);
}

token("route", "kingsmen.jarvis-playwright-scout-map-fallback-boundary.v1");
token("route", "Jarvis Playwright Scout MAP Fallback Boundary");
token("route", "KINGSMEN_PLAYWRIGHT_SCOUT_MODE");
token("route", "KINGSMEN_MAP_FALLBACK_ENABLED");
token("route", "KINGSMEN_PHOENIX_FALLBACK_ENABLED");
token("route", "KINGSMEN_CAPTCHA_OTP_MANUAL_ONLY");
token("route", "backend_api_only");
token("route", "browserMayRunPlaywrightDirectly: false");
token("route", "portalAutomationMayBypassPolicy: false");
token("route", "captchaOtpMayBeAutomated: false");
token("route", "playwrightScoutOnly");
token("route", "manualApplicationPackageRequired: true");
token("route", "phoenixFallbackRequired: true");
token("route", "rawSecretsReturned: false");
token("route", "directProviderCallsFromWeb: false");
token("route", "localShellExecutedFromWeb: false");
token("route", "directDatabaseAccessFromWeb: false");

token("proof", "kingsmen.jarvis-playwright-scout-map-fallback-boundary-proof.v1");
token("proof", "Jarvis Playwright Scout MAP Fallback Boundary Proof");
token("proof", "PLAYWRIGHT_SCOUT_MAP_FALLBACK_CHECK");
token("proof", "reports/jarvis/jarvis-playwright-scout-map-fallback-boundary-proof-latest.json");
token("proof", "manualApplicationPackageRequired = $true");
token("proof", "phoenixFallbackRequired = $true");
token("proof", "captchaOtpMayBeAutomated = $false");
token("proof", "directProviderCallsFromWeb = $false");

token("docs", "Jarvis Playwright Scout MAP Fallback Boundary");
token("docs", "/api/jarvis/playwright-scout-map-fallback-boundary");
token("docs", "Playwright scout/probe only");
token("docs", "Manual Application Package fallback is required");
token("docs", "Phoenix fallback is required");
token("docs", "CAPTCHA/OTP is manual-only");
token("docs", "Backend command envelope required");
token("docs", "PostgreSQL Truth Vault remains system truth");

token("manifest", "kingsmen.jarvis-playwright-scout-map-fallback-boundary.v1");
token("manifest", "jarvis_playwright_scout_map_fallback_boundary");
token("manifest", "playwrightScoutOnly");
token("manifest", "browserMayRunPlaywrightDirectly");
token("manifest", "portalAutomationMayBypassPolicy");
token("manifest", "captchaOtpMayBeAutomated");
token("manifest", "manualApplicationPackageRequired");
token("manifest", "phoenixFallbackRequired");
token("manifest", "PLAYWRIGHT_SCOUT_MAP_FALLBACK_CHECK");

token("command", "PLAYWRIGHT_SCOUT_MAP_FALLBACK_CHECK");
token("command", "playwright_scout_map_fallback_check");

token("packageJson", "jarvis:validate:playwright-scout-map-fallback");
token("packageJson", "jarvis:runtime:playwright-scout-map-fallback");

absent("route", "chromium.launch");
absentRegex("route", "from_playwright_import", /from\s+["']playwright["']/);
absentRegex("route", "require_playwright", /require\(\s*["']playwright["']\s*\)/);
absent("route", "child_process");
absent("route", "writeFile");
absent("route", "new Pool");
absent("route", "captchaSolver");
absent("route", "otpBypass");
absent("proof", "chromium.launch");
absent("proof", "npx playwright");
absent("proof", "captchaSolver");
absent("proof", "otpBypass");

const proofTrimmed = contents.proof.trimStart();
add(
  `powershell_parse_guard:${files.proof}:param_first`,
  proofTrimmed.startsWith("[CmdletBinding()]\nparam(") || proofTrimmed.startsWith("[CmdletBinding()]\r\nparam("),
  "[CmdletBinding()] | param(",
  files.proof
);

const failedChecks = checks.filter((check) => !check.passed);
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Playwright Scout MAP Fallback Boundary",
  status: failedChecks.length === 0 ? "JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY_VALIDATED" : "JARVIS_PLAYWRIGHT_SCOUT_MAP_FALLBACK_BOUNDARY_FAILED",
  passed: failedChecks.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  directProviderCallsFromWeb: false,
  playwrightScoutOnly: true,
  manualApplicationPackageRequired: true,
  phoenixFallbackRequired: true,
  captchaOtpMayBeAutomated: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: failedChecks.length === 0
    ? "Run web build, then run the Playwright scout MAP fallback boundary route and proof when runtime is available."
    : "Repair Jarvis Playwright scout MAP fallback boundary source files."
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
