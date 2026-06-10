export type AirtableBaseKey =
  | "nexus_7"
  | "nexus_msb"
  | "applications_hub"
  | "ai_engine"
  | "ai_decision_orchestration"
  | "system_operations"
  | "automation_control"
  | "communications_center"
  | "programs_intelligence"
  | "financial_operations"
  | "partner_ecosystem"
  | "document_vault";

export type AirtableSyncDirection =
  | "POSTGRES_TO_AIRTABLE"
  | "AIRTABLE_TO_POSTGRES_INTAKE_ONLY"
  | "AIRTABLE_TO_POSTGRES_OPERATOR_NOTES_ONLY"
  | "BIDIRECTIONAL_REVIEWED";

export type AirtableSyncStatus =
  | "PENDING"
  | "LOCKED"
  | "COMPLETED"
  | "FAILED"
  | "DEAD_LETTER";

export interface AirtableBaseDefinition {
  key: AirtableBaseKey;
  name: string;
  envVar: string;
  purpose: string;
  inboundAllowed: boolean;
  outboundAllowed: boolean;
}

export interface AirtableSyncTarget {
  baseKey: AirtableBaseKey;
  tableKey: string;
  tableName: string;
  postgresTable: string;
  direction: AirtableSyncDirection;
  priority: number;
  backendStateAuthoritative: true;
  inboundRequiresOperatorReview: boolean;
}

export interface AirtableMirrorPayload {
  idempotencyKey: string;
  baseKey: AirtableBaseKey;
  tableKey: string;
  sourceTable: string;
  sourceRecordId?: string;
  sourceExternalRef?: string;
  operation: "CREATE_MIRROR" | "UPDATE_MIRROR" | "ARCHIVE_MIRROR" | "UPSERT_MIRROR";
  fields: Record<string, unknown>;
  evidenceRef?: string;
}

export interface AirtableWebhookReceipt {
  receiptRef: string;
  baseKey: AirtableBaseKey;
  tableKey?: string;
  airtableRecordId?: string;
  eventType: string;
  accepted: boolean;
  rejectionReason?: string;
  requiresOperatorReview: true;
}