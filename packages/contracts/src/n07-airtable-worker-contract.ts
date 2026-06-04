export type N07AirtableWorkerLimits = {
  maxConcurrentWorkers: 1;
  minBatchIntervalMinutes: 15;
  maxRecordsPerBatch: 50;
  maxAttempts: 3;
  dlqRequired: true;
  productionReady: false;
};

export type N07AirtableWorkerResult = {
  mirrorJobId: string;
  status: "mirrored" | "skipped_degraded" | "failed_retryable" | "dead_lettered";
  providerConfigured: boolean;
  liveClaimAllowed: false;
  postgresTruthPreserved: true;
  productionReady: false;
};