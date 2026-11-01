export function deriveN13RuntimeHealthStatus(input = {}) {
  const {
    dataComplete = false,
    dataErrors = 0,
    activeCandidates = 0,
    activeCandidateCap = 500,
    openSev1Count = 0,
    openSev2Count = 0,
    failedWorkflows = 0,
    pendingDocuments = 0,
    manualFallbackBacklog = 0,
    deadLetterCount = 0,
    openIncidents = 0,
    downServices = 0,
    externalServiceCoverageComplete = false
  } = input;

  if (!dataComplete || dataErrors > 0) return "UNKNOWN";

  if (
    openSev1Count > 0 ||
    activeCandidates > activeCandidateCap ||
    downServices > 0
  ) {
    return "RED";
  }

  // GREEN is only allowed when all required external service probes are present.
  // This workstream measures database and auth only, so its initial result is AMBER.
  if (
    !externalServiceCoverageComplete ||
    openSev2Count > 0 ||
    failedWorkflows > 0 ||
    pendingDocuments > 0 ||
    manualFallbackBacklog > 0 ||
    deadLetterCount > 0 ||
    openIncidents > 0
  ) {
    return "AMBER";
  }

  return "GREEN";
}


const SNAPSHOT_COUNT_FIELDS = [
  "active_candidates",
  "pending_workflows",
  "failed_workflows",
  "document_backlog",
  "manual_fallback_backlog",
  "payment_pending_count",
  "source_review_backlog",
  "incident_open_count"
];

/**
 * Founder read-model projection. The staging schema stores integer counters as
 * NOT NULL, so incomplete captures persist placeholder zeroes alongside UNKNOWN.
 * Never expose those placeholders as measured zeroes to the founder UI.
 */
export function projectN13FounderSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return null;
  const available = snapshot.status !== "UNKNOWN";
  const projected = {
    ...snapshot,
    metricCountsAvailable: available
  };
  if (!available) {
    for (const field of SNAPSHOT_COUNT_FIELDS) projected[field] = null;
  }
  return projected;
}
