export const N07_AIRTABLE_ORACLE_LITE_LIMITS = {
  minBatchIntervalMinutes: 15,
  maxRecordsPerBatch: 50,
  maxConcurrentSyncWorkers: 1,
  retryLimit: 3,
  dlqRequired: true,
  productionReady: false
} as const;

export function assertN07AirtableSyncQueueSafe(input: {
  batchIntervalMinutes: number;
  recordsPerBatch: number;
  concurrentSyncWorkers: number;
  retryLimit: number;
  dlqEnabled: boolean;
}) {
  if (input.batchIntervalMinutes < N07_AIRTABLE_ORACLE_LITE_LIMITS.minBatchIntervalMinutes) {
    throw new Error("N07 Airtable sync blocked: batch interval must respect Oracle Lite/free-tier discipline");
  }

  if (input.recordsPerBatch > N07_AIRTABLE_ORACLE_LITE_LIMITS.maxRecordsPerBatch) {
    throw new Error("N07 Airtable sync blocked: batch size exceeds Oracle Lite/free-tier discipline");
  }

  if (input.concurrentSyncWorkers > N07_AIRTABLE_ORACLE_LITE_LIMITS.maxConcurrentSyncWorkers) {
    throw new Error("N07 Airtable sync blocked: concurrency exceeds Oracle Lite/free-tier discipline");
  }

  if (input.retryLimit > N07_AIRTABLE_ORACLE_LITE_LIMITS.retryLimit) {
    throw new Error("N07 Airtable sync blocked: retry limit too high");
  }

  if (input.dlqEnabled !== true) {
    throw new Error("N07 Airtable sync blocked: DLQ is required");
  }

  return true;
}