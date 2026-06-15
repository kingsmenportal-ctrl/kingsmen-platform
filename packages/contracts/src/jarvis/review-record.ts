export type JarvisFounderReviewOutcome = 'cleared' | 'held' | 'rejected';

export interface JarvisFounderReviewRecordSafeName {
  readonly reviewRef: string;
  readonly requestRef: string;
  readonly moduleRef: string;
  readonly reviewerRef: 'founder';
  readonly outcome: JarvisFounderReviewOutcome;
  readonly reason: string;
  readonly safeSummary: string;
  readonly scopePaths: readonly string[];
  readonly expiresAtIso?: string;
  readonly createdAtIso: string;
}

export function jarvisReviewRecordRequiresFounder(record: JarvisFounderReviewRecordSafeName): boolean {
  return record.reviewerRef === 'founder' && record.safeSummary.trim().length > 0;
}
