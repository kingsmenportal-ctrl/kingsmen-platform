import { getAirtableSyncTarget } from "./airtable-sync-targets";
import { evaluateInboundWebhookPolicy } from "./airtable-sync-policy";
import type { AirtableWebhookReceipt } from "./airtable-types";

export interface RawAirtableWebhookEvent {
  baseKey: string;
  tableKey?: string;
  airtableRecordId?: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export function normalizeAirtableWebhookEvent(event: RawAirtableWebhookEvent): AirtableWebhookReceipt {
  const receipt: AirtableWebhookReceipt = {
    receiptRef: `airtable_receipt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    baseKey: event.baseKey as AirtableWebhookReceipt["baseKey"],
    tableKey: event.tableKey,
    airtableRecordId: event.airtableRecordId,
    eventType: event.eventType,
    accepted: false,
    requiresOperatorReview: true
  };

  if (!event.tableKey) {
    return {
      ...receipt,
      rejectionReason: "Missing table key. Airtable inbound event cannot be routed."
    };
  }

  const target = getAirtableSyncTarget(event.baseKey, event.tableKey);
  const decision = evaluateInboundWebhookPolicy(target, receipt);

  return {
    ...receipt,
    accepted: decision.allowed,
    rejectionReason: decision.allowed ? undefined : decision.reason,
    requiresOperatorReview: true
  };
}