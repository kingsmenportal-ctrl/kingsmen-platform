export type JarvisConsoleResponseStatus = 'ready' | 'empty' | 'blocked' | 'error';

export interface JarvisConsoleResponseContract<TViewModel = unknown> {
  readonly responseRef: string;
  readonly routeRef: string;
  readonly status: JarvisConsoleResponseStatus;
  readonly generatedAtIso: string;
  readonly viewModel: TViewModel;
  readonly safeSummary: string;
  readonly authorityBoundary: readonly string[];
  readonly nextReadTargets: readonly string[];
}

export function jarvisCreateConsoleResponseContract<TViewModel>(input: {
  readonly responseRef: string;
  readonly routeRef: string;
  readonly status?: JarvisConsoleResponseStatus;
  readonly generatedAtIso: string;
  readonly viewModel: TViewModel;
  readonly safeSummary: string;
  readonly nextReadTargets?: readonly string[];
}): JarvisConsoleResponseContract<TViewModel> {
  return {
    responseRef: input.responseRef,
    routeRef: input.routeRef,
    status: input.status ?? 'ready',
    generatedAtIso: input.generatedAtIso,
    viewModel: input.viewModel,
    safeSummary: input.safeSummary,
    authorityBoundary: [
      'Founder console response is read-only.',
      'Response contract does not mutate Kingsmen state.',
      'Backend state machine and PostgreSQL Truth Vault remain authoritative.',
      'Production-risk paths still require founder approval.'
    ],
    nextReadTargets: input.nextReadTargets ?? []
  };
}
