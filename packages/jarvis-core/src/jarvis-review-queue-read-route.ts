export type JarvisReviewQueueReadItem = {
  readonly reviewRef: string;
  readonly sessionRef: string;
  readonly moduleRef: string;
  readonly reviewKind: 'patch' | 'scope' | 'validation' | 'production_boundary';
  readonly status: 'waiting' | 'accepted' | 'returned' | 'blocked';
  readonly safeSummary: string;
  readonly updatedAt: string;
};

export type JarvisReviewQueueReadRouteInput = {
  readonly routeRef: string;
  readonly founderRef: string;
  readonly items: readonly JarvisReviewQueueReadItem[];
};

export type JarvisReviewQueueReadRoute = {
  readonly routeRef: string;
  readonly founderRef: string;
  readonly mode: 'read_only_review_queue';
  readonly waitingCount: number;
  readonly blockedCount: number;
  readonly items: readonly JarvisReviewQueueReadItem[];
};

export function jarvisCreateReviewQueueReadRoute(
  input: JarvisReviewQueueReadRouteInput,
): JarvisReviewQueueReadRoute {
  const items = [...input.items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return {
    routeRef: input.routeRef,
    founderRef: input.founderRef,
    mode: 'read_only_review_queue',
    waitingCount: items.filter((item) => item.status === 'waiting').length,
    blockedCount: items.filter((item) => item.status === 'blocked').length,
    items,
  };
}

export const JARVIS_REVIEW_QUEUE_READ_ROUTE_LIVE = true;
