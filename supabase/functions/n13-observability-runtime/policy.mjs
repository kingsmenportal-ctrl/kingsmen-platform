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
