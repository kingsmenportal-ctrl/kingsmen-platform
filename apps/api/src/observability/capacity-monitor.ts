import type { OracleLiteCapacitySnapshot, PressureLevel } from "./observability-types";

function ref(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function pressure(usedRatio: number): PressureLevel {
  if (usedRatio >= 0.95) return "CRITICAL";
  if (usedRatio >= 0.85) return "HIGH";
  if (usedRatio >= 0.70) return "MEDIUM";
  return "LOW";
}

export function buildOracleLiteCapacitySnapshot(input: {
  activeCandidates: number;
  activeCandidateCap?: number;
  cpuUsedRatio: number;
  memoryUsedRatio: number;
  storageUsedRatio: number;
  dbUsedRatio: number;
  queueUsedRatio: number;
  evidenceRefs: string[];
}): OracleLiteCapacitySnapshot {
  const activeCandidateCap = input.activeCandidateCap ?? 500;
  const candidateRatio = activeCandidateCap === 0 ? 1 : input.activeCandidates / activeCandidateCap;
  const queuePressure = pressure(Math.max(input.queueUsedRatio, candidateRatio));
  const highest = [pressure(input.cpuUsedRatio), pressure(input.memoryUsedRatio), pressure(input.storageUsedRatio), pressure(input.dbUsedRatio), queuePressure];

  const recommendation = highest.includes("CRITICAL")
    ? "Freeze growth, drain queues, and review incidents before accepting more active candidates."
    : highest.includes("HIGH")
      ? "Keep cap steady, reduce workflow concurrency, and review bottlenecks."
      : "Capacity is inside Oracle Lite operating discipline.";

  return {
    capacityRef: ref("cap"),
    ocpuLimit: 4,
    memoryGbLimit: 24,
    activeCandidateCap,
    activeCandidates: input.activeCandidates,
    cpuPressure: pressure(input.cpuUsedRatio),
    memoryPressure: pressure(input.memoryUsedRatio),
    storagePressure: pressure(input.storageUsedRatio),
    dbPressure: pressure(input.dbUsedRatio),
    queuePressure,
    recommendation,
    evidenceRefs: input.evidenceRefs
  };
}

export function assertCapNotExceeded(snapshot: OracleLiteCapacitySnapshot): void {
  if (snapshot.activeCandidates > snapshot.activeCandidateCap) {
    throw new Error("ACTIVE_CANDIDATE_CAP_EXCEEDED");
  }
}