import type { HealthStatus, PressureLevel, ServiceHealthCheck, SystemHealthSnapshot } from "./observability-types";

function ref(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function worstPressure(levels: PressureLevel[]): PressureLevel {
  if (levels.includes("CRITICAL")) return "CRITICAL";
  if (levels.includes("HIGH")) return "HIGH";
  if (levels.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

export function deriveHealthStatus(input: {
  openSev1Count: number;
  openSev2Count: number;
  openIncidentCount?: number;
  failedWorkflows: number;
  capacityPressure: PressureLevel;
  downServices: number;
  degradedServices: number;
}): HealthStatus {
  if (input.openSev1Count > 0 || input.capacityPressure === "CRITICAL" || input.downServices > 0) return "RED";
  if ((input.openIncidentCount ?? 0) > 0 || input.openSev2Count > 0 || input.failedWorkflows > 0 || input.capacityPressure === "HIGH" || input.capacityPressure === "MEDIUM" || input.degradedServices > 0) return "AMBER";
  return "GREEN";
}

export function buildSystemHealthSnapshot(input: {
  activeCandidates: number;
  activeCandidateCap?: number;
  pendingWorkflows: number;
  failedWorkflows: number;
  documentBacklog: number;
  manualFallbackBacklog: number;
  paymentPendingCount: number;
  sourceReviewBacklog: number;
  incidentOpenCount: number;
  openSev1Count: number;
  openSev2Count: number;
  serviceChecks: ServiceHealthCheck[];
  pressureSignals: PressureLevel[];
  evidenceRefs: string[];
}): SystemHealthSnapshot {
  const pressure = worstPressure(input.pressureSignals.length ? input.pressureSignals : ["LOW"]);
  const downServices = input.serviceChecks.filter((check) => check.status === "DOWN" || check.status === "BLOCKED").length;
  const degradedServices = input.serviceChecks.filter((check) => check.status === "DEGRADED").length;
  const status = deriveHealthStatus({
    openSev1Count: input.openSev1Count,
    openSev2Count: input.openSev2Count,
    openIncidentCount: input.incidentOpenCount,
    failedWorkflows: input.failedWorkflows,
    capacityPressure: pressure,
    downServices,
    degradedServices
  });

  const snapshot: SystemHealthSnapshot = {
    snapshotRef: ref("health"),
    status,
    activeCandidates: input.activeCandidates,
    activeCandidateCap: input.activeCandidateCap ?? 500,
    pendingWorkflows: input.pendingWorkflows,
    failedWorkflows: input.failedWorkflows,
    documentBacklog: input.documentBacklog,
    manualFallbackBacklog: input.manualFallbackBacklog,
    paymentPendingCount: input.paymentPendingCount,
    sourceReviewBacklog: input.sourceReviewBacklog,
    incidentOpenCount: input.incidentOpenCount,
    oracleLitePressure: pressure,
    summary: `System is ${status}. Active candidates ${input.activeCandidates}/${input.activeCandidateCap ?? 500}; open incidents ${input.incidentOpenCount}.`,
    evidenceRefs: input.evidenceRefs
  };

  assertNoFalseGreen(snapshot);
  return snapshot;
}

export function assertNoFalseGreen(snapshot: SystemHealthSnapshot): void {
  if (snapshot.status === "GREEN") {
    if (snapshot.incidentOpenCount > 0 || snapshot.failedWorkflows > 0 || snapshot.oracleLitePressure !== "LOW") {
      throw new Error("NO_FALSE_GREEN_HEALTH_STATUS");
    }
  }
}
