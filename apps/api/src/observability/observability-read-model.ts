import type { FounderReport, IncidentEvent, ServiceHealthCheck, SystemHealthSnapshot } from "./observability-types";

export interface ObservabilityReadModel {
  title: string;
  healthStatus: string;
  openIncidents: number;
  urgentIncidents: number;
  degradedServices: number;
  latestReportTitle?: string;
  founderSummary: string;
}

export function buildObservabilityReadModel(input: {
  health: SystemHealthSnapshot;
  incidents: IncidentEvent[];
  serviceChecks: ServiceHealthCheck[];
  reports: FounderReport[];
}): ObservabilityReadModel {
  const latestReport = input.reports[0];
  const urgentIncidents = input.incidents.filter((incident) => incident.severity === "SEV1" || incident.severity === "SEV2").length;
  const degradedServices = input.serviceChecks.filter((check) => ["DEGRADED", "DOWN", "BLOCKED"].includes(check.status)).length;

  return {
    title: "Kingsmen Observability / Reports / Incident Runtime",
    healthStatus: input.health.status,
    openIncidents: input.incidents.length,
    urgentIncidents,
    degradedServices,
    latestReportTitle: latestReport?.title,
    founderSummary: input.health.summary
  };
}