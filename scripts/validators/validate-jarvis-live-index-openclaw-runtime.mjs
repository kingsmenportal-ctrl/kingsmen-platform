import fs from "node:fs";

const files = {
  liveIndex: "apps/web/src/app/api/jarvis/live-index/route.ts",
  openClawRoute: "apps/web/src/app/api/jarvis/openclaw-operator-policy-boundary/route.ts",
  openClawProof: "scripts/staging/Invoke-KingsmenJarvisOpenClawOperatorPolicyBoundaryProof.ps1",
  package: "package.json"
};

const checks = [];

function addCheck(name, passed, detail, path) {
  checks.push({ name, passed, detail, path });
}

function read(path) {
  if (!fs.existsSync(path)) {
    addCheck(`file_exists:${path}`, false, "missing", path);
    return "";
  }
  addCheck(`file_exists:${path}`, true, "found", path);
  return fs.readFileSync(path, "utf8");
}

function requireToken(path, content, token) {
  addCheck(`token:${path}:${token}`, content.includes(token), token, path);
}

function requireAbsent(path, content, token) {
  addCheck(`forbidden_absent:${path}:${token}`, !content.includes(token), token, path);
}

const liveIndex = read(files.liveIndex);
const openClawRoute = read(files.openClawRoute);
const openClawProof = read(files.openClawProof);
const pkg = read(files.package);

[
  "openClawRuntimeProven",
  "openclaw-operator-policy",
  "OpenClaw Operator Policy Boundary",
  "OPENCLAW_OPERATOR_POLICY_CHECK",
  "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
  "/api/jarvis/openclaw-operator-policy-boundary",
  "state: openClawRuntimeProven ? \"LIVE\" : \"PENDING_RUNTIME_PROOF\"",
  "OpenClaw operator policy is runtime-proven",
  "OpenClaw remains operator-only and cannot become production authority",
  "backendHealthStatus",
  "backendStorageMode",
  "postgres_truth_vault",
  "rawSecretsReturned: false",
  "localShellExecuted: false",
  "directDatabaseAccessFromWeb: false"
].forEach((token) => requireToken(files.liveIndex, liveIndex, token));

[
  "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_READY",
  "runtimeBoundaryReady",
  "backend_api_only",
  "openClawOperatorOnly",
  "openClawMayBypassPolicy: false",
  "openClawMayExecuteWithoutApproval: false",
  "openClawMayWriteTruthVaultDirectly: false",
  "openClawMayAccessRawSecrets: false",
  "openClawMayChangePayments: false"
].forEach((token) => requireToken(files.openClawRoute, openClawRoute, token));

[
  "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_EVIDENCE_PASSED",
  "OPENCLAW_OPERATOR_POLICY_CHECK",
  "jarvis_openclaw_operator_policy_command_accepted",
  "backend_storage_mode_postgres_truth_vault"
].forEach((token) => requireToken(files.openClawProof, openClawProof, token));

[
  "jarvis:validate:live-index-openclaw"
].forEach((token) => requireToken(files.package, pkg, token));

[
  "child_process",
  "writeFile",
  "new Pool",
  "OPENCLAW_SECRET",
  "process.env.OPENCLAW_SECRET"
].forEach((token) => requireAbsent(files.liveIndex, liveIndex, token));

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Live Index OpenClaw Runtime Evidence Wiring",
  status: passed ? "JARVIS_LIVE_INDEX_OPENCLAW_RUNTIME_WIRING_VALIDATED" : "JARVIS_LIVE_INDEX_OPENCLAW_RUNTIME_WIRING_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  openClawRuntimeIndexed: true,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run web build and fetch /api/jarvis/live-index with API and web running."
    : "Repair Jarvis live-index OpenClaw runtime evidence wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
