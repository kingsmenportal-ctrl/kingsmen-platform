export type JarvisPatchReviewDecision = 'needs_changes' | 'accepted_for_validation' | 'blocked';

export type JarvisPatchReviewInput = {
  readonly reviewRef: string;
  readonly patchPlanRef: string;
  readonly changedPathCount: number;
  readonly blockedPathCount: number;
  readonly validatorStatus: 'not_run' | 'passed' | 'warning' | 'failed';
  readonly founderReviewRequired: boolean;
  readonly safeSummary: string;
};

export type JarvisPatchReviewDecisionRecord = {
  readonly reviewRef: string;
  readonly patchPlanRef: string;
  readonly decision: JarvisPatchReviewDecision;
  readonly reason: string;
  readonly nextStage: 'revise_scope' | 'run_validation' | 'founder_review';
  readonly safeSummary: string;
};

export function jarvisDecidePatchReview(input: JarvisPatchReviewInput): JarvisPatchReviewDecisionRecord {
  if (input.blockedPathCount > 0) {
    return {
      reviewRef: input.reviewRef,
      patchPlanRef: input.patchPlanRef,
      decision: 'blocked',
      reason: 'blocked paths are present',
      nextStage: 'revise_scope',
      safeSummary: input.safeSummary
    };
  }

  if (input.founderReviewRequired) {
    return {
      reviewRef: input.reviewRef,
      patchPlanRef: input.patchPlanRef,
      decision: 'needs_changes',
      reason: 'founder review required before validation',
      nextStage: 'founder_review',
      safeSummary: input.safeSummary
    };
  }

  if (input.validatorStatus === 'failed') {
    return {
      reviewRef: input.reviewRef,
      patchPlanRef: input.patchPlanRef,
      decision: 'needs_changes',
      reason: 'validator failure must be corrected',
      nextStage: 'revise_scope',
      safeSummary: input.safeSummary
    };
  }

  return {
    reviewRef: input.reviewRef,
    patchPlanRef: input.patchPlanRef,
    decision: 'accepted_for_validation',
    reason: 'scope is safe for validation',
    nextStage: 'run_validation',
    safeSummary: input.safeSummary
  };
}

export const JARVIS_PATCH_REVIEW_DECISION_FLOW_LIVE = true;
