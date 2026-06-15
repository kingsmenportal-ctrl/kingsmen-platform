export type JarvisValidatorReportLine = {
  readonly checkRef: string;
  readonly status: 'passed' | 'warning' | 'failed' | 'not_run';
  readonly summary: string;
};

export type JarvisValidatorReportView = {
  readonly reportRef: string;
  readonly overallStatus: 'passed' | 'warning' | 'failed' | 'not_run';
  readonly totalChecks: number;
  readonly passedCount: number;
  readonly warningCount: number;
  readonly failedCount: number;
  readonly notRunCount: number;
  readonly lines: readonly JarvisValidatorReportLine[];
};

export function jarvisCreateValidatorReportView(input: {
  readonly reportRef: string;
  readonly lines: readonly JarvisValidatorReportLine[];
}): JarvisValidatorReportView {
  const passedCount = input.lines.filter((line) => line.status === 'passed').length;
  const warningCount = input.lines.filter((line) => line.status === 'warning').length;
  const failedCount = input.lines.filter((line) => line.status === 'failed').length;
  const notRunCount = input.lines.filter((line) => line.status === 'not_run').length;

  const overallStatus = failedCount > 0
    ? 'failed'
    : warningCount > 0
      ? 'warning'
      : notRunCount > 0
        ? 'not_run'
        : 'passed';

  return {
    reportRef: input.reportRef,
    overallStatus,
    totalChecks: input.lines.length,
    passedCount,
    warningCount,
    failedCount,
    notRunCount,
    lines: input.lines
  };
}

export const JARVIS_VALIDATOR_REPORT_VIEWER_LIVE = true;
