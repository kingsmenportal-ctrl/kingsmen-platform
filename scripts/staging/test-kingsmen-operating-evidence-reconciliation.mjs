#!/usr/bin/env node
import assert from "node:assert/strict";
import { assessReportArtifact, reconcileOperatingInventory } from "../lib/kingsmen-operating-evidence-reconciliation.mjs";

const now = Date.parse("2026-10-23T12:00:00.000Z");
const freshPass = { capturedAt: "2026-10-23T11:00:00.000Z", status: "PASS", reviewed: true, redacted: true };
const fresh = assessReportArtifact({ path: "reports/staging/example.json", exists: true, report: freshPass, now });
assert.equal(fresh.eligibleAsRuntimeEvidence, true);
assert.deepEqual(fresh.blockers, []);

const missing = assessReportArtifact({ path: "reports/staging/missing.json", exists: false, now });
assert.deepEqual(missing.blockers, ["missing_report"]);

const stale = assessReportArtifact({
  path: "reports/staging/stale.json", exists: true,
  report: { ...freshPass, capturedAt: "2026-10-01T00:00:00.000Z" }, now
});
assert.equal(stale.eligibleAsRuntimeEvidence, false);
assert.ok(stale.blockers.includes("stale_report"));

const unreviewed = assessReportArtifact({
  path: "reports/staging/unreviewed.json", exists: true,
  report: { ...freshPass, reviewed: false }, now
});
assert.ok(unreviewed.blockers.includes("review_not_confirmed"));

const unredacted = assessReportArtifact({
  path: "reports/staging/unredacted.json", exists: true,
  report: { ...freshPass, redacted: false }, now
});
assert.ok(unredacted.blockers.includes("redaction_not_confirmed"));

const source = assessReportArtifact({ path: "scripts/proof/example.mjs", exists: true, now });
assert.equal(source.eligibleAsRuntimeEvidence, false);
assert.ok(source.blockers.includes("not_a_runtime_report"));

const inventory = {
  schema: "test",
  launchGates: [{
    key: "test_gate", title: "Test gate", declaredStatus: "foundation_built",
    remainingConstraint: null,
    evidence: [
      { path: "docs/test.md", exists: true },
      { path: "reports/staging/example.json", exists: true }
    ]
  }]
};
const reconciled = reconcileOperatingInventory(inventory, {
  now, readReport: () => freshPass
});
assert.equal(reconciled.gateCount, 1);
assert.equal(reconciled.verifiedGateCount, 1);
assert.equal(reconciled.blockedGateCount, 0);
assert.equal(reconciled.publicLaunchStatus, "REQUIRES_CANONICAL_LAUNCH_GATE");

const blocked = reconcileOperatingInventory({
  launchGates: [{
    key: "blocked_gate", title: "Blocked", declaredStatus: "pending",
    remainingConstraint: "live proof pending",
    evidence: [{ path: "reports/staging/missing.json", exists: false }]
  }]
}, { now, readReport: () => null });
assert.equal(blocked.blockedGateCount, 1);
assert.equal(blocked.gates[0].runtimeEvidenceStatus, "BLOCKED");
console.log("Kingsmen operating evidence reconciliation tests passed (8 cases).");
