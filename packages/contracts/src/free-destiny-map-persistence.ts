import type {
  FreeDestinyMapIntakePayload,
  FreeDestinyMapIntakeResult
} from "./free-destiny-map-intake";

export type FreeDestinyMapLocalStatus =
  | "LOCAL_SHELL_RECEIVED"
  | "LOCAL_SHELL_ACCEPTED"
  | "LOCAL_SHELL_REJECTED"
  | "LOCAL_SHELL_WRITE_DISABLED";

export interface FreeDestinyMapAuditEvent {
  eventType: string;
  message: string;
  occurredAt: string;
  productionReady: false;
}

export interface StoredFreeDestinyMapIntakeSummary {
  reference: string;
  status: FreeDestinyMapLocalStatus;
  createdAt: string;
  productionReady: false;
  storesProductionData: false;
  payload: FreeDestinyMapIntakePayload;
  result: FreeDestinyMapIntakeResult;
  auditEvents: FreeDestinyMapAuditEvent[];
}

export interface FreeDestinyMapPersistenceResult {
  accepted: boolean;
  reference: string;
  productionReady: false;
  localPersistenceEnabled: boolean;
  localWriteAttempted: boolean;
  localWriteSucceeded: boolean;
  storageMode: "disabled" | "local_jsonl_shell";
  safeNotice: string;
  nextAction: string;
  issues: FreeDestinyMapIntakeResult["issues"];
}

export const FREE_DESTINY_MAP_LOCAL_PERSISTENCE_NOTICE =
  "Local persistence is a development/runtime shell only. It is not production database storage, not official submission, not payment, not email delivery, and not document upload.";

export function buildFreeDestinyMapAuditEvent(eventType: string, message: string): FreeDestinyMapAuditEvent {
  return {
    eventType,
    message,
    occurredAt: new Date().toISOString(),
    productionReady: false
  };
}
