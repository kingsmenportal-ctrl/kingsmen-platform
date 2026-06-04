import fs from "node:fs";

const required = [
  "docs/master/KINGSMEN_MASTER_LAYER_INDEX.md",
  "docs/master/KINGSMEN_CONNECTED_APPS_TOOLS_PROVIDER_GATE.md",
  "docs/master/KINGSMEN_BUILD_ORDER_AND_PROOF_RULES.md",
  "manifests/master/kingsmen-master-layer-index.json",
  "packages/contracts/src/master-layer-index-contract.ts",
  "packages/backend/src/master/master-layer-index-service.ts",
  "apps/web/src/app/founder/master-index/page.tsx",
  "apps/web/src/components/kingsmen/founder/master/MasterLayerIndexTable.tsx"
];

const families = [
  "Foundation and Proof Discipline",
  "Candidate Core and Portal",
  "Document Payment Communication and Candidate Surfaces",
  "Route Workbench",
  "Founder Control",
  "External Surfaces",
  "Oracle Public Runtime",
  "Reality Security Backup Observability",
  "Launch Gates",
  "Growth Era After Proof"
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = JSON.parse(fs.readFileSync("manifests/master/kingsmen-master-layer-index.json", "utf8"));
if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.oracleLiteDefault !== true) failures.push("oracleLiteDefault must be true");
for (const family of families) {
  if (!manifest.layerFamilies?.includes(family)) failures.push(`Missing layer family: ${family}`);
}

const report = {
  schema: "kingsmen.master-layer-index-validation.v1",
  module: "MASTER-INDEX-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/master-layer-index-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log("MASTER-INDEX-01 layer index validation passed.");