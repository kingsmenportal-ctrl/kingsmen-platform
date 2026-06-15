export type JarvisValidationReportListItem = {
  readonly reportRef: string;
  readonly passRef: string;
  readonly status: 'pass' | 'warn' | 'fail' | 'not_run';
  readonly reportPath: string;
  readonly safeSummary: string;
  readonly generatedAt: string;
};

export type JarvisValidationReportListViewInput = {
  readonly viewRef: string;
  readonly reports: readonly JarvisValidationReportListItem[];
};

export type JarvisValidationReportListView = {
  readonly viewRef: string;
  readonly mode: 'read_only_validation_report_list';
  readonly totalCount: number;
  readonly passCount: number;
  readonly warnCount: number;
  readonly failCount: number;
  readonly notRunCount: number;
  readonly reports: readonly JarvisValidationReportListItem[];
};

export function jarvisCreateValidationReportListView(
  input: JarvisValidationReportListViewInput,
): JarvisValidationReportListView {
  const reports = [...input.reports].sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
  return {
    viewRef: input.viewRef,
    mode: 'read_only_validation_report_list',
    totalCount: reports.length,
    passCount: reports.filter((report) => report.status === 'pass').length,
    warnCount: reports.filter((report) => report.status === 'warn').length,
    failCount: reports.filter((report) => report.status === 'fail').length,
    notRunCount: reports.filter((report) => report.status === 'not_run').length,
    reports,
  };
}

export const JARVIS_VALIDATION_REPORT_LIST_VIEW_LIVE = true;
