import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const docPath = "docs/rebuild/KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md";
const manifestPath = "manifests/rebuild/kingsmen-simplified-status-v1.json";
const claudePath = "CLAUDE.md";
const readmePath = "README.md";
const packagePath = "package.json";

const doc = readFileSync(docPath, "utf8").replace(/^\uFEFF/, "");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const claude = readFileSync(claudePath, "utf8").replace(/^\uFEFF/, "");
const readme = readFileSync(readmePath, "utf8").replace(/^\uFEFF/, "");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(manifest.schema, "kingsmen.simplified-rebuild-status.v1");
assert.match(manifest.statusDate, /^\d{4}-\d{2}-\d{2}$/, "Status date must be ISO formatted.");
assert.equal(manifest.overallStatus, "REBUILD_IN_PROGRESS_PUBLIC_LAUNCH_BLOCKED");
assert.equal(manifest.releaseStatus === "blocked_until_required_gates_pass", manifest.releaseGates.fullyPassed < manifest.releaseGates.required, "Release status must reflect gate evidence.");
assert.equal(manifest.implementationBranch, "rebuild/kingsmen-one-foundation-2026-11-17");
assert.equal(manifest.modules.length, 21, "N00–N20 must all be registered.");
assert.deepEqual(manifest.modules.map((item) => item.id), Array.from({ length: 21 }, (_, index) => "N" + String(index).padStart(2, "0")));
assert.equal(manifest.releaseGates.required, 13);
assert.equal(manifest.releaseGates.items.length, manifest.releaseGates.required);
assert.ok(manifest.releaseGates.fullyPassed >= 0 && manifest.releaseGates.fullyPassed <= manifest.releaseGates.required);
assert.equal(manifest.releaseGates.fullyPassed, manifest.releaseGates.items.filter((gate) => gate.status === "passed").length, "Gate pass count must match explicit passed states.");
assert.ok(manifest.inventory.trackedSqlMigrationFiles > 0);
assert.ok(manifest.infrastructure.appliedMigrationRecords > 0);
assert.ok(manifest.infrastructure.activeEdgeFunctions >= 0);
assert.ok(manifest.infrastructure.publicTables > 0);
assert.ok(manifest.infrastructure.publicTablesWithRlsEnabled >= 0 && manifest.infrastructure.publicTablesWithRlsEnabled <= manifest.infrastructure.publicTables);
assert.ok(["ACTIVE_HEALTHY", "COMING_UP", "RESTORING", "INACTIVE"].includes(manifest.infrastructure.stagingStatus));
assert.equal(typeof manifest.infrastructure.productionDeployRepresentsCurrentRebuildBranch, "boolean");
assert.equal(manifest.timeline.phases.length, 8);
assert.equal(manifest.timeline.phases[0].status, "completed");
assert.ok(manifest.timeline.engineeringEffortDays.minimum <= manifest.timeline.engineeringEffortDays.maximum);

for (const heading of [
  "## 1. Executive status",
  "## 2. What Kingsmen is supposed to deliver",
  "## 4. What already exists in the repository",
  "## 5. Highest-priority blockers",
  "## 6. Timeline and completion definition",
  "## 8. Required status format for every Kingsmen work chat"
]) assert.ok(doc.includes(heading), "Missing mandatory status section: " + heading);

assert.match(doc, /13 required release gates/);
assert.match(doc, /130 (?:(?:staging|live) )?ledger records|130 (?:live )?migration records/, "Migration evidence count must be present with an accepted ledger/source description.");
assert.match(doc, /ACTIVE_HEALTHY/);
assert.match(doc, /SECURITY DEFINER/);
assert.match(doc, /3–6 calendar weeks/);
assert.match(claude, /KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP\.md/);
assert.match(claude, /every Kingsmen response must start/i);
assert.match(readme, /KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP\.md/);
assert.match(packageJson.scripts["kingsmen:status:validate"], /validate-kingsmen-simplified-status\.mjs/);

console.log("Kingsmen simplified status register contract passed: N00–N20 registered; all release gates are evidence-tracked; staging and security snapshot checked.");
