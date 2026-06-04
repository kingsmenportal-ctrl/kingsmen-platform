export type N07AirtableMirrorJobStatus =
  | "queued"
  | "running"
  | "mirrored"
  | "skipped_degraded"
  | "failed_retryable"
  | "dead_lettered";

export type N07AirtableMirrorJob = {
  mirrorJobId: string;
  idempotencyKey: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetBaseName: string;
  targetTableName: string;
  operation: "upsert" | "archive" | "health_check";
  status: N07AirtableMirrorJobStatus;
  attemptCount: number;
  maxAttempts: 3;
  postgresTruthPreserved: true;
  airtableMirrorOnly: true;
  productionReady: false;
};

export type N07AirtableDlqRecord = {
  dlqId: string;
  mirrorJobId: string;
  reason: string;
  lastError: string;
  attemptCount: number;
  operatorReviewRequired: true;
  productionReady: false;
};