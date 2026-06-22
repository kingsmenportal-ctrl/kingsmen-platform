import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/openclaw-operator-policy-boundary/route.ts",
  proof: "scripts/staging/Invoke-KingsmenJarvisOpenClawOperatorPolicyBoundaryProof.ps1",
  docs: "docs/jarvis/JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY.md",
  manifest: "manifests/jarvis/jarvis-openclaw-operator-policy-boundary-v1.json",
  command: "apps/web/src/app/api/jarvis/command/route.ts",
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

const route = read(files.route);
const proof = read(files.proof);
const docs = read(files.docs);
const manifest = read(files.manifest);
const command = read(files.command);
const pkg = read(files.package);

[
  "kingsmen.jarvis-openclaw-operator-policy-boundary.v1",
  "Jarvis OpenClaw Operator Policy Boundary",
  "KINGSMEN_OPENCLAW_OPERATOR_POLICY_GATE",
  "KINGSMEN_OPENCLAW_EVIDENCE_LEDGER_MODE",
  "KINGSMEN_OPENCLAW_FOUNDER_APPROVAL_MODE",
  "backend_api_only",
  "openClawOperatorOnly",
  "openClawMayBypassPolicy: false",
  "openClawMayExecuteWithoutApproval: false",
  "openClawMayWriteTruthVaultDirectly: false",
  "openClawMayAccessRawSecrets: false",
  "openClawMayChangePayments: false",
  "openClawMaySubmitPortalsWithoutMap: false",
  "operatorEvidenceLedgerRequired",
  "founderApprovalRequiredForRiskyActions",
  "backendCommandOutboxAuthority: true",
  "directProviderCallsFromWeb: false",
  "rawSecretsReturned: false",
  "localShellExecutedFromWeb: false",
  "directDatabaseAccessFromWeb: false"
].forEach((token) => requireToken(files.route, route, token));

[
  "kingsmen.jarvis-openclaw-operator-policy-boundary-proof.v1",
  "Jarvis OpenClaw Operator Policy Boundary Proof",
  "OPENCLAW_OPERATOR_POLICY_CHECK",
  "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
  "Resolve-KDetail",
  "rawSecretsPrinted = $false",
  "directProviderCallsFromWeb = $false",
  "openClawMayBypassPolicy = $false",
  "openClawMayExecuteWithoutApproval = $false",
  "openClawMayWriteTruthVaultDirectly = $false",
  "openClawMayAccessRawSecrets = $false",
  "openClawMayChangePayments = $false",
  "openClawMaySubmitPortalsWithoutMap = $false"
].forEach((token) => requireToken(files.proof, proof, token));

[
  "Jarvis OpenClaw Operator Policy Boundary",
  "/api/jarvis/openclaw-operator-policy-boundary",
  "OpenClaw operator only",
  "Backend command outbox remains automation authority",
  "PostgreSQL Truth Vault remains system truth",
  "OpenClaw may not become authority",
  "OpenClaw may not bypass policy",
  "Founder approval required for risky actions",
  "No raw secrets",
  "No direct provider calls from web",
  "Backend command envelope required"
].forEach((token) => requireToken(files.docs, docs, token));

[
  "kingsmen.jarvis-openclaw-operator-policy-boundary.v1",
  "jarvis_openclaw_operator_policy_boundary",
  "OPENCLAW_OPERATOR_POLICY_CHECK",
  "openClawOperatorOnly",
  "openClawMayBypassPolicy",
  "openClawMayExecuteWithoutApproval",
  "openClawMayWriteTruthVaultDirectly",
  "openClawMayAccessRawSecrets",
  "operatorEvidenceLedgerRequired",
  "backend_api_only",
  "postgres_truth_vault"
].forEach((token) => requireToken(files.manifest, manifest, token));

[
  "OPENCLAW_OPERATOR_POLICY_CHECK",
  "openclaw_operator_policy_check"
].forEach((token) => requireToken(files.command, command, token));

[
  "jarvis:validate:openclaw-operator-policy",
  "jarvis:runtime:openclaw-operator-policy"
].forEach((token) => requireToken(files.package, pkg, token));

[
  "child_process",
  "writeFile",
  "new Pool",
  "OPENCLAW_SECRET",
  "process.env.OPENCLAW_SECRET"
].forEach((token) => requireAbsent(files.route, route, token));

[
  "??",
  "OPENCLAW_SECRET",
  "Write-Host $env:OPENCLAW",
  "Write-Output $env:OPENCLAW"
].forEach((token) => requireAbsent(files.proof, proof, token));

const firstExecutable = proof
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .slice(0, 2)
  .join(" | ");
addCheck(
  `powershell_parse_guard:${files.proof}:param_first`,
  firstExecutable.includes("[CmdletBinding()]") && firstExecutable.includes("param("),
  firstExecutable,
  files.proof
);

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis OpenClaw Operator Policy Boundary",
  status: passed ? "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_VALIDATED" : "JARVIS_OPENCLAW_OPERATOR_POLICY_BOUNDARY_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  providerCredentialsPrinted: false,
  directProviderCallsFromWeb: false,
  openClawOperatorOnly: true,
  openClawMayBypassPolicy: false,
  openClawMayExecuteWithoutApproval: false,
  openClawMayWriteTruthVaultDirectly: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: passed
    ? "Run web build, then run the OpenClaw operator policy boundary route and proof."
    : "Repair Jarvis OpenClaw operator policy boundary source files."
}, null, 2));

process.exit(passed ? 0 : 1);
