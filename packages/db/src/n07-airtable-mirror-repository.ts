export type N07MirrorJobRecord = {
  mirrorJobId: string;
  idempotencyKey: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetBaseName: string;
  targetTableName: string;
  operation: "upsert" | "archive" | "health_check";
  status: "queued" | "running" | "mirrored" | "skipped_degraded" | "failed_retryable" | "dead_lettered";
  attemptCount: number;
  maxAttempts: 3;
  postgresTruthPreserved: true;
  airtableMirrorOnly: true;
  productionReady: false;
};

const jobs = new Map<string, N07MirrorJobRecord>();
const idempotencyIndex = new Map<string, string>();

export const n07AirtableMirrorRepository = {
  async enqueue(job: N07MirrorJobRecord) {
    if (idempotencyIndex.has(job.idempotencyKey)) {
      const existingId = idempotencyIndex.get(job.idempotencyKey)!;
      return jobs.get(existingId)!;
    }

    if (job.postgresTruthPreserved !== true || job.airtableMirrorOnly !== true) {
      throw new Error("N07 mirror job blocked: PostgreSQL truth and Airtable mirror-only flags are required");
    }

    jobs.set(job.mirrorJobId, job);
    idempotencyIndex.set(job.idempotencyKey, job.mirrorJobId);
    return job;
  },

  async markStatus(input: { mirrorJobId: string; status: N07MirrorJobRecord["status"]; lastError?: string }) {
    const job = jobs.get(input.mirrorJobId);
    if (!job) throw new Error(`N07 mirror job not found: ${input.mirrorJobId}`);

    const updated = { ...job, status: input.status };
    jobs.set(input.mirrorJobId, updated);
    return updated;
  },

  async nextQueued(limit: number) {
    return [...jobs.values()].filter((job) => job.status === "queued").slice(0, limit);
  }
} as const;