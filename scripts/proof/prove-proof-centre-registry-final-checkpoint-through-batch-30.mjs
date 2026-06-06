#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const registryPath = "reports/control-plane/proof-centre-registry.json";
const pagePath = "apps/web/src/app/founder/proof-centre/page.tsx";
const proofPath = "reports/control-plane/proof-centre-registry-final-checkpoint-through-batch-30-proof.json";

const expectedEntries = [
  "BATCH 21",
  "BATCH 22",
  "BATCH 23",
  "BATCH 24",
  "BATCH 25",
  "BATCH 26B",
  "BATCH 27",
  "BATCH 28",
  "BATCH 29",
  "BATCH 30"
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

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeText(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), value, "utf8");
}

function writeJson(rel, value) {
  writeText(rel, `${JSON.stringify(value, null, 2)}\n`);
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function walkJsonFiles(dirRel) {
  const start = full(dirRel);
  if (!fs.existsSync(start)) return [];

  const out = [];

  function walk(abs) {
    for (const item of fs.readdirSync(abs, { withFileTypes: true })) {
      const itemAbs = path.join(abs, item.name);
      const rel = path.relative(root, itemAbs).replaceAll("\\", "/");

      if (item.isDirectory()) {
        if (["node_modules", ".git", ".next"].includes(item.name)) continue;
        walk(itemAbs);
        continue;
      }

      if (item.isFile() && item.name.endsWith(".json")) {
        out.push(rel);
      }
    }
  }

  walk(start);
  return out;
}

function jsonLooksPassed(value) {
  if (!value || typeof value !== "object") return false;
  if (value.passed === true) return true;
  if (typeof value.status === "string" && (
    value.status === "VALIDATED" ||
    value.status.includes("PROVEN") ||
    value.status.includes("READY") ||
    value.status.includes("HARDENED") ||
    value.status.includes("REACHABLE")
  )) return true;
  return false;
}

function safeReadJson(rel) {
  try {
    return readJson(rel);
  } catch {
    return null;
  }
}

check(`required-file:${registryPath}`, exists(registryPath), registryPath);
check(`required-file:${pagePath}`, exists(pagePath), pagePath);
check("batch29-registry-refresh-proof-exists", exists("reports/control-plane/proof-centre-registry-refresh-proof.json"), "BATCH 29 proof");
check("batch29-registry-refresh-validation-exists", exists("reports/validation/proof-centre-registry-refresh-latest.json"), "BATCH 29 validation");

const registryRaw = exists(registryPath) ? readText(registryPath) : "";
const pageRaw = exists(pagePath) ? readText(pagePath) : "";

let registryJson = null;
try {
  registryJson = registryRaw ? JSON.parse(registryRaw) : null;
} catch {
  registryJson = null;
}

const entriesPresentInRegistry = expectedEntries.map((title) => ({
  title,
  present: registryRaw.includes(title)
}));

const entriesPresentInPage = expectedEntries.map((title) => ({
  title,
  present: pageRaw.includes(title)
}));

for (const item of entriesPresentInRegistry) {
  check(`registry-includes:${item.title}`, item.present, item.title);
}

for (const item of entriesPresentInPage) {
  check(`page-includes:${item.title}`, item.present, item.title);
}

const registryEntryCount =
  typeof registryJson?.entryCount === "number"
    ? registryJson.entryCount
    : Array.isArray(registryJson)
      ? registryJson.length
      : Array.isArray(registryJson?.entries)
        ? registryJson.entries.length
        : entriesPresentInRegistry.filter((item) => item.present).length;

check("registry-entry-count-is-10", registryEntryCount === 10, `entryCount=${registryEntryCount}`);
check("expected-entry-count-is-10", expectedEntries.length === 10, `expected=${expectedEntries.length}`);

const reportFiles = walkJsonFiles("reports");

const proofEvidence = expectedEntries.map((title) => {
  const matching = reportFiles.filter((rel) => {
    const txt = readText(rel);
    return txt.includes(title);
  });

  const passed = matching.some((rel) => jsonLooksPassed(safeReadJson(rel)));

  return {
    title,
    matchingReports: matching,
    passed
  };
});

for (const item of proofEvidence) {
  check(`proof-report-exists:${item.title}`, item.matchingReports.length > 0, item.matchingReports.join(", ") || "none");
  check(`proof-report-passed:${item.title}`, item.passed, item.matchingReports.join(", ") || "none");
}

const batch29Proof = exists("reports/control-plane/proof-centre-registry-refresh-proof.json")
  ? readJson("reports/control-plane/proof-centre-registry-refresh-proof.json")
  : null;

const batch29Validation = exists("reports/validation/proof-centre-registry-refresh-latest.json")
  ? readJson("reports/validation/proof-centre-registry-refresh-latest.json")
  : null;

check(
  "batch29-proof-passed",
  batch29Proof?.status === "PROOF_CENTRE_REGISTRY_REFRESH_PROVEN" && batch29Proof?.passed === true,
  batch29Proof?.status ?? "missing"
);

check(
  "batch29-validation-passed",
  batch29Validation?.status === "VALIDATED" && batch29Validation?.passed === true,
  batch29Validation?.status ?? "missing"
);

check("registry-no-production-claim", !registryRaw.includes('"productionReady": true') && !registryRaw.includes('"canClaimProduction": true'), "production false");
check("registry-no-oracle-claim", !registryRaw.includes('"deployedToOracle": true'), "oracle false");
check("page-no-production-claim", !pageRaw.includes("productionReady: true") && !pageRaw.includes("production ready"), "page production false");
check("page-no-oracle-claim", !pageRaw.includes("deployedToOracle: true") && !pageRaw.includes("Oracle deployed"), "page oracle false");

const forbiddenPatterns = [
  "service_role",
  "PAYFAST_PASSPHRASE",
  "PRIVATE KEY",
  ".env",
  ".oci",
  ".ssh"
];

for (const pattern of forbiddenPatterns) {
  check(`registry-no-forbidden:${pattern}`, !registryRaw.includes(pattern), pattern);
  check(`page-no-forbidden:${pattern}`, !pageRaw.includes(pattern), pattern);
}

const allEntriesPresentInRegistry = entriesPresentInRegistry.every((item) => item.present);
const allEntriesPresentInPage = entriesPresentInPage.every((item) => item.present);
const allEntriesProven = proofEvidence.every((item) => item.passed);

check("all-entries-present-in-registry", allEntriesPresentInRegistry, "registry includes BATCH 21 through BATCH 30");
check("all-entries-present-in-page", allEntriesPresentInPage, "page includes BATCH 21 through BATCH 30");
check("all-entries-proven", allEntriesProven, "report proof exists and passed for every expected entry");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.proof-centre-registry-final-checkpoint-through-batch-30-proof.v1",
  module: "BATCH 31 - Proof Centre Registry Final Checkpoint Through BATCH 30",
  status: passed
    ? "PROOF_CENTRE_REGISTRY_FINAL_CHECKPOINT_THROUGH_BATCH_30_PROVEN"
    : "PROOF_CENTRE_REGISTRY_FINAL_CHECKPOINT_THROUGH_BATCH_30_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  expectedEntryCount: 10,
  entryCount: registryEntryCount,
  expectedEntries,
  allEntriesPresentInRegistry,
  allEntriesPresentInPage,
  allEntriesProven,
  registryPath,
  pagePath,
  proofEvidence,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 31."
    : "Repair Proof Centre registry checkpoint before moving forward."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
