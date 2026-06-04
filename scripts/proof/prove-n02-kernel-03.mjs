import fs from "node:fs";

const required = [
  "docs/n02/N02_KERNEL_03_API_HEALTH_BACKEND_READINESS_POLICY_SMOKE.md",
  "manifests/n02/n02-kernel-03-api-health-backend-readiness-policy-smoke.json",
  "packages/backend/src/n02/kernel-health.ts",
  "packages/backend/src/n02/backend-readiness.ts",
  "packages/backend/src/n02/policy-smoke-test.ts",
  "apps/web/src/app/api/health/kingsmen-kernel/route.ts",
  "apps/web/src/app/api/founder/backend-readiness/route.ts",
  "scripts/validators/validate-n02-kernel-03.mjs",
  "reports/n02/n02-kernel-01-proof-latest.json",
  "reports/n02/n02-kernel-02-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);

const manifest = JSON.parse(fs.readFileSync("manifests/n02/n02-kernel-03-api-health-backend-readiness-policy-smoke.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.liveClaimsBlockedWithoutProof !== true) failures.push("liveClaimsBlockedWithoutProof must be true");
if (manifest.rawShellBlocked !== true) failures.push("rawShellBlocked must be true");

const guard = fs.readFileSync("packages/backend/src/n02/command-policy-guard.ts", "utf8");
for (const phrase of ["enable_live_payments", "enable_live_email", "enable_official_submissions", "claim_production_ready", "run_raw_shell"]) {
  if (!guard.includes(phrase)) failures.push(`N02 policy smoke missing guard phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n02-kernel-03-proof.v1",
  module: "N02-KERNEL-03 - API Health / Backend Readiness / Policy Smoke Test",
  status: failures.length === 0 ? "N02_KERNEL_API_HEALTH_BACKEND_READINESS_POLICY_SMOKE_PROVEN" : "N02_KERNEL_API_HEALTH_BACKEND_READINESS_POLICY_SMOKE_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  apiHealthBuilt: manifest.apiHealthBuilt === true,
  backendReadinessBuilt: manifest.backendReadinessBuilt === true,
  policySmokeTestBuilt: manifest.policySmokeTestBuilt === true,
  publicHealthDoesNotLeakSecrets: manifest.publicHealthDoesNotLeakSecrets === true,
  liveClaimsBlockedWithoutProof: manifest.liveClaimsBlockedWithoutProof === true,
  rawShellBlocked: manifest.rawShellBlocked === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N03 - PostgreSQL Truth Vault reality check/build."
    : "Repair N02-KERNEL-03 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n02", { recursive: true });
fs.writeFileSync("reports/n02/n02-kernel-03-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N02-KERNEL-03 proof passed.");