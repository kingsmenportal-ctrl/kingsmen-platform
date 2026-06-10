import type { PortalHealthStatus, RouteAvailabilityStatus, RouteReadinessStatus, RouteVerificationStatus, SourceConfidenceBand } from "./route-types";

export interface RouteReadinessInput {
  sourceConfidenceBand: SourceConfidenceBand;
  routeStatus: RouteVerificationStatus;
  availabilityStatus: RouteAvailabilityStatus;
  portalHealthStatus: PortalHealthStatus;
  documentReadinessStatus: "MISSING" | "PARTIAL" | "READY" | "REVIEW_REQUIRED";
  privateProviderRequiresAccreditationCheck?: boolean;
}

export interface RouteReadinessDecision {
  status: RouteReadinessStatus;
  blockers: string[];
  warnings: string[];
  nextActions: string[];
  mapFallbackRequired: boolean;
}

export function evaluateRouteReadiness(input: RouteReadinessInput): RouteReadinessDecision {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const nextActions: string[] = [];
  let mapFallbackRequired = false;

  if (input.sourceConfidenceBand === "C" || input.sourceConfidenceBand === "D") {
    blockers.push("SOURCE_REVIEW_REQUIRED");
    nextActions.push("Verify source link, fee, deadline, and requirement before candidate-facing use.");
  }

  if (input.routeStatus !== "VERIFIED") {
    blockers.push(`ROUTE_${input.routeStatus}`);
    nextActions.push("Route requires manual verification before execution.");
  }

  if (input.availabilityStatus === "CLOSED") {
    blockers.push("ROUTE_CLOSED");
    nextActions.push("Find fallback route or waitlist alternative.");
  }

  if (input.availabilityStatus === "UNKNOWN" || input.availabilityStatus === "MANUAL_CHECK_REQUIRED") {
    warnings.push("Availability requires manual check.");
    nextActions.push("Check latest official route availability.");
  }

  if (input.documentReadinessStatus !== "READY") {
    blockers.push(`DOCUMENT_${input.documentReadinessStatus}`);
    nextActions.push("Resolve document readiness before execution.");
  }

  if (["OTP_REQUIRED", "CAPTCHA_BLOCKED", "DOWN", "MANUAL_ONLY"].includes(input.portalHealthStatus)) {
    mapFallbackRequired = true;
    blockers.push(`PORTAL_${input.portalHealthStatus}`);
    nextActions.push("Generate Manual Application Package fallback.");
  }

  if (input.privateProviderRequiresAccreditationCheck) {
    blockers.push("PRIVATE_PROVIDER_ACCREDITATION_CHECK_REQUIRED");
    nextActions.push("Verify private provider accreditation through official authority sources.");
  }

  if (mapFallbackRequired) {
    return { status: "MANUAL_REQUIRED", blockers, warnings, nextActions, mapFallbackRequired };
  }

  if (blockers.includes("SOURCE_REVIEW_REQUIRED")) {
    return { status: "SOURCE_REVIEW_REQUIRED", blockers, warnings, nextActions, mapFallbackRequired };
  }

  if (blockers.length > 0) {
    return { status: "NOT_READY", blockers, warnings, nextActions, mapFallbackRequired };
  }

  return {
    status: "READY",
    blockers,
    warnings,
    nextActions: nextActions.length > 0 ? nextActions : ["Ready for operator-approved execution."],
    mapFallbackRequired
  };
}