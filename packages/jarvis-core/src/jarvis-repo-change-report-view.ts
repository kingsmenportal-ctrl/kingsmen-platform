import type { JarvisRepoChangeSummary } from './jarvis-repo-change-summary';

export interface JarvisRepoChangeReportView {
  readonly viewRef: string;
  readonly summaryRef: string;
  readonly changedCount: number;
  readonly blockedCount: number;
  readonly safeSummary: string;
  readonly visiblePaths: readonly string[];
  readonly createdAtIso: string;
}

export function jarvisCreateRepoChangeReportView(
  summary: JarvisRepoChangeSummary,
  createdAtIso: string,
): JarvisRepoChangeReportView {
  return {
    viewRef: `jarvis-repo-change-view-${summary.summaryRef}`,
    summaryRef: summary.summaryRef,
    changedCount: summary.changedPaths.length,
    blockedCount: summary.blockedPaths.length,
    safeSummary: summary.safeSummary,
    visiblePaths: summary.changedPaths,
    createdAtIso,
  };
}
