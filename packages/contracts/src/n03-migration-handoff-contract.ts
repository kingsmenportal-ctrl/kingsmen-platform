export type N03MigrationHandoffDecision =
  | "blocked"
  | "ready_for_local_migration_review"
  | "ready_for_staging_migration_review"
  | "requires_founder_approval"
  | "do_not_apply_to_production";

export type N03MigrationHandoff = {
  handoffId: string;
  productionReady: false;
  decision: N03MigrationHandoffDecision;
  directProductionMutationBlocked: true;
  migrationRequiresApproval: true;
  migrationRequiresReport: true;
  oracleLiteDisciplineRequired: true;
  approvedByFounder: boolean;
  reportPath: string;
  createdAt: string;
};