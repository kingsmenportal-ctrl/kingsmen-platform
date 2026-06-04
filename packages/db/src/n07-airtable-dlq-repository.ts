export type N07AirtableDlqRecord = {
  dlqId: string;
  mirrorJobId: string;
  reason: string;
  lastError: string;
  attemptCount: number;
  operatorReviewRequired: true;
  productionReady: false;
};

const dlq = new Map<string, N07AirtableDlqRecord>();

export const n07AirtableDlqRepository = {
  async insert(record: N07AirtableDlqRecord) {
    if (!record.dlqId || !record.mirrorJobId || !record.reason || !record.lastError) {
      throw new Error("N07 DLQ insert requires dlqId, mirrorJobId, reason, and lastError");
    }

    if (record.operatorReviewRequired !== true) {
      throw new Error("N07 DLQ requires operator review");
    }

    dlq.set(record.dlqId, record);
    return record;
  },

  async list() {
    return [...dlq.values()];
  }
} as const;