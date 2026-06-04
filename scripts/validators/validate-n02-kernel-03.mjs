import fs from "node:fs";

const requiredFiles = [
  "docs/n02/N02_KERNEL_03_API_HEALTH_BACKEND_READINESS_POLICY_SMOKE.md",
  "manifests/n02/n02-kernel-03-api-health-backend-readiness-policy-smoke.json",
  "packages/contracts/src/n02-health-contract.ts",
  "packages/contracts/src/n02-readiness-contract.ts",
  "packages/contracts/src/n02-policy-smoke-contract.ts",
  "packages/backend/src/n02/kernel-health.ts",
  "packages/backend/src/n02/backend-readiness.ts",
  "packages/backend/src/n02/policy-smoke-test.ts",
  "apps/web/src/app/api/health/kingsmen-kernel/route.ts",
  "apps/web/src/app/api/founder/backend-readiness/route.ts",
  "reports/n02/n02-kernel-01-proof-latest.json",
  "reports/n02/n02-kernel-02-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n02/n02-kernel-03-api-health-backend-readiness-policy-smoke.json")
  ? JSON.parse(fs.readFileSync("manifests/n02/n02-kernel-03-api-health-backend-readiness-policy-smoke.json", "utf8"))
  : {};

for (const key of [
  "requiresN02Kernel01",
  "requiresN02Kernel02",
  "apiHealthBuilt",
  "backendReadinessBuilt",
  "policySmokeTestBuilt",
  "publicHealthDoesNotLeakSecrets",
  "founderReadinessRequiresFounderSurface",
  "liveClaimsBlockedWithoutProof",
  "rawShellBlocked"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const publicHealth = fs.existsSync("apps/web/src/app/api/health/kingsmen-kernel/route.ts")
  ? fs.readFileSync("apps/web/src/app/api/health/kingsmen-kernel/route.ts", "utf8")
  : "";

if (!publicHealth.includes("secretsIncluded: false")) failures.push("public health route must mark secretsIncluded false");
if (!publicHealth.includes("productionReady: false")) failures.push("public health route must keep productionReady false");

const report = {
  schema: "kingsmen.n02-kernel-03-validation.v1",
  module: "N02-KERNEL-03",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n02-kernel-03-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N02-KERNEL-03 validation passed.");