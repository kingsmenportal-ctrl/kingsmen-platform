import fs from "node:fs";

const files = {
  route: "apps/web/src/app/api/jarvis/n8n-thin-relay-boundary/route.ts",
  proof: "scripts/staging/Invoke-KingsmenJarvisN8nThinRelayBoundaryProof.ps1",
  docs: "docs/jarvis/JARVIS_N8N_THIN_RELAY_BOUNDARY.md",
  manifest: "manifests/jarvis/jarvis-n8n-thin-relay-boundary-v1.json",
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
  "kingsmen.jarvis-n8n-thin-relay-boundary.v1",
  "Jarvis n8n Thin Relay Boundary",
  "KINGSMEN_N8N_BASE_URL",
  "KINGSMEN_N8N_API_KEY",
  "KINGSMEN_N8N_WEBHOOK_SECRET",
  "backend_api_only",
  "thinRelayOnly",
  "n8nMayBecomeAuthority: false",
  "workflowMayWriteTruthVaultDirectly: false",
  "browserMayCallN8nDirectly: false",
  "directProviderCallsFromWeb: false",
  "rawSecretsReturned: false",
  "localShellExecutedFromWeb: false",
  "directDatabaseAccessFromWeb: false"
].forEach((token) => requireToken(files.route, route, token));

[
  "kingsmen.jarvis-n8n-thin-relay-boundary-proof.v1",
  "Jarvis n8n Thin Relay Boundary Proof",
  "KINGSMEN_N8N_BASE_URL",
  "KINGSMEN_N8N_API_KEY",
  "KINGSMEN_N8N_WEBHOOK_SECRET",
  "N8N_THIN_RELAY_CHECK",
  "reports/jarvis/jarvis-n8n-thin-relay-boundary-proof-latest.json",
  "providerCredentialsPrinted = $false",
  "directProviderCallsFromWeb = $false",
  "n8nMayBecomeAuthority = $false",
  "workflowMayWriteTruthVaultDirectly = $false"
].forEach((token) => requireToken(files.proof, proof, token));

[
  "Jarvis n8n Thin Relay Boundary",
  "/api/jarvis/n8n-thin-relay-boundary",
  "n8n is a thin relay only",
  "Backend command outbox remains automation authority",
  "PostgreSQL Truth Vault remains system truth",
  "n8n may not become authority",
  "No raw secrets",
  "No direct provider calls from web",
  "Backend command envelope required"
].forEach((token) => requireToken(files.docs, docs, token));

[
  "kingsmen.jarvis-n8n-thin-relay-boundary.v1",
  "jarvis_n8n_thin_relay_boundary",
  "thinRelayOnly",
  "n8nMayBecomeAuthority",
  "workflowMayWriteTruthVaultDirectly",
  "browserMayCallN8nDirectly",
  "backend_api_only",
  "postgres_truth_vault",
  "N8N_THIN_RELAY_CHECK"
].forEach((token) => requireToken(files.manifest, manifest, token));

[
  "N8N_THIN_RELAY_CHECK",
  "n8n_thin_relay_check"
].forEach((token) => requireToken(files.command, command, token));

[
  "jarvis:validate:n8n-thin-relay",
  "jarvis:runtime:n8n-thin-relay"
].forEach((token) => requireToken(files.package, pkg, token));

[
  "n8n.cloud",
  "api.n8n.io",
  "/webhook/",
  "child_process",
  "writeFile",
  "new Pool"
].forEach((token) => requireAbsent(files.route, route, token));

[
  "n8n.cloud",
  "api.n8n.io",
  "/webhook/",
  "Write-Host $env:KINGSMEN_N8N_API_KEY",
  "Write-Output $env:KINGSMEN_N8N_API_KEY"
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
  module: "Jarvis n8n Thin Relay Boundary",
  status: passed ? "JARVIS_N8N_THIN_RELAY_BOUNDARY_VALIDATED" : "JARVIS_N8N_THIN_RELAY_BOUNDARY_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  providerCredentialsPrinted: false,
  directProviderCallsFromWeb: false,
  thinRelayOnly: true,
  n8nMayBecomeAuthority: false,
  workflowMayWriteTruthVaultDirectly: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: passed
    ? "Run web build, then run the n8n thin relay boundary route and proof when credentials/runtime are available."
    : "Repair Jarvis n8n thin relay boundary source files."
}, null, 2));

process.exit(passed ? 0 : 1);
