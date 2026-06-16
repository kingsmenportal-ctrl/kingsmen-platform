export type JarvisConsoleProviderSource = 'fixture' | 'backend-read' | 'cache';

export interface JarvisConsoleDataProviderPort<TViewModel = unknown> {
  readonly providerRef: string;
  readonly source: JarvisConsoleProviderSource;
  readonly readOnly: true;
  readonly canWrite: false;
  readonly supportedViews: readonly string[];
  readonly buildViewModel: (viewRef: string) => TViewModel;
}

export function jarvisCreateConsoleDataProviderPort<TViewModel>(input: {
  readonly providerRef: string;
  readonly source: JarvisConsoleProviderSource;
  readonly supportedViews: readonly string[];
  readonly buildViewModel: (viewRef: string) => TViewModel;
}): JarvisConsoleDataProviderPort<TViewModel> {
  return {
    providerRef: input.providerRef,
    source: input.source,
    readOnly: true,
    canWrite: false,
    supportedViews: input.supportedViews,
    buildViewModel: input.buildViewModel
  };
}
