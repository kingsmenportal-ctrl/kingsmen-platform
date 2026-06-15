export type JarvisValidationReportFixture = {
  readonly reportRef: string;
  readonly validatorRef: string;
  readonly status: 'pass' | 'warning' | 'fail' | 'not_run';
  readonly safeSummary: string;
  readonly generatedAtIso: string;
};

export const jarvisCreateValidationReportFixture = (): JarvisValidationReportFixture => ({
  reportRef: 'jarvis-validation-fixture-001',
  validatorRef: 'validate-jarvis-live-pass-08',
  status: 'pass',
  safeSummary: 'Fixture report for founder console validation panel smoke checks.',
  generatedAtIso: '2026-06-15T00:00:00.000Z',
});
