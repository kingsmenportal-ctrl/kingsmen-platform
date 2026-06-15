import type { JarvisPatchPlanContract } from '../../contracts/src/jarvis/patch-plan';

export interface JarvisValidatorChecklist {
  readonly checklistRef: string;
  readonly commandRef: string;
  readonly items: readonly string[];
  readonly safeSummary: string;
}

export function jarvisCreateValidatorChecklist(input: {
  readonly checklistRef: string;
  readonly commandRef: string;
  readonly patchPlan?: JarvisPatchPlanContract;
  readonly items?: readonly string[];
  readonly safeSummary?: string;
}): JarvisValidatorChecklist {
  const items = input.items ?? input.patchPlan?.validatorCommands ?? [];
  return {
    checklistRef: input.checklistRef,
    commandRef: input.commandRef,
    items,
    safeSummary:
      input.safeSummary ??
      `Jarvis validator checklist prepared ${items.length} item(s) for founder review.`
  };
}
