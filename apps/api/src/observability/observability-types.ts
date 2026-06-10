export type HealthStatus = "GREEN" | "AMBER" | "RED" | "UNKNOWN";
export type PressureLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ServiceStatus = "UP" | "DEGRADED" | "DOWN" | "BLOCKED" | "UNKNOWN";
export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "MITIGATING" | "RESOLVED" | "CLOSED" | "CANCELLED";

export type FounderReportType =
  | "MORNING_FOUNDER"
  | "MIDDAY_FOUNDER"
  | "EVENING_FOUNDER"
  | "INCIDENT"
  | "FINANCE"
  | "DOCUMENT_PIPELINE"
  | "MATCHING"
  | "DISPATCH"
  | "PLAYWRIGHT"
  | "MANUAL_FALLBACK"
  | "PORTAL_HEALTH"
  | "RISK"
  | "SYSTEM_HEALTH"
  | "BACKUP"
  | "CAPACITY"
  | "WEEKLY"
  | "MONTHLY";

export interface SystemHealthSnapshot {
  snapshotRef: string;
  status: HealthStatus;
  activeCandidates: number;
  activeCandidateCap: number;
  pendingWorkflows: number;
  failedWorkflows: number;
  documentBacklog: number;
  manualFallbackBacklog: number;
  paymentPendingCount: number;
  sourceReviewBacklog: number;
  incidentOpenCount: number;
  oracleLitePressure: PressureLevel;
  summary: string;
  evidenceRefs: string[];
}

export interface ServiceHealthCheck {
  checkRef: string;
  serviceName: string;
  serviceDomain:
    | "API"
    | "WEB"
    | "POSTGRES"
    | "AIRTABLE"
    | "N8N"
    | "PAYFAST"
    | "EMAIL"
    | "WHATSAPP"
    | "PLAYWRIGHT"
    | "DOCUMENTS"
    | "AI"
    | "GITHUB"
    | "ORACLE_LITE"
    | "SUPABASE"
    | "UNKNOWN";
  status: ServiceStatus;
  latencyMs?: number;
  errorRate?: number;
  reason: string;
  fixPath: string;
  evidenceRefs: string[];
}

export interface IncidentEvent {
  incidentRef: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  incidentDomain:
    | "SYSTEM"
    | "WORKFLOW"
    | "PAYMENT"
    | "DOCUMENT"
    | "COMMUNICATION"
    | "PLAYWRIGHT"
    | "PORTAL"
    | "SOURCE"
    | "PRIVACY"
    | "SECURITY"
    | "MATCHING"
    | "MANUAL_FALLBACK"
    | "CAPACITY"
    | "OTHER";
  cause: string;
  reason: string;
  fixPath: string;
  evidenceRefs: string[];
}

export interface FounderReportSection {
  sectionRef: string;
  sectionName: string;
  sectionOrder: number;
  sectionStatus: "NORMAL" | "WATCH" | "RISK" | "URGENT" | "BLOCKED";
  summary: string;
  details: Record<string, unknown>;
  evidenceRefs: string[];
}

export interface FounderReport {
  reportRef: string;
  reportType: FounderReportType;
  reportStatus: "DRAFT" | "READY" | "DELIVERED" | "FAILED" | "ARCHIVED";
  title: string;
  executiveSummary: string;
  systemStatus: HealthStatus;
  keyRisks: string[];
  keyActions: string[];
  evidenceRefs: string[];
  sections: FounderReportSection[];
}

export interface OracleLiteCapacitySnapshot {
  capacityRef: string;
  ocpuLimit: number;
  memoryGbLimit: number;
  activeCandidateCap: number;
  activeCandidates: number;
  cpuPressure: PressureLevel;
  memoryPressure: PressureLevel;
  storagePressure: PressureLevel;
  dbPressure: PressureLevel;
  queuePressure: PressureLevel;
  recommendation: string;
  evidenceRefs: string[];
}