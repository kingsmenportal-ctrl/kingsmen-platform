import fs from "node:fs";

const required = [
  "manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json",
  "packages/contracts/src/provider-gate-contract.ts",
  "packages/backend/src/providers/provider-gate-policy.ts",
  "apps/web/src/app/founder/providers/page.tsx",
  "apps/web/src/components/kingsmen/founder/providers/ProviderGateMatrix.tsx"
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = JSON.parse(fs.readFileSync("manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json", "utf8"));
if (manifest.providerCount !== 25) failures.push("providerCount must equal 25");
if (!Array.isArray(manifest.providers) || manifest.providers.length !== 25) failures.push("providers array must contain 25 items");
for (const p of manifest.providers || []) {
  for (const key of ["code", "name", "role", "boundary", "status"]) {
    if (!p[key]) failures.push(`Provider ${p.code || p.name || "unknown"} missing ${key}`);
  }
}

const report = {
  schema: "kingsmen.provider-gates-validation.v1",
  module: "MASTER-INDEX-01",
  passed: failures.length === 0,
  providerCount: manifest.providers?.length ?? 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/provider-gates-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log("25 provider gates validation passed.");