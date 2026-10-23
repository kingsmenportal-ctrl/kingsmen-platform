export const DEFAULT_MAX_AGE_DAYS = 7;
const timestampKeys = ["generatedAt", "capturedAt", "completedAt", "createdAt", "timestamp", "checkedAt", "testedAt", "observedAt"];
const statusKeys = ["status", "result", "outcome", "verificationStatus", "runtimeStatus"];
const passWords = new Set(["PASS", "PASSED", "SUCCESS", "SUCCEEDED", "OK", "READY", "COMPLETE", "COMPLETED", "VERIFIED"]);
const reviewKeys = ["reviewed", "founderReviewed", "reviewComplete", "reviewApproved", "reviewerApproved"];
const redactionKeys = ["redacted", "piiRedacted", "secretsRedacted", "redactionVerified"];

function firstBoolean(object, keys) {
  for (const key of keys) if (typeof object?.[key] === "boolean") return object[key];
  return null;
}
function findTimestamp(object) {
  for (const key of timestampKeys) {
    const value = object?.[key];
    if (typeof value === "string" && value.trim() && Number.isFinite(Date.parse(value))) {
      return { key, value, milliseconds: Date.parse(value) };
    }
  }
  return null;
}
function findStatus(object) {
  for (const key of statusKeys) {
    const value = object?.[key];
    if (typeof value === "string" && value.trim()) return { key, value, pass: passWords.has(value.trim().toUpperCase()) };
  }
  for (const key of ["passed", "pass", "success", "verified"]) {
    if (typeof object?.[key] === "boolean") return { key, value: object[key], pass: object[key] };
  }
  return null;
}

/**
 * Strictly assess one report artifact. File existence is never treated as proof.
 * A report is eligible only when it has a recognized pass status, a recent timestamp,
 * explicit review, and explicit redaction confirmation.
 */
export function assessReportArtifact({ path, exists, report = null, now = Date.now(), maxAgeDays = DEFAULT_MAX_AGE_DAYS }) {
  if (!path.startsWith("reports/")) return { path, kind: "source_reference", exists: Boolean(exists), eligibleAsRuntimeEvidence: false, blockers: ["not_a_runtime_report"] };
  if (!exists) return { path, kind: "runtime_report", exists: false, eligibleAsRuntimeEvidence: false, blockers: ["missing_report"] };
  if (!report || typeof report !== "object" || Array.isArray(report)) return { path, kind: "runtime_report", exists: true, eligibleAsRuntimeEvidence: false, blockers: ["invalid_or_unreadable_report"] };
  const blockers = [];
  const timestamp = findTimestamp(report);
  const ageMs = timestamp ? now - timestamp.milliseconds : null;
  const ageDays = ageMs === null ? null : Math.round((ageMs / 86400000) * 100) / 100;
  if (!timestamp) blockers.push("timestamp_missing");
  else if (ageMs < -5 * 60 * 1000) blockers.push("timestamp_in_future");
  else if (ageMs > maxAgeDays * 86400000) blockers.push("stale_report");
  const status = findStatus(report);
  if (!status) blockers.push("status_missing");
  else if (!status.pass) blockers.push("status_not_passing");
  const reviewed = firstBoolean(report, reviewKeys);
  if (reviewed !== true) blockers.push("review_not_confirmed");
  const redacted = firstBoolean(report, redactionKeys);
  if (redacted !== true) blockers.push("redaction_not_confirmed");
  return {
    path, kind: "runtime_report", exists: true, eligibleAsRuntimeEvidence: blockers.length === 0,
    timestamp: timestamp ? { field: timestamp.key, value: timestamp.value, ageDays } : null,
    status: status ? { field: status.key, value: status.value, pass: status.pass } : null,
    reviewed, redacted, blockers
  };
}

/** Reconcile a generated repository inventory against the actual contents of report artifacts. */
export function reconcileOperatingInventory(inventory, { readReport, now = Date.now(), maxAgeDays = DEFAULT_MAX_AGE_DAYS } = {}) {
  if (!inventory || typeof inventory !== "object" || !Array.isArray(inventory.launchGates)) {
    throw new Error("inventory launchGates missing or invalid");
  }
  if (typeof readReport !== "function") throw new Error("readReport callback is required");
  const gates = inventory.launchGates.map((gate) => {
    const evidence = (Array.isArray(gate.evidence) ? gate.evidence : []).map((item) => {
      let report = null;
      if (item.exists && item.path.startsWith("reports/")) {
        try { report = readReport(item.path); } catch { report = null; }
      }
      return assessReportArtifact({ path: item.path, exists: item.exists, report, now, maxAgeDays });
    });
    const reportEvidence = evidence.filter((item) => item.kind === "runtime_report");
    const blockers = [
      ...(gate.remainingConstraint ? ["declared_remaining_constraint"] : []),
      ...reportEvidence.flatMap((item) => item.blockers.map((reason) => `${item.path}:${reason}`)),
      ...(reportEvidence.length === 0 ? ["no_runtime_report_declared_for_gate"] : [])
    ];
    const runtimeEvidenceStatus = blockers.length === 0 && reportEvidence.every((item) => item.eligibleAsRuntimeEvidence)
      ? "VERIFIED"
      : "BLOCKED";
    return {
      key: gate.key, title: gate.title, declaredStatus: gate.declaredStatus,
      runtimeEvidenceStatus, declaredConstraint: gate.remainingConstraint ?? null,
      sourceReferenceCount: evidence.filter((item) => item.kind === "source_reference").length,
      runtimeReportCount: reportEvidence.length,
      eligibleRuntimeReportCount: reportEvidence.filter((item) => item.eligibleAsRuntimeEvidence).length,
      evidence, blockers
    };
  });
  const blocked = gates.filter((gate) => gate.runtimeEvidenceStatus !== "VERIFIED");
  return {
    schema: "kingsmen.operating-evidence-reconciliation.v1",
    generatedAt: new Date(now).toISOString(),
    freshnessPolicy: { maxAgeDays, requiredSignals: ["passing status", "timestamp within freshness window", "explicit review", "explicit redaction confirmation"] },
    sourceInventorySchema: inventory.schema ?? null,
    gateCount: gates.length,
    verifiedGateCount: gates.length - blocked.length,
    blockedGateCount: blocked.length,
    publicLaunchStatus: blocked.length === 0 ? "REQUIRES_CANONICAL_LAUNCH_GATE" : "BLOCKED",
    gates,
    integrity: { pass: true, note: "This reconciliation never opens the canonical launch gate. Missing, stale, unreviewed, unredacted, or non-passing reports remain blocked." }
  };
}
