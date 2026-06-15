export type JarvisFounderConsoleCard = {
  readonly cardRef: string;
  readonly title: string;
  readonly status: 'ok' | 'attention' | 'blocked' | 'complete';
  readonly summary: string;
  readonly actionLabel?: string;
};

export type JarvisFounderConsoleReadModel = {
  readonly consoleRef: string;
  readonly founderRef: string;
  readonly activeSessionCount: number;
  readonly reviewRequiredCount: number;
  readonly blockedCount: number;
  readonly validatorFailureCount: number;
  readonly cards: readonly JarvisFounderConsoleCard[];
};

export function jarvisCreateFounderConsoleReadModel(input: {
  readonly consoleRef: string;
  readonly founderRef: string;
  readonly cards: readonly JarvisFounderConsoleCard[];
}): JarvisFounderConsoleReadModel {
  const reviewRequiredCount = input.cards.filter((card) => card.status === 'attention').length;
  const blockedCount = input.cards.filter((card) => card.status === 'blocked').length;
  const validatorFailureCount = input.cards.filter((card) => card.title.toLowerCase().includes('validator') && card.status !== 'ok').length;

  return {
    consoleRef: input.consoleRef,
    founderRef: input.founderRef,
    activeSessionCount: input.cards.length,
    reviewRequiredCount,
    blockedCount,
    validatorFailureCount,
    cards: input.cards
  };
}

export const JARVIS_FOUNDER_CONSOLE_READ_MODEL_LIVE = true;
