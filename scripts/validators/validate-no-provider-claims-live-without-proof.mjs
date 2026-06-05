#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const files = [
  "manifests/master/kingsmen-master-layer-index.json",
  "manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json"
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

for (const file of files) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`Missing ${file}`);
  }
}

if (failures.length === 0) {
  const master = readJson(files[0]);
  const providers = readJson(files[1]);

  const blockedClaimFields = [
    "productionReady",
    "deployedToOracle",
    "publicHttpsReady",
    "paymentsLive",
    "emailRuntimeLive",
    "officialSubmissionsLive",
    "candidateOwnDataProof",
    "partnerConsentSharing",
    "oraclePaidResourcesEnabled"
  ];

  for (const field of blockedClaimFields) {
    if (master[field] === true) failures.push(`Master manifest illegally claims ${field}=true without proof.`);
  }

  if (providers.productionReady === true) failures.push("Provider manifest illegally claims productionReady=true.");

  for (const provider of providers.providers ?? []) {
    if (provider.productionSafe === true) failures.push(`Provider ${provider.id} illegally claims productionSafe=true.`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "MASTER-INDEX-01 - No Provider Claims Live Without Proof",
  status: passed ? "VALIDATED" : "PRODUCTION_CLAIM_BLOCKED",
  passed,
  productionReady: false,
  failed_checks: failures,
  generated_at: new Date().toISOString(),
  next_action: passed ? "MASTER-INDEX-01 may be committed as non-production index authority." : "Remove false production claims."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(path.join(root, "reports/validation/no-provider-claims-live-without-proof-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
