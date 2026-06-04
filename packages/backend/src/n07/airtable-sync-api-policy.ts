import { assertN07AirtableMirrorSafe } from "./airtable-mirror-policy";
import { assertN07AirtableSyncQueueSafe } from "./airtable-sync-queue-policy";

export function assertN07AirtableSyncApiSafe(input: {
  action: "enqueue_mirror_job" | "view_health" | "retry_dlq";
  actorType: "founder" | "operator" | "system" | "worker" | "candidate";
  batchIntervalMinutes: number;
  recordsPerBatch: number;
  concurrentSyncWorkers: number;
  retryLimit: number;
  dlqEnabled: boolean;
  serviceRoleVisibleToBrowser?: boolean;
  productionReady?: boolean;
}) {
  if (input.actorType === "candidate") {
    throw new Error("N07 Airtable sync API blocked: candidate cannot operate Airtable sync");
  }

  if (input.serviceRoleVisibleToBrowser === true) {
    throw new Error("N07 Airtable sync API blocked: service_role must never be visible to browser");
  }

  if (input.productionReady === true) {
    throw new Error("N07 Airtable sync API cannot claim productionReady=true");
  }

  assertN07AirtableMirrorSafe({
    action: input.action,
    postgresTruthPreserved: true,
    airtableMirrorOnly: true,
    providerLiveClaim: false,
    productionReady: false
  });

  assertN07AirtableSyncQueueSafe({
    batchIntervalMinutes: input.batchIntervalMinutes,
    recordsPerBatch: input.recordsPerBatch,
    concurrentSyncWorkers: input.concurrentSyncWorkers,
    retryLimit: input.retryLimit,
    dlqEnabled: input.dlqEnabled
  });

  return true;
}