export type JarvisSafeWorkStepKind = 'read' | 'plan' | 'draft' | 'validate' | 'report';

export interface JarvisSafeWorkPlanStep {
  readonly stepRef: string;
  readonly kind: JarvisSafeWorkStepKind;
  readonly safeLabel: string;
  readonly expectedOutput: string;
}

export interface JarvisSafeWorkPlanWithoutCommandText {
  readonly planRef: string;
  readonly requestRef: string;
  readonly moduleRef: string;
  readonly noRawLocalCommandText: true;
  readonly scopePaths: readonly string[];
  readonly steps: readonly JarvisSafeWorkPlanStep[];
  readonly requiredReviewBeforeWrite: boolean;
  readonly createdAtIso: string;
}

export function jarvisSafeWorkPlanIsScoped(plan: JarvisSafeWorkPlanWithoutCommandText): boolean {
  return plan.noRawLocalCommandText === true && plan.scopePaths.length > 0 && plan.steps.length > 0;
}
