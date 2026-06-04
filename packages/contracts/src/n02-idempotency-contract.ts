export type KingsmenIdempotencyRecord = {
  idempotencyKey: string;
  commandType: string;
  actorId: string;
  correlationId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  status: "new" | "duplicate" | "completed" | "failed";
};