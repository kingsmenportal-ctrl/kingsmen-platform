import type { JarvisConsoleViewModel } from './jarvis-console-view-model-assembler';

export interface JarvisConsoleUiSnapshotValidation {
  readonly validatorRef: string;
  readonly passed: boolean;
  readonly issues: readonly string[];
  readonly safeSummary: string;
}

export function jarvisValidateConsoleUiSnapshot(view: JarvisConsoleViewModel): JarvisConsoleUiSnapshotValidation {
  const issues: string[] = [];

  if (view.title !== 'Kingsmen Jarvis Founder Console') {
    issues.push('Unexpected console title.');
  }

  if (view.counts.hudPanels < 0 || view.counts.reviewItems < 0 || view.counts.validationReports < 0 || view.counts.buildSessions < 0) {
    issues.push('Negative count detected.');
  }

  if (!view.safeSummary.trim()) {
    issues.push('Missing safe summary.');
  }

  return {
    validatorRef: 'jarvis-console-ui-snapshot-validator',
    passed: issues.length === 0,
    issues,
    safeSummary: issues.length === 0 ? 'Console UI snapshot is valid for read-only founder display.' : 'Console UI snapshot needs review.',
  };
}

export const JARVIS_CONSOLE_UI_SNAPSHOT_VALIDATOR = 'JarvisConsoleUiSnapshotValidator';
