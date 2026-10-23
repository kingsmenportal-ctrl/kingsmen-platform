#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { reconcileOperatingInventory } from "../lib/kingsmen-operating-evidence-reconciliation.mjs";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const inventoryPath = join(root, "reports/architecture/kingsmen-repository-operating-inventory-latest.json");
const outputPath = join(root, "reports/architecture/kingsmen-operating-evidence-reconciliation-latest.json");
if (!existsSync(inventoryPath)) {
  console.error(JSON.stringify({ status: "FAILED", reason: "inventory_report_missing", inventoryPath }, null, 2));
  process.exit(1);
}
let inventory;
try { inventory = JSON.parse(readFileSync(inventoryPath, "utf8")); }
catch { console.error(JSON.stringify({ status: "FAILED", reason: "inventory_report_invalid_json" }, null, 2)); process.exit(1); }
const result = reconcileOperatingInventory(inventory, {
  readReport: (path) => JSON.parse(readFileSync(join(root, path), "utf8"))
});
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({
  status: result.blockedGateCount === 0 ? "RECONCILED_ALL_GATES" : "RECONCILED_WITH_BLOCKERS",
  gateCount: result.gateCount,
  verifiedGateCount: result.verifiedGateCount,
  blockedGateCount: result.blockedGateCount,
  staleReportCount: result.gates.reduce((sum, gate) => sum + gate.evidence.filter((e) => e.blockers?.includes("stale_report")).length, 0),
  missingReportCount: result.gates.reduce((sum, gate) => sum + gate.evidence.filter((e) => e.blockers?.includes("missing_report")).length, 0),
  outputPath: "reports/architecture/kingsmen-operating-evidence-reconciliation-latest.json",
  publicLaunchStatus: result.publicLaunchStatus
}, null, 2));
