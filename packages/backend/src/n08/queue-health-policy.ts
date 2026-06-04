export const N08_ORACLE_LITE_QUEUE_LIMITS = {
  maxWaiting: 500,
  maxActive: 25,
  maxFailed: 50,
  maxDeadLettered: 10,
  maxOldestWaitingAgeMinutes: 120,
  productionReady: false
} as const;

export function buildN08QueueHealth(input: {
  queueName: string;
  waiting: number;
  active: number;
  failed: number;
  deadLettered: number;
  oldestWaitingAgeMinutes: number;
}) {
  const oracleLiteSafe =
    input.waiting <= N08_ORACLE_LITE_QUEUE_LIMITS.maxWaiting &&
    input.active <= N08_ORACLE_LITE_QUEUE_LIMITS.maxActive &&
    input.failed <= N08_ORACLE_LITE_QUEUE_LIMITS.maxFailed &&
    input.deadLettered <= N08_ORACLE_LITE_QUEUE_LIMITS.maxDeadLettered &&
    input.oldestWaitingAgeMinutes <= N08_ORACLE_LITE_QUEUE_LIMITS.maxOldestWaitingAgeMinutes;

  const stopSellingRecommended =
    input.waiting > N08_ORACLE_LITE_QUEUE_LIMITS.maxWaiting ||
    input.deadLettered > N08_ORACLE_LITE_QUEUE_LIMITS.maxDeadLettered;

  return {
    queueName: input.queueName,
    waiting: input.waiting,
    active: input.active,
    failed: input.failed,
    deadLettered: input.deadLettered,
    oldestWaitingAgeMinutes: input.oldestWaitingAgeMinutes,
    oracleLiteSafe,
    stopSellingRecommended,
    founderReviewRequired: !oracleLiteSafe || stopSellingRecommended,
    productionReady: false
  } as const;
}