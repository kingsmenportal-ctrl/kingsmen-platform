import { assertN07AirtableMirrorSafe } from "./airtable-mirror-policy";
import { assertN07AirtableSyncQueueSafe } from "./airtable-sync-queue-policy";

export function runN07AirtableMirrorWorker(input: {
  mirrorJobId: string;
  operation: "upsert" | "archive" | "health_check";
  providerConfigured: boolean;
  providerVerified: boolean;
  batchIntervalMinutes: number;
  recordsPerBatch: number;
  concurrentSyncWorkers: number;
  retryLimit: number;
  dlqEnabled: boolean;
}) {
  assertN07AirtableSyncQueueSafe({
    batchIntervalMinutes: input.batchIntervalMinutes,
    recordsPerBatch: input.recordsPerBatch,
    concurrentSyncWorkers: input.concurrentSyncWorkers,
    retryLimit: input.retryLimit,
    dlqEnabled: input.dlqEnabled
  });

  assertN07AirtableMirrorSafe({
    action: input.operation,
    postgresTruthPreserved: true,
    airtableMirrorOnly: true,
    providerLiveClaim: false,
    productionReady: false
  });

  if (!input.providerConfigured || !input.providerVerified) {
    return {
      mirrorJobId: input.mirrorJobId,
      status: "skipped_degraded",
      providerConfigured: input.providerConfigured,
      liveClaimAllowed: false,
      postgresTruthPreserved: true,
      productionReady: false
    } as const;
  }

  return {
    mirrorJobId: input.mirrorJobId,
    status: "mirrored",
    providerConfigured: true,
    liveClaimAllowed: false,
    postgresTruthPreserved: true,
    productionReady: false
  } as const;
}