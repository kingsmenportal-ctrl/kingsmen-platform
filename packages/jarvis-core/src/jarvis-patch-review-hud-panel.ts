export interface JarvisPatchReviewHudPanelInput {
  readonly panelRef: string;
  readonly reviewRef: string;
  readonly moduleRef: string;
  readonly safeSummary: string;
  readonly changedPaths: readonly string[];
  readonly blockedPaths: readonly string[];
  readonly validatorStatus: 'pass' | 'warn' | 'fail' | 'not_run';
  readonly reviewStatus: 'waiting' | 'accepted' | 'returned' | 'blocked';
}

export interface JarvisPatchReviewHudPanel {
  readonly panelRef: string;
  readonly title: string;
  readonly moduleRef: string;
  readonly safeSummary: string;
  readonly changedPathCount: number;
  readonly blockedPathCount: number;
  readonly validatorStatus: JarvisPatchReviewHudPanelInput['validatorStatus'];
  readonly reviewStatus: JarvisPatchReviewHudPanelInput['reviewStatus'];
  readonly visiblePaths: readonly string[];
  readonly panelMode: 'read_only_review';
}

export function jarvisCreatePatchReviewHudPanel(
  input: JarvisPatchReviewHudPanelInput,
): JarvisPatchReviewHudPanel {
  return {
    panelRef: input.panelRef,
    title: `Patch review ${input.reviewRef}`,
    moduleRef: input.moduleRef,
    safeSummary: input.safeSummary,
    changedPathCount: input.changedPaths.length,
    blockedPathCount: input.blockedPaths.length,
    validatorStatus: input.validatorStatus,
    reviewStatus: input.reviewStatus,
    visiblePaths: [...input.changedPaths, ...input.blockedPaths.map((path) => `blocked:${path}`)],
    panelMode: 'read_only_review',
  };
}
