import type { IncidentEvent } from "./observability-types";

export interface SystemAlert {
  alertRef: string;
  alertType: "SYSTEM_HEALTH" | "CAPACITY" | "INCIDENT" | "WORKFLOW_FAILURE" | "PAYMENT" | "DOCUMENT" | "SOURCE_REVIEW" | "PRIVACY" | "SECURITY" | "REPORT_DELIVERY";
  severity: "INFO" | "WATCH" | "WARNING" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED";
  title: string;
  message: string;
  targetChannel: "EMAIL" | "PORTAL" | "WHATSAPP_URGENT" | "SMS_BACKUP" | "CONTROL_PLANE";
  escalationAllowed: boolean;
  evidenceRefs: string[];
}

export function createIncidentAlert(incident: IncidentEvent): SystemAlert {
  const urgent = incident.severity === "SEV1" || incident.severity === "SEV2";

  return {
    alertRef: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    alertType: "INCIDENT",
    severity: incident.severity === "SEV1" ? "CRITICAL" : incident.severity === "SEV2" ? "WARNING" : "WATCH",
    status: "OPEN",
    title: incident.title,
    message: `${incident.reason} Fix path: ${incident.fixPath}`,
    targetChannel: urgent ? "WHATSAPP_URGENT" : "EMAIL",
    escalationAllowed: urgent,
    evidenceRefs: incident.evidenceRefs
  };
}

export function assertWhatsAppUrgentOnly(alert: SystemAlert): void {
  if (alert.targetChannel === "WHATSAPP_URGENT" && !alert.escalationAllowed) {
    throw new Error("WHATSAPP_URGENT_ONLY_BOUNDARY");
  }
}