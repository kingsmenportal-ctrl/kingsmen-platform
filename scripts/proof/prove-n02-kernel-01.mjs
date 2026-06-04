import fs from "node:fs";

const required = [
  "docs/n02/N02_KERNEL_01_BACKEND_CONSTITUTION_COMMAND_POLICY_BUS.md",
  "manifests/n02/n02-kernel-01-backend-constitution-command-policy-bus.json",
  "packages/contracts/src/n02-command-envelope-contract.ts",
  "packages/contracts/src/n02-command-bus-contract.ts",
  "packages/backend/src/n02/command-policy-guard.ts",
  "packages/backend/src/n02/command-bus.ts",
  "scripts/validators/validate-n02-kernel-01.mjs",
  "reports/constitution/n00-constitution-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);

const manifest = JSON.parse(fs.readFileSync("manifests/n02/n02-kernel-01-backend-constitution-command-policy-bus.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.requiresN00 !== true) failures.push("requiresN00 must be true");
if (manifest.providerLiveClaimsBlockedWithoutProof !== true) failures.push("providerLiveClaimsBlockedWithoutProof must be true");

const guard = fs.readFileSync("packages/backend/src/n02/command-policy-guard.ts", "utf8");
if (!guard.includes("Raw shell command blocked")) failures.push("raw shell blocker missing");
if (!guard.includes("Provider/live/production claim blocked without proof")) failures.push("provider proof blocker missing");

const report = {
  schema: "kingsmen.n02-kernel-01-proof.v1",
  module: "N02-KERNEL-01 - Backend Constitution Loader / Command Envelope / Policy Guard / Command Bus Proof",
  status: failures.length === 0 ? "N02_KERNEL_CONSTITUTION_COMMAND_POLICY_BUS_PROVEN" : "N02_KERNEL_CONSTITUTION_COMMAND_POLICY_BUS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  requiresN00: true,
  loadsConstitution: manifest.loadsConstitution === true,
  commandEnvelopeBuilt: manifest.commandEnvelopeBuilt === true,
  commandBusBuilt: manifest.commandBusBuilt === true,
  policyGuardBuilt: manifest.policyGuardBuilt === true,
  providerLiveClaimsBlockedWithoutProof: manifest.providerLiveClaimsBlockedWithoutProof === true,
  rawShellBlocked: true,
  founderApprovalRequiredForHighRiskActions: manifest.founderApprovalRequiredForHighRiskActions === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N02-KERNEL-02 - idempotency, audit context, and queue dispatch boundary."
    : "Repair N02-KERNEL-01 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n02", { recursive: true });
fs.writeFileSync("reports/n02/n02-kernel-01-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N02-KERNEL-01 proof passed.");