export type JarvisSafeValidatorStatus = 'pass' | 'warn' | 'fail' | 'not_run';

export interface JarvisSafeValidatorInput {
  readonly validatorRef: string;
  readonly status: JarvisSafeValidatorStatus;
  readonly summary: string;
  readonly checkedAtIso: string;
}

export interface JarvisSafeValidatorAggregate {
  readonly aggregateRef: string;
  readonly status: JarvisSafeValidatorStatus;
  readonly total: number;
  readonly passed: number;
  readonly warnings: number;
  readonly failed: number;
  readonly notRun: number;
  readonly summaries: readonly string[];
}

export function jarvisAggregateValidatorReportsSafe(
  aggregateRef: string,
  reports: readonly JarvisSafeValidatorInput[],
): JarvisSafeValidatorAggregate {
  const passed = reports.filter((report) => report.status === 'pass').length;
  const warnings = reports.filter((report) => report.status === 'warn').length;
  const failed = reports.filter((report) => report.status === 'fail').length;
  const notRun = reports.filter((report) => report.status === 'not_run').length;

  const status: JarvisSafeValidatorStatus = failed > 0
    ? 'fail'
    : warnings > 0
      ? 'warn'
      : notRun > 0
        ? 'not_run'
        : 'pass';

  return {
    aggregateRef,
    status,
    total: reports.length,
    passed,
    warnings,
    failed,
    notRun,
    summaries: reports.map((report) => `${report.validatorRef}: ${report.status} - ${report.summary}`),
  };
}
