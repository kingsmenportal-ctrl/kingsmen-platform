export interface JarvisConsoleViewModelFixture {
  readonly title: 'Kingsmen Jarvis Founder Console';
  readonly status: 'ready';
  readonly activeSessionCount: number;
  readonly pendingReviewCount: number;
  readonly latestValidatorStatus: 'pass';
  readonly panels: readonly string[];
}

export function jarvisConsoleViewModelFixture(): JarvisConsoleViewModelFixture {
  return {
    title: 'Kingsmen Jarvis Founder Console',
    status: 'ready',
    activeSessionCount: 1,
    pendingReviewCount: 1,
    latestValidatorStatus: 'pass',
    panels: ['hud', 'sessions', 'reviews', 'validators'],
  };
}
