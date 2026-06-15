export type JarvisFounderConsolePageSection = {
  readonly sectionRef: string;
  readonly title: string;
  readonly safeSummary: string;
  readonly status: 'empty' | 'ready' | 'attention' | 'blocked';
  readonly itemCount: number;
};

export type JarvisFounderConsolePageShellInput = {
  readonly pageRef: string;
  readonly founderRef: string;
  readonly generatedAt: string;
  readonly activeSessionCount: number;
  readonly pendingReviewCount: number;
  readonly failingValidatorCount: number;
  readonly sections: readonly JarvisFounderConsolePageSection[];
};

export type JarvisFounderConsolePageShell = {
  readonly pageRef: string;
  readonly founderRef: string;
  readonly generatedAt: string;
  readonly title: 'Kingsmen Jarvis Founder Console';
  readonly mode: 'read_only_console';
  readonly headline: string;
  readonly badges: readonly string[];
  readonly sections: readonly JarvisFounderConsolePageSection[];
  readonly safeNextAction: string;
};

export function jarvisCreateFounderConsolePageShell(
  input: JarvisFounderConsolePageShellInput,
): JarvisFounderConsolePageShell {
  const attentionCount = input.pendingReviewCount + input.failingValidatorCount;
  return {
    pageRef: input.pageRef,
    founderRef: input.founderRef,
    generatedAt: input.generatedAt,
    title: 'Kingsmen Jarvis Founder Console',
    mode: 'read_only_console',
    headline: attentionCount > 0 ? 'Founder attention required' : 'Jarvis live build surface ready',
    badges: [
      `sessions:${input.activeSessionCount}`,
      `reviews:${input.pendingReviewCount}`,
      `validator_failures:${input.failingValidatorCount}`,
    ],
    sections: input.sections,
    safeNextAction:
      attentionCount > 0
        ? 'Review highlighted items before any risky action.'
        : 'Continue with the next scoped Jarvis build pass.',
  };
}

export const JARVIS_FOUNDER_CONSOLE_PAGE_SHELL_LIVE = true;
