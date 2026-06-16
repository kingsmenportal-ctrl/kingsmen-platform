export interface JarvisConsoleResponseFixture {
  readonly responseRef: string;
  readonly status: 'ready';
  readonly generatedAtIso: string;
  readonly viewModel: {
    readonly hud: { readonly stage: string; readonly summary: string };
    readonly buildSessions: readonly unknown[];
    readonly reviewQueue: readonly unknown[];
    readonly validationReports: readonly unknown[];
  };
  readonly safeSummary: string;
  readonly authorityBoundary: readonly string[];
}

export function jarvisCreateConsoleResponseFixture(input: {
  readonly responseRef: string;
  readonly generatedAtIso: string;
}): JarvisConsoleResponseFixture {
  return {
    responseRef: input.responseRef,
    status: 'ready',
    generatedAtIso: input.generatedAtIso,
    viewModel: {
      hud: {
        stage: 'fixture-ready',
        summary: 'Jarvis founder console fixture is ready for smoke rendering.'
      },
      buildSessions: [],
      reviewQueue: [],
      validationReports: []
    },
    safeSummary: 'Deterministic read-only founder console response fixture.',
    authorityBoundary: [
      'Fixture data is for smoke validation only.',
      'Fixture data does not replace backend read models.',
      'Founder console output remains informational.'
    ]
  };
}
