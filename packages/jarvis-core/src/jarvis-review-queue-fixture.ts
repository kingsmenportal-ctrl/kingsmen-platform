export type JarvisReviewQueueFixtureItem = {
  readonly reviewRef: string;
  readonly title: string;
  readonly status: 'waiting' | 'accepted' | 'declined' | 'expired';
  readonly scopeSummary: string;
};

export const jarvisCreateReviewQueueFixture = (): JarvisReviewQueueFixtureItem[] => [
  {
    reviewRef: 'jarvis-review-fixture-001',
    title: 'Review pending Jarvis patch plan',
    status: 'waiting',
    scopeSummary: 'Fixture item for founder review queue rendering only.',
  },
];
