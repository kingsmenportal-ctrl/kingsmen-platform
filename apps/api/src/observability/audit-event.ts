export type KingsmenAuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface KingsmenAuditEvent {
  eventId: string;
  eventType: string;
  severity: KingsmenAuditSeverity;
  correlationId: string;
  actorId: string;
  candidateId?: string;
  applicationId?: string;
  evidenceRef?: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function createAuditEvent(input: Omit<KingsmenAuditEvent, "eventId" | "createdAt">): KingsmenAuditEvent {
  return {
    ...input,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString()
  };
}