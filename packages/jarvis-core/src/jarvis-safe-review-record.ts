import type { JarvisFounderReviewRecordSafeName, JarvisFounderReviewOutcome } from '../../contracts/src/jarvis/review-record';

export interface CreateJarvisSafeReviewRecordInput {
  readonly requestRef: string;
  readonly moduleRef: string;
  readonly outcome: JarvisFounderReviewOutcome;
  readonly reason: string;
  readonly safeSummary: string;
  readonly scopePaths: readonly string[];
  readonly createdAtIso: string;
  readonly expiresAtIso?: string;
}

export function jarvisCreateFounderReviewRecordSafeName(
  input: CreateJarvisSafeReviewRecordInput,
): JarvisFounderReviewRecordSafeName {
  return {
    reviewRef: `jarvis-review-${input.requestRef}`,
    requestRef: input.requestRef,
    moduleRef: input.moduleRef,
    reviewerRef: 'founder',
    outcome: input.outcome,
    reason: input.reason,
    safeSummary: input.safeSummary,
    scopePaths: input.scopePaths,
    expiresAtIso: input.expiresAtIso,
    createdAtIso: input.createdAtIso,
  };
}
