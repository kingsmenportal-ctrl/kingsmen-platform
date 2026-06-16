import type { FounderReport, FounderReportSection, FounderReportType, HealthStatus, IncidentEvent, SystemHealthSnapshot } from "./observability-types";

function ref(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function section(name: string, order: number, status: FounderReportSection["sectionStatus"], summary: string, details: Record<string, unknown>, evidenceRefs: string[]): FounderReportSection {
  return {
    sectionRef: ref("section"),
    sectionName: name,
    sectionOrder: order,
    sectionStatus: status,
    summary,
    details,
    evidenceRefs
  };
}

export function buildFounderReport(input: {
  reportType: FounderReportType;
  health: SystemHealthSnapshot;
  incidents: IncidentEvent[];
  evidenceRefs: string[];
}): FounderReport {
  const urgentIncidents = input.incidents.filter((incident) => incident.severity === "SEV1" || incident.severity === "SEV2");
  const systemStatus: HealthStatus = input.health.status;
  const keyRisks = [
    ...(urgentIncidents.length ? [`${urgentIncidents.length} urgent incident(s) open`] : []),
    ...(input.health.oracleLitePressure === "HIGH" || input.health.oracleLitePressure === "CRITICAL" ? [`Oracle Lite pressure is ${input.health.oracleLitePressure}`] : []),
    ...(input.health.failedWorkflows > 0 ? [`${input.health.failedWorkflows} failed workflow(s)`] : [])
  ];

  const keyActions = [
    ...(urgentIncidents.length ? ["Acknowledge urgent incidents and follow fix path"] : []),
    ...(input.health.failedWorkflows > 0 ? ["Review workflow failures and retry/manual fallback where safe"] : []),
    ...(input.health.documentBacklog > 0 ? ["Drain document backlog before execution pressure rises"] : [])
  ];

  const healthDetails: Record<string, unknown> = { ...input.health };

  return {
    reportRef: ref("report"),
    reportType: input.reportType,
    reportStatus: "READY",
    title: `Kingsmen ${input.reportType.replaceAll("_", " ")} Report`,
    executiveSummary: input.health.summary,
    systemStatus,
    keyRisks,
    keyActions,
    evidenceRefs: input.evidenceRefs,
    sections: [
      section("System Health", 1, systemStatus === "GREEN" ? "NORMAL" : systemStatus === "AMBER" ? "WATCH" : "URGENT", input.health.summary, healthDetails, input.health.evidenceRefs),
      section("Incidents", 2, urgentIncidents.length ? "URGENT" : input.incidents.length ? "WATCH" : "NORMAL", `${input.incidents.length} open incident(s).`, { incidents: input.incidents }, input.evidenceRefs),
      section("Capacity", 3, input.health.oracleLitePressure === "LOW" ? "NORMAL" : "RISK", `Oracle Lite pressure: ${input.health.oracleLitePressure}.`, { activeCandidates: input.health.activeCandidates, cap: input.health.activeCandidateCap }, input.evidenceRefs)
    ]
  };
}

export function redactCandidateSensitiveDetails<T extends Record<string, unknown>>(input: T): T {
  const clone: Record<string, unknown> = { ...input };
  for (const key of Object.keys(clone)) {
    if (["idNumber", "phone", "email", "address", "bankAccount", "documentUrl"].includes(key)) {
      clone[key] = "[REDACTED]";
    }
  }
  return clone as T;
}
