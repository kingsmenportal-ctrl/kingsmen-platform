import fs from "node:fs";

const expected = [
  "package.json",
  "docker/oracle-lite/docker-compose.local.yml",
  "scripts/validators/validate-n01-readiness.mjs",
  "reports/validation/n01-readiness-report.json",
  "manifests/master-build-index.json",
  "reports/phases/n01-6-phase-runner-report.json"
];

const present = expected.filter((p) => fs.existsSync(p));
const missing = expected.filter((p) => !fs.existsSync(p));

const optionalSignals = [
  "Dockerfile",
  "apps/web/package.json",
  "apps/api/package.json",
  "packages/backend/package.json",
  "packages/contracts/package.json",
  "packages/db/package.json",
  "docker/oracle-lite/nginx.conf",
  "scripts/KINGSMEN_CREATOR.ps1",
  "reports/creator/test-kingsmen-creator-report.json"
];

const optionalPresent = optionalSignals.filter((p) => fs.existsSync(p));
const optionalMissing = optionalSignals.filter((p) => !fs.existsSync(p));

const passed = missing.length === 0;

const report = {
  schema: "kingsmen.n01-runtime-foundation-reality.v1",
  module: "N01-VERIFY-01 - Monorepo / Oracle Lite Runtime Reality Check",
  passed,
  productionReady: false,
  n01CorePresent: passed,
  present,
  missing,
  optionalPresent,
  optionalMissing,
  nextAction: passed
    ? "N01 has enough proof signals to proceed to N02 reality check/build."
    : "Repair missing N01 runtime foundation files before N02.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n01", { recursive: true });
fs.writeFileSync("reports/n01/n01-runtime-foundation-reality-latest.json", JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);