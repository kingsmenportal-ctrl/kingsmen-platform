export interface JarvisConsoleBackendReadAdapterInput<TViewModel = unknown> {
  readonly adapterRef: string;
  readonly routeRef: string;
  readonly generatedAtIso: string;
  readonly viewModel: TViewModel;
  readonly safeSummary: string;
}

export interface JarvisConsoleBackendReadAdapterReal<TViewModel = unknown> {
  readonly adapterRef: string;
  readonly routeRef: string;
  readonly readOnly: true;
  readonly generatedAtIso: string;
  readonly viewModel: TViewModel;
  readonly safeSummary: string;
  readonly authorityBoundary: readonly string[];
}

export function jarvisCreateConsoleBackendReadAdapterReal<TViewModel>(
  input: JarvisConsoleBackendReadAdapterInput<TViewModel>
): JarvisConsoleBackendReadAdapterReal<TViewModel> {
  return {
    adapterRef: input.adapterRef,
    routeRef: input.routeRef,
    readOnly: true,
    generatedAtIso: input.generatedAtIso,
    viewModel: input.viewModel,
    safeSummary: input.safeSummary,
    authorityBoundary: [
      'JarvisConsoleBackendReadAdapterReal is display-only.',
      'It accepts prepared read-model data only.',
      'It does not mutate backend state or connector state.',
      'Founder approval remains required for production-risk actions.'
    ]
  };
}
