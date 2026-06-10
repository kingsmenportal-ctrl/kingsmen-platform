import type { ApplicationWorkbenchItem } from "./route-types";
import { evaluateRouteReadiness, type RouteReadinessInput } from "./route-readiness";

export interface BuildWorkbenchInput {
  applicationId: string;
  candidateId: string;
  programmeKey?: string;
  priorityScore?: number;
  readiness: RouteReadinessInput;
}

export function buildApplicationWorkbenchItem(input: BuildWorkbenchInput): ApplicationWorkbenchItem {
  const readiness = evaluateRouteReadiness(input.readiness);
  const workbenchStatus =
    readiness.status === "READY"
      ? "READY"
      : readiness.status === "MANUAL_REQUIRED"
        ? "MANUAL_REQUIRED"
        : "NOT_READY";

  return {
    applicationId: input.applicationId,
    candidateId: input.candidateId,
    programmeKey: input.programmeKey,
    workbenchRef: `wrk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    workbenchStatus,
    routeReadinessStatus: readiness.status,
    documentReadinessStatus: input.readiness.documentReadinessStatus,
    sourceConfidenceBand: input.readiness.sourceConfidenceBand,
    portalHealthStatus: input.readiness.portalHealthStatus,
    mapFallbackRequired: readiness.mapFallbackRequired,
    priorityScore: input.priorityScore ?? 0,
    nextAction: readiness.nextActions[0] ?? "REVIEW_ROUTE"
  };
}