export interface JarvisValidatorReportHudItem {
  readonly validatorRef: string;
  readonly status: 'pass' | 'warn' | 'fail' | 'not_run';
  readonly safeSummary: string;
}

export interface JarvisValidatorReportHudPanel {
  readonly panelRef: string;
  readonly title: 'Validator report';
  readonly overallStatus: JarvisValidatorReportHudItem['status'];
  readonly total: number;
  readonly items: readonly JarvisValidatorReportHudItem[];
  readonly panelMode: 'read_only_validation';
}

export function jarvisCreateValidatorReportHudPanel(
  panelRef: string,
  items: readonly JarvisValidatorReportHudItem[],
): JarvisValidatorReportHudPanel {
  const overallStatus: JarvisValidatorReportHudItem['status'] = items.some((item) => item.status === 'fail')
    ? 'fail'
    : items.some((item) => item.status === 'warn')
      ? 'warn'
      : items.some((item) => item.status === 'not_run')
        ? 'not_run'
        : 'pass';

  return {
    panelRef,
    title: 'Validator report',
    overallStatus,
    total: items.length,
    items,
    panelMode: 'read_only_validation',
  };
}
