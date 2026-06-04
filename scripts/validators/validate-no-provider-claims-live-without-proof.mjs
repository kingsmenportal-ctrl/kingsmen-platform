import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json", "utf8"));
const claims = manifest.liveClaims || {};
const forbiddenTrueClaims = [
  "paymentsLive",
  "emailRuntimeLive",
  "officialSubmissionsLive",
  "deployedToOracle",
  "publicHttpsReady",
  "productionReady"
];

const failures = [];
for (const claim of forbiddenTrueClaims) {
  if (claims[claim] === true) failures.push(`${claim} cannot be true in MASTER-INDEX-01 without matching provider proof gate`);
}

const report = {
  schema: "kingsmen.no-provider-live-claims-validation.v1",
  module: "MASTER-INDEX-01",
  passed: failures.length === 0,
  noProviderClaimsLiveWithoutProof: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/no-provider-claims-live-without-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log("No provider live claims without proof validation passed.");