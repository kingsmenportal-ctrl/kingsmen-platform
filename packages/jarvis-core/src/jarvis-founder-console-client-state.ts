export type JarvisFounderConsoleClientState = {
  readonly consoleRef: string;
  readonly activePanel: 'overview' | 'sessions' | 'reviewQueue' | 'validationReports';
  readonly lastSyncedAtIso: string;
  readonly unreadReviewCount: number;
  readonly failingValidatorCount: number;
  readonly notice: string;
};

export const jarvisCreateFounderConsoleClientState = (
  input: JarvisFounderConsoleClientState,
): JarvisFounderConsoleClientState => ({
  consoleRef: input.consoleRef,
  activePanel: input.activePanel,
  lastSyncedAtIso: input.lastSyncedAtIso,
  unreadReviewCount: Math.max(0, input.unreadReviewCount),
  failingValidatorCount: Math.max(0, input.failingValidatorCount),
  notice: input.notice,
});
