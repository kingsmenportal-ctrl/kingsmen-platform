export type CommunicationChannel =
  | "EMAIL_PRIMARY"
  | "WHATSAPP_URGENT_ONLY"
  | "SMS_BACKUP_ONLY"
  | "PORTAL_INBOX";

export type CommunicationUrgency = "LOW" | "NORMAL" | "URGENT" | "EMERGENCY";

export type NotificationStatus =
  | "QUEUED"
  | "HELD_FOR_QUIET_HOURS"
  | "HELD_FOR_APPROVAL"
  | "LOCKED"
  | "SENT"
  | "FAILED"
  | "CANCELLED";

export interface CommunicationTemplate {
  templateKey: string;
  templateName: string;
  channel: CommunicationChannel;
  subjectTemplate?: string;
  bodyTemplate: string;
  purpose: string;
  allowedWhen: string[];
  requiresHumanReview: boolean;
  isActive: boolean;
}

export interface NotificationDraft {
  candidateRef?: string;
  applicationRef?: string;
  threadRef?: string;
  templateKey?: string;
  channel: CommunicationChannel;
  recipient: string;
  subject?: string;
  body: string;
  purpose: string;
  urgency: CommunicationUrgency;
  idempotencyKey: string;
  evidenceRef?: string;
}

export interface InboundMessage {
  inboundRef: string;
  candidateRef?: string;
  threadRef?: string;
  channel: CommunicationChannel;
  sender: string;
  subject?: string;
  body: string;
  detectedIntent?: string;
  urgency: CommunicationUrgency;
  needsHumanReview: boolean;
  evidenceRef?: string;
}

export interface CommunicationEvidence {
  evidenceRef: string;
  sourceRef: string;
  sourceType: "notification_outbox" | "delivery_attempt" | "inbound_message" | "portal_message" | "urgent_escalation";
  candidateRef?: string;
  applicationRef?: string;
  channel: CommunicationChannel;
  eventName: string;
  eventSummary: string;
  proofPayload: Record<string, unknown>;
}