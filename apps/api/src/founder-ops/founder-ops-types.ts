export type FounderCommandStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "GOVERNANCE_BLOCKED"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "ROUTED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type FounderCommandGroup =
  | "INSPECT"
  | "PRIORITIZE"
  | "PAUSE_RESUME"
  | "APPROVAL"
  | "ESCALATION"
  | "MAP"
  | "PHOENIX"
  | "COMMS"
  | "FINANCE"
  | "DOCUMENTS"
  | "ROUTES"
  | "INCIDENT"
  | "REPORT"
  | "CAPACITY"
  | "SOURCE_REVIEW";

export type FounderRouteTarget =
  | "N12_GOVERNANCE_AND_N16_ORCHESTRATOR"
  | "N13_OBSERVABILITY_ONLY"
  | "N08_CONTROL_PLANE_READ_ONLY";

export type PriorityLane = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "FOUNDER_OVERRIDE";

export interface FounderCommandCatalogEntry {
  commandKey: string;
  commandName: string;
  commandGroup: FounderCommandGroup;
  commandIntent: string;
  routesThrough: FounderRouteTarget;
  requiresApproval: boolean;
  requiresEvidence: boolean;
  allowedFromPhone: boolean;
  dangerous: boolean;
}

export interface FounderCommandRequest {
  commandRef: string;
  commandKey: string;
  requestedBy: string;
  requestedFrom: "CONTROL_PLANE" | "MOBILE" | "EMAIL_REVIEW" | "SYSTEM_BRIEF" | "INCIDENT_PANEL";
  status: FounderCommandStatus;
  priorityLane: PriorityLane;
  candidateRef?: string;
  applicationRef?: string;
  targetRef?: string;
  reason: string;
  evidenceRefs: string[];
  payload: Record<string, unknown>;
}

export interface FounderCommandDecision {
  commandRef: string;
  allowed: boolean;
  status: FounderCommandStatus;
  routeTarget: FounderRouteTarget;
  reason: string;
  requiredNextStep: "READ_ONLY" | "N13_REPORT" | "N12_APPROVAL" | "N16_ORCHESTRATOR" | "BLOCK";
}

export interface FounderBrief {
  briefRef: string;
  briefType: "MORNING" | "MIDDAY" | "EVENING" | "INCIDENT" | "WEEKLY" | "MONTHLY";
  title: string;
  sections: Array<{ key: string; title: string; summary: string; severity: "INFO" | "WATCH" | "WARNING" | "CRITICAL" }>;
  recommendedActions: string[];
  evidenceRefs: string[];
}

export interface FounderMobileCard {
  cardKey: string;
  cardTitle: string;
  cardGroup: string;
  order: number;
  severity: "INFO" | "WATCH" | "WARNING" | "CRITICAL";
  summary: string;
  nextAction: string;
}