import type { JarvisPatchPlanContract } from '../../contracts/src/jarvis/patch-plan';

export type JarvisPatchReviewQueueStatus = 'queued' | 'reviewing' | 'cleared' | 'held';

export interface JarvisPatchReviewQueueEntry {
  readonly queueRef: string;
  readonly patchPlanRef: string;
  readonly moduleRef: string;
  readonly status: JarvisPatchReviewQueueStatus;
  readonly scopePaths: readonly string[];
  readonly safeSummary: string;
  readonly createdAtIso: string;
}

export function jarvisCreatePatchReviewQueueEntry(
  plan: JarvisPatchPlanContract,
  createdAtIso: string,
): JarvisPatchReviewQueueEntry {
  return {
    queueRef: `jarvis-patch-review-${plan.patchPlanRef}`,
    patchPlanRef: plan.patchPlanRef,
    moduleRef: plan.moduleRef,
    status: 'queued',
    scopePaths: plan.scopePaths,
    safeSummary: plan.safeSummary,
    createdAtIso,
  };
}
