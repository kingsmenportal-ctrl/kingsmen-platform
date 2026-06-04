export type KingsmenKernelHealth = {
  schema: "kingsmen.n02-health.v1";
  ok: boolean;
  productionReady: false;
  constitutionLoaded: boolean;
  commandPolicyGuardPresent: boolean;
  idempotencyBoundaryPresent: boolean;
  auditBoundaryPresent: boolean;
  queueBoundaryPresent: boolean;
  publicSafe: true;
  secretsIncluded: false;
  checkedAt: string;
};