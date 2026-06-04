export const N03_DATABASE_READINESS_POLICY = {
  productionReady: false,
  postgresIsTruth: true,
  schemaDeclaredNotAutoApplied: true,
  directProductionMutationBlocked: true,
  migrationRequiresApproval: true,
  migrationRequiresReport: true,
  oracleLiteDisciplineRequired: true
} as const;

export function assertN03DatabaseReadinessPolicySafe() {
  if (N03_DATABASE_READINESS_POLICY.productionReady !== false) {
    throw new Error("N03 database readiness cannot claim productionReady=true");
  }

  if (N03_DATABASE_READINESS_POLICY.directProductionMutationBlocked !== true) {
    throw new Error("Direct production mutation must remain blocked");
  }

  return true;
}