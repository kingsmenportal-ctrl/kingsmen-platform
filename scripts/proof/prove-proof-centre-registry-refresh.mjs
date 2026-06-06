#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const pagePath = "apps/web/src/app/founder/proof-centre/page.tsx";
const registryPath = "reports/control-plane/proof-centre-registry.json";
const proofPath = "reports/control-plane/proof-centre-registry-refresh-proof.json";

const registryItems = [
  {
    id: "batch-21",
    batch: "BATCH 21",
    title: "BATCH 21",
    label: "Controlled Docker Oracle Lite Runtime",
    proofPath: "reports/runtime/docker-oracle-lite-controlled-runtime-proof.json",
    validationPath: "reports/validation/docker-oracle-lite-controlled-runtime-latest.json",
    expectedStatus: "DOCKER_LOCAL_RUNTIME_PROVEN"
  },
  {
    id: "batch-22",
    batch: "BATCH 22",
    title: "BATCH 22",
    label: "Runtime Health Hardening",
    proofPath: "reports/runtime/docker-oracle-lite-runtime-health-hardening-proof.json",
    validationPath: "reports/validation/docker-oracle-lite-runtime-health-hardening-latest.json",
    expectedStatus: "DOCKER_RUNTIME_HEALTH_HARDENED_LOCAL"
  },
  {
    id: "batch-23",
    batch: "BATCH 23",
    title: "BATCH 23",
    label: "Build Proof Centre Read Model",
    proofPath: "reports/runtime/build-proof-centre-proof.json",
    validationPath: "reports/validation/build-proof-centre-latest.json",
    expectedStatus: "BUILD_PROOF_CENTRE_READ_MODEL_PROVEN"
  },
  {
    id: "batch-24",
    batch: "BATCH 24",
    title: "BATCH 24",
    label: "Control Plane Proof Display Adapter",
    proofPath: "reports/control-plane/build-proof-centre-display-adapter-proof.json",
    validationPath: "reports/validation/control-plane-proof-display-adapter-latest.json",
    expectedStatus: "CONTROL_PLANE_PROOF_DISPLAY_ADAPTER_PROVEN"
  },
  {
    id: "batch-25",
    batch: "BATCH 25",
    title: "BATCH 25",
    label: "Founder Proof Centre Page Wiring",
    proofPath: "reports/control-plane/founder-proof-centre-page-wiring-proof.json",
    validationPath: "reports/validation/founder-proof-centre-page-wiring-latest.json",
    expectedStatus: "FOUNDER_PROOF_CENTRE_PAGE_WIRING_PROVEN"
  },
  {
    id: "batch-26b",
    batch: "BATCH 26B",
    title: "BATCH 26B",
    label: "Founder Proof Centre Runtime Reachability",
    proofPath: "reports/control-plane/founder-proof-centre-runtime-reachability-proof.json",
    validationPath: "reports/validation/founder-proof-centre-runtime-reachability-latest.json",
    expectedStatus: "FOUNDER_PROOF_CENTRE_RUNTIME_REACHABLE_LOCAL"
  },
  {
    id: "batch-27",
    batch: "BATCH 27",
    title: "BATCH 27",
    label: "Founder Control Plane Proof Centre Entry Link",
    proofPath: "reports/control-plane/founder-proof-centre-entry-link-proof.json",
    validationPath: "reports/validation/founder-proof-centre-entry-link-latest.json",
    expectedStatus: "FOUNDER_PROOF_CENTRE_ENTRY_LINK_PROVEN"
  },
  {
    id: "batch-28",
    batch: "BATCH 28",
    title: "BATCH 28",
    label: "Founder Control Plane Entry Link Runtime Proof",
    proofPath: "reports/control-plane/founder-control-plane-entry-link-runtime-proof.json",
    validationPath: "reports/validation/founder-control-plane-entry-link-runtime-latest.json",
    expectedStatus: "FOUNDER_CONTROL_PLANE_ENTRY_LINK_RUNTIME_PROVEN"
  }
];

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeJson(rel, value) {
  writeText(rel, `${JSON.stringify(value, null, 2)}\n`);
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function metricsFromProof(proof) {
  return {
    apiHealthStatus: proof?.apiHealthStatus ?? null,
    webStatus: proof?.webStatus ?? null,
    bridgeApiStatus: proof?.bridgeApiStatus ?? null,
    pageStatus: proof?.pageStatus ?? null,
    adapterStatus: proof?.adapterStatus ?? null,
    controlPlaneStatus: proof?.controlPlaneStatus ?? null,
    proofCentreStatus: proof?.proofCentreStatus ?? null,
    composeCyclesCompleted: proof?.composeCyclesCompleted ?? null,
    webBuildSucceeded: proof?.webBuildSucceeded ?? null,
    composeUpSucceeded: proof?.composeUpSucceeded ?? null,
    composeDownSucceeded: proof?.composeDownSucceeded ?? null,
    portsReleasedAfterDown: proof?.portsReleasedAfterDown ?? null
  };
}

check(`required-file:${pagePath}`, exists(pagePath), pagePath);

const proofs = new Map();
const validations = new Map();

for (const item of registryItems) {
  check(`proof-exists:${item.id}`, exists(item.proofPath), item.proofPath);
  check(`validation-exists:${item.id}`, exists(item.validationPath), item.validationPath);

  const proof = exists(item.proofPath) ? readJson(item.proofPath) : null;
  const validation = exists(item.validationPath) ? readJson(item.validationPath) : null;

  proofs.set(item.id, proof);
  validations.set(item.id, validation);

  check(`proof-status:${item.id}`, proof?.status === item.expectedStatus && proof?.passed === true, proof?.status ?? "missing");
  check(`validation-passed:${item.id}`, validation?.status === "VALIDATED" && validation?.passed === true, validation?.status ?? "missing");
  check(`proof-no-production:${item.id}`, proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
  check(`proof-no-oracle:${item.id}`, proof?.deployedToOracle === false, "oracle false");
  check(`proof-no-failed-checks:${item.id}`, Array.isArray(proof?.failed) ? proof.failed.length === 0 : true, `failed=${proof?.failed?.length ?? 0}`);
}

const entries = registryItems.map((item) => {
  const proof = proofs.get(item.id);
  const validation = validations.get(item.id);
  const proven =
    proof?.status === item.expectedStatus &&
    proof?.passed === true &&
    validation?.status === "VALIDATED" &&
    validation?.passed === true &&
    proof?.productionReady === false &&
    proof?.canClaimProduction === false &&
    proof?.deployedToOracle === false;

  return {
    id: item.id,
    batch: item.batch,
    title: item.title,
    label: item.label,
    status: proven ? "PROVEN" : "FAILED",
    proofStatus: proof?.status ?? "MISSING",
    validationStatus: validation?.status ?? "MISSING",
    proofPath: item.proofPath,
    validationPath: item.validationPath,
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    metrics: metricsFromProof(proof)
  };
});

const allEntriesProven = entries.length === 8 && entries.every((entry) => entry.status === "PROVEN");

check("registry-has-eight-entries", entries.length === 8, `entries=${entries.length}`);
check("registry-all-entries-proven", allEntriesProven, "all entries proven");
check("registry-no-production-claim", entries.every((entry) => entry.productionReady === false && entry.canClaimProduction === false), "production false");
check("registry-no-oracle-claim", entries.every((entry) => entry.deployedToOracle === false), "oracle false");

const registry = {
  schema: "kingsmen.proof-centre-registry.v1",
  module: "BATCH 29 - Proof Centre Registry Refresh",
  generated_at: new Date().toISOString(),
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  runtimeScope: "local_proof_registry_refresh_only",
  allEntriesProven,
  entryCount: entries.length,
  entries,
  pagePath
};

writeJson(registryPath, registry);

const cards = entries.map((entry) => ({
  id: entry.id,
  title: entry.title,
  label: entry.label,
  status: entry.status
}));

const proofCardsTs = `const proofCards = ${JSON.stringify(cards, null, 2)} as const;`;

let page = exists(pagePath) ? readText(pagePath) : "";
const replaced = /const proofCards = \[[\s\S]*?\];/.test(page);

if (replaced) {
  page = page.replace(/const proofCards = \[[\s\S]*?\];/, proofCardsTs);
} else if (/const proofCards = \[[\s\S]*?\] as const;/.test(page)) {
  page = page.replace(/const proofCards = \[[\s\S]*?\] as const;/, proofCardsTs);
} else {
  check("page-proofCards-block-found", false, "Could not find proofCards constant.");
}

writeText(pagePath, page);

page = exists(pagePath) ? readText(pagePath) : "";

for (const entry of entries) {
  check(`page-includes:${entry.batch}`, page.includes(entry.title) && page.includes(entry.label), `${entry.title} / ${entry.label}`);
}

check("page-still-has-founder-title", page.includes("Kingsmen Founder Control Plane"), "founder title");
check("page-still-has-build-proof-centre", page.includes("Build Proof Centre"), "Build Proof Centre");
check("page-still-has-local-warning", page.includes("Local founder proof page only"), "local warning");
check("page-no-production-claim", !page.includes("productionReady: true") && !page.includes("deployedToOracle: true"), "no production/oracle true");

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`page-no-forbidden:${pattern}`, !page.includes(pattern), pattern);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.proof-centre-registry-refresh-proof.v1",
  module: "BATCH 29 - Proof Centre Registry Refresh",
  status: passed
    ? "PROOF_CENTRE_REGISTRY_REFRESH_PROVEN"
    : "PROOF_CENTRE_REGISTRY_REFRESH_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  runtimeScope: "local_proof_registry_refresh_only",
  registryPath,
  pagePath,
  entryCount: entries.length,
  allEntriesProven,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 29."
    : "Repair Proof Centre registry refresh before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
