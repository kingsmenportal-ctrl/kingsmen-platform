export type JarvisTaskState =
  | 'new'
  | 'intake'
  | 'scoped'
  | 'planned'
  | 'review_required'
  | 'ready_for_validation'
  | 'validated'
  | 'closed'
  | 'blocked';

export type JarvisTaskTransition = {
  readonly from: JarvisTaskState;
  readonly to: JarvisTaskState;
  readonly reason: string;
};

const allowedTransitions: readonly JarvisTaskTransition[] = [
  { from: 'new', to: 'intake', reason: 'task accepted for safe intake' },
  { from: 'intake', to: 'scoped', reason: 'scope and files selected' },
  { from: 'scoped', to: 'planned', reason: 'plan prepared' },
  { from: 'planned', to: 'review_required', reason: 'founder review required' },
  { from: 'planned', to: 'ready_for_validation', reason: 'ready to validate' },
  { from: 'review_required', to: 'ready_for_validation', reason: 'review completed' },
  { from: 'ready_for_validation', to: 'validated', reason: 'validator report available' },
  { from: 'validated', to: 'closed', reason: 'task complete' },
  { from: 'intake', to: 'blocked', reason: 'intake blocked by policy' },
  { from: 'scoped', to: 'blocked', reason: 'scope blocked by policy' },
  { from: 'planned', to: 'blocked', reason: 'plan blocked by policy' }
];

export function jarvisCanTransitionTask(from: JarvisTaskState, to: JarvisTaskState): boolean {
  return allowedTransitions.some((transition) => transition.from === from && transition.to === to);
}

export function jarvisListTaskTransitions(from: JarvisTaskState): readonly JarvisTaskTransition[] {
  return allowedTransitions.filter((transition) => transition.from === from);
}

export function jarvisApplyTaskTransition(input: {
  readonly taskRef: string;
  readonly from: JarvisTaskState;
  readonly to: JarvisTaskState;
}): { readonly taskRef: string; readonly state: JarvisTaskState; readonly accepted: boolean; readonly reason: string } {
  const transition = allowedTransitions.find((candidate) => candidate.from === input.from && candidate.to === input.to);
  return {
    taskRef: input.taskRef,
    state: transition ? input.to : input.from,
    accepted: Boolean(transition),
    reason: transition?.reason ?? 'transition not allowed by Jarvis task adapter'
  };
}

export const JARVIS_TASK_STATE_MACHINE_ADAPTER_LIVE = true;
