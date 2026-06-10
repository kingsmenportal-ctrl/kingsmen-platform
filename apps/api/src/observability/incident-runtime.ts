import type { IncidentEvent, IncidentSeverity } from "./observability-types";

function ref(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createIncident(input: {
  title: string;
  severity: IncidentSeverity;
  incidentDomain: IncidentEvent["incidentDomain"];
  cause: string;
  reason: string;
  fixPath: string;
  evidenceRefs: string[];
}): IncidentEvent {
  if (!input.title.trim()) throw new Error("INCIDENT_TITLE_REQUIRED");
  if (!input.cause.trim()) throw new Error("INCIDENT_CAUSE_REQUIRED");
  if (!input.reason.trim()) throw new Error("INCIDENT_REASON_REQUIRED");
  if (!input.fixPath.trim()) throw new Error("INCIDENT_FIX_PATH_REQUIRED");
  if (input.evidenceRefs.length === 0) throw new Error("INCIDENT_EVIDENCE_REQUIRED");

  return {
    incidentRef: ref("inc"),
    title: input.title,
    severity: input.severity,
    status: "OPEN",
    incidentDomain: input.incidentDomain,
    cause: input.cause,
    reason: input.reason,
    fixPath: input.fixPath,
    evidenceRefs: input.evidenceRefs
  };
}

export function mayEscalateToWhatsApp(incident: IncidentEvent): boolean {
  return incident.severity === "SEV1" || incident.severity === "SEV2";
}

export function assertIncidentCanClose(incident: IncidentEvent): void {
  if (!incident.cause || !incident.reason || !incident.fixPath) {
    throw new Error("INCIDENT_CLOSE_BLOCKED_CAUSE_REASON_FIX_PATH_REQUIRED");
  }
  if (incident.evidenceRefs.length === 0) {
    throw new Error("INCIDENT_CLOSE_BLOCKED_EVIDENCE_REQUIRED");
  }
}