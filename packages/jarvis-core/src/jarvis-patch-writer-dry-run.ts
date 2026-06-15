import type { JarvisPatchPlanContract } from '../../contracts/src/jarvis/patch-plan';
import type { JarvisPatchWriterDryRunResult } from '../../contracts/src/jarvis/ops';

export function jarvisCreatePatchWriterDryRunResult(input: {
  readonly resultRef: string;
  readonly patchPlan: JarvisPatchPlanContract;
  readonly safeSummary?: string;
}): JarvisPatchWriterDryRunResult {
  const blockedFileCount = input.patchPlan.operations.filter(
    (operation) => operation.operationKind === 'blocked_change'
  ).length;
  return {
    resultRef: input.resultRef,
    patchPlanRef: input.patchPlan.patchPlanRef,
    plannedFileCount: input.patchPlan.operations.length,
    blockedFileCount,
    readyForReview: input.patchPlan.readyForPatchWriter && blockedFileCount === 0,
    safeSummary:
      input.safeSummary ??
      `Jarvis dry-run patch writer prepared ${input.patchPlan.operations.length} planned file operation(s).`
  };
}
