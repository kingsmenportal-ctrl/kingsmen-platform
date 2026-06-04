import fs from "node:fs";

const requiredFiles = [
  "docs/n02/N02_KERNEL_01_BACKEND_CONSTITUTION_COMMAND_POLICY_BUS.md",
  "manifests/n02/n02-kernel-01-backend-constitution-command-policy-bus.json",
  "packages/contracts/src/n02-command-envelope-contract.ts",
  "packages/contracts/src/n02-command-bus-contract.ts",
  "packages/backend/src/n02/command-policy-guard.ts",
  "packages/backend/src/n02/command-bus.ts",
  "manifests/constitution/n00-constitution-doctrine-lock.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n02/n02-kernel-01-backend-constitution-command-policy-bus.json")
  ? JSON.parse(fs.readFileSync("manifests/n02/n02-kernel-01-backend-constitution-command-policy-bus.json", "utf8"))
  : {};

for (const key of [
  "requiresN00",
  "loadsConstitution",
  "commandEnvelopeBuilt",
  "commandBusBuilt",
  "policyGuardBuilt",
  "providerLiveClaimsBlockedWithoutProof",
  "aiMaySuggestNotGovern",
  "founderApprovalRequiredForHighRiskActions"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const policy = fs.existsSync("packages/backend/src/n02/command-policy-guard.ts")
  ? fs.readFileSync("packages/backend/src/n02/command-policy-guard.ts", "utf8")
  : "";

for (const phrase of [
  "enable_live_payments",
  "enable_live_email",
  "enable_official_submissions",
  "claim_production_ready",
  "run_raw_shell",
  "providerProofPresent"
]) {
  if (!policy.includes(phrase)) failures.push(`Policy guard missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n02-kernel-01-validation.v1",
  module: "N02-KERNEL-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n02-kernel-01-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N02-KERNEL-01 validation passed.");