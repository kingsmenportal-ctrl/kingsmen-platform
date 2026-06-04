export type N08QueueHealth = {
  queueName: string;
  waiting: number;
  active: number;
  failed: number;
  deadLettered: number;
  oldestWaitingAgeMinutes: number;
  oracleLiteSafe: boolean;
  stopSellingRecommended: boolean;
  founderReviewRequired: boolean;
  productionReady: false;
};

export type N08ProviderHealthSummary = {
  provider: string;
  configured: boolean;
  verified: boolean;
  degraded: boolean;
  liveClaimAllowed: false;
  productionReady: false;
};