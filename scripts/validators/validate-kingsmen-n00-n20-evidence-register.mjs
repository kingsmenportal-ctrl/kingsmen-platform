#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifests/architecture/kingsmen-n00-n20-evidence-register.json");
const architecturePath = path.join(root, "manifests/architecture/kingsmen-n00-n20-operating-inventory.json");
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

let manifest;
let architecture;
try { manifest = readJson(manifestPath); } catch (error) {
  console.error("N00_N20_EVIDENCE_REGISTER_INVALID: unable to read/parse evidence manifest", error.message);
  process.exit(1);
}
try { architecture = readJson(architecturePath); } catch (error) {
  console.error("N00_N20_EVIDENCE_REGISTER_INVALID: unable to read/parse architecture manifest", error.message);
  process.exit(1);
}

const allowed = new Set(manifest.evidence_statuses);
const expectedIds = Array.from({ length: 21 }, (_, i) => `N${String(i).padStart(2, "0")}`);
const actualIds = manifest.modules.map((m) => m.module_id);
check(manifest.id === "kingsmen-n00-n20-evidence-register", "unexpected manifest id");
check(manifest.productionReady === false, "productionReady must remain false");
check(manifest.modules.length === 21, "expected exactly 21 N00–N20 module records");
check(JSON.stringify(actualIds) === JSON.stringify(expectedIds), "module ids must be unique and ordered N00 through N20");
check(JSON.stringify(architecture.modules.map((m) => m.id)) === JSON.stringify(expectedIds), "architecture inventory IDs do not match N00–N20");

const required = [
  "module_id","name","responsibility","non_responsibilities","owner","dependencies","source_paths","api_routes",
  "tables_and_migrations","provider_adapters","commands_and_events","state_transitions","idempotency","policy_gates",
  "permissions","data_classification","audit_events","validators","unit_integration_e2e_tests","latest_verification",
  "environment","observability","reconciliation","known_blockers","next_safe_action","release_impact","evidence_links",
  "last_verified_at","evidence_status"
];
const pathFields = ["source_paths","validators"];
for (const [index, module] of manifest.modules.entries()) {
  for (const field of required) check(Object.hasOwn(module, field), `${module.module_id}: missing field ${field}`);
  check(allowed.has(module.evidence_status), `${module.module_id}: invalid evidence_status ${module.evidence_status}`);
  check(typeof module.next_safe_action === "string" && module.next_safe_action.trim().length > 0, `${module.module_id}: next_safe_action required`);
  check(module.last_verified_at === null || typeof module.last_verified_at === "string", `${module.module_id}: invalid last_verified_at`);
  check(module.latest_verification?.status === "not_run_in_this_batch" || module.latest_verification?.status === "validated", `${module.module_id}: missing verification status`);
  for (const field of pathFields) {
    for (const file of module[field] ?? []) {
      check(typeof file === "string" && !file.startsWith("/") && !file.includes(".."), `${module.module_id}: unsafe path ${file}`);
      if (typeof file === "string") check(fs.existsSync(path.join(root, file)), `${module.module_id}: declared source evidence path missing: ${file}`);
    }
  }
  check(!(module.evidence_status === "production_approved"), `${module.module_id}: this initial register cannot grant production approval`);
}
check(manifest.global_release_blockers.length > 0, "release blockers must be explicit");
check(manifest.modules.some((m) => m.module_id === "N05" && m.evidence_status === "blocked"), "N05 must remain blocked pending runtime/security proof");
check(manifest.modules.some((m) => m.module_id === "N20" && m.evidence_status === "blocked"), "N20 must remain blocked pending release evidence");

if (failures.length) {
  console.error("N00_N20_EVIDENCE_REGISTER_FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(JSON.stringify({
  result: "N00_N20_EVIDENCE_REGISTER_SOURCE_VALIDATED",
  modules: manifest.modules.length,
  statuses: manifest.modules.reduce((counts, module) => ({ ...counts, [module.evidence_status]: (counts[module.evidence_status] ?? 0) + 1 }), {}),
  productionReady: false,
  runtimeProofExecuted: false
}, null, 2));
