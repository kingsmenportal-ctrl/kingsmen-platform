export interface JarvisConsoleBackendProviderBridgeInput<TViewModel = unknown> {
  readonly bridgeRef: string;
  readonly providerRef: string;
  readonly viewRef: string;
  readonly viewModel: TViewModel;
  readonly generatedAtIso: string;
  readonly safeSummary: string;
}

export interface JarvisConsoleBackendProviderBridge<TViewModel = unknown> {
  readonly bridgeRef: string;
  readonly providerRef: string;
  readonly viewRef: string;
  readonly readOnly: true;
  readonly generatedAtIso: string;
  readonly viewModel: TViewModel;
  readonly safeSummary: string;
  readonly authorityBoundary: readonly string[];
}

export function jarvisCreateConsoleBackendProviderBridge<TViewModel>(
  input: JarvisConsoleBackendProviderBridgeInput<TViewModel>
): JarvisConsoleBackendProviderBridge<TViewModel> {
  return {
    bridgeRef: input.bridgeRef,
    providerRef: input.providerRef,
    viewRef: input.viewRef,
    readOnly: true,
    generatedAtIso: input.generatedAtIso,
    viewModel: input.viewModel,
    safeSummary: input.safeSummary,
    authorityBoundary: [
      'JarvisConsoleBackendProviderBridge reads prepared console view data only.',
      'It does not mutate backend state or connector state.',
      'PostgreSQL Truth Vault and backend state machine remain authoritative.'
    ]
  };
}
