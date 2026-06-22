import fs from "node:fs";

const checks = [];

function addCheck(name, passed, detail, path) {
  checks.push({ name, passed: Boolean(passed), detail, path });
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

function forbidToken(path, content, token) {
  addCheck(`forbidden_absent:${path}:${token}`, !content.includes(token), token, path);
}

const routePath = "apps/web/src/app/api/jarvis/payfast-provider-proof-queue-boundary/route.ts";
const proofPath = "scripts/staging/Invoke-KingsmenJarvisPayFastProviderProofQueueBoundaryProof.ps1";
const docsPath = "docs/jarvis/JARVIS_PAYFAST_PROVIDER_PROOF_QUEUE_BOUNDARY.md";
const manifestPath = "manifests/jarvis/jarvis-payfast-provider-proof-queue-boundary-v1.json";
const commandPath = "apps/web/src/app/api/jarvis/command/route.ts";
const packagePath = "package.json";

const route = read(routePath);
const proof = read(proofPath);
const docs = read(docsPath);
const manifest = read(manifestPath);
const command = read(commandPath);
const pkg = read(packagePath);

[
  "kingsmen.jarvis-payfast-provider-proof-queue-boundary.v1",
  "Jarvis PayFast Provider Proof Queue Boundary",
  "PayFast Provider Proof Queue Boundary",
  "PAYFAST_MERCHANT_ID",
  "PAYFAST_MERCHANT_KEY",
  "PAYFAST_PASSPHRASE",
  "PAYFAST_NOTIFY_URL",
  "PAYMENT_PROVIDER_SECRET",
  "backend_api_only",
  "acceptedItnRequiredForPaidStatus: true",
  "returnUrlMayMarkPaid: false",
  "cancelUrlMayMarkPaid: false",
  "refundsAutoApproved: false",
  "directProviderCallsFromWeb: false",
  "rawSecretsReturned: false",
  "localShellExecutedFromWeb: false",
  "directDatabaseAccessFromWeb: false",
  "browserMayCallPayFastDirectly: false"
].forEach((token) => requireToken(routePath, route, token));

[
  "kingsmen.jarvis-payfast-provider-proof-queue-boundary-proof.v1",
  "Jarvis PayFast Provider Proof Queue Boundary Proof",
  "PAYFAST_MERCHANT_ID",
  "PAYFAST_MERCHANT_KEY",
  "PAYFAST_PASSPHRASE",
  "PAYFAST_NOTIFY_URL",
  "PAYMENT_PROVIDER_SECRET",
  "PAYFAST_PROVIDER_PROOF_QUEUE_CHECK",
  "reports/jarvis/jarvis-payfast-provider-proof-queue-boundary-proof-latest.json",
  "acceptedItnRequiredForPaidStatus = $true",
  "returnUrlMayMarkPaid = $false",
  "cancelUrlMayMarkPaid = $false",
  "refundsAutoApproved = $false",
  "providerCredentialsPrinted = $false",
  "directProviderCallsFromWeb = $false"
].forEach((token) => requireToken(proofPath, proof, token));

[
  "Jarvis PayFast Provider Proof Queue Boundary",
  "/api/jarvis/payfast-provider-proof-queue-boundary",
  "no fake status",
  "no raw secrets",
  "no provider credentials printed",
  "no direct provider calls from web",
  "Accepted ITN is required",
  "Return URL cannot mark paid",
  "Cancel URL cannot mark paid",
  "Refunds require human review",
  "backend command envelope required"
].forEach((token) => requireToken(docsPath, docs, token));

[
  "kingsmen.jarvis-payfast-provider-proof-queue-boundary.v1",
  "jarvis_payfast_provider_proof_queue_boundary",
  "backend_api_only",
  "postgres_truth_vault",
  "acceptedItnRequiredForPaidStatus",
  "returnUrlMayMarkPaid",
  "cancelUrlMayMarkPaid",
  "refundsAutoApproved",
  "browserMayCallPayFastDirectly",
  "PAYFAST_PROVIDER_PROOF_QUEUE_CHECK"
].forEach((token) => requireToken(manifestPath, manifest, token));

[
  "PAYFAST_PROVIDER_PROOF_QUEUE_CHECK",
  "payfast_provider_proof_queue_check"
].forEach((token) => requireToken(commandPath, command, token));

[
  "jarvis:validate:payfast-provider-proof-queue",
  "jarvis:runtime:payfast-provider-proof-queue"
].forEach((token) => requireToken(packagePath, pkg, token));

[
  "payfast.co.za",
  "api.payfast",
  "sandbox.payfast",
  "child_process",
  "writeFile",
  "new Pool"
].forEach((token) => forbidToken(routePath, route, token));

[
  "payfast.co.za",
  "api.payfast",
  "sandbox.payfast",
  "Write-Host $env:PAYFAST_MERCHANT_KEY",
  "Write-Output $env:PAYFAST_MERCHANT_KEY",
  "Write-Host $env:PAYFAST_PASSPHRASE",
  "Write-Output $env:PAYFAST_PASSPHRASE",
  "markPaidFromReturnUrl",
  "markPaidFromCancelUrl",
  "refundsAutoApproved = $true"
].forEach((token) => forbidToken(proofPath, proof, token));

const proofLines = proof.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#requires"));
addCheck(
  `powershell_parse_guard:${proofPath}:param_first`,
  proofLines[0]?.trim() === "[CmdletBinding()]" && proofLines[1]?.trim().startsWith("param("),
  proofLines.slice(0, 2).join(" | "),
  proofPath
);

const failedChecks = checks.filter((check) => !check.passed);
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis PayFast Provider Proof Queue Boundary",
  status: failedChecks.length === 0 ? "JARVIS_PAYFAST_PROVIDER_PROOF_QUEUE_BOUNDARY_VALIDATED" : "JARVIS_PAYFAST_PROVIDER_PROOF_QUEUE_BOUNDARY_FAILED",
  passed: failedChecks.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  providerCredentialsPrinted: false,
  directProviderCallsFromWeb: false,
  acceptedItnRequiredForPaidStatus: true,
  returnUrlMayMarkPaid: false,
  cancelUrlMayMarkPaid: false,
  refundsAutoApproved: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: failedChecks.length === 0
    ? "Run web build, then run the PayFast provider proof queue route and proof when credentials/runtime are available."
    : "Repair Jarvis PayFast provider proof queue boundary source files."
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
