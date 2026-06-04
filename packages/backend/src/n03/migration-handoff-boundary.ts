export function assertN03MigrationHandoffAllowed(input: {
  target: "local" | "staging" | "production";
  approvedByFounder?: boolean;
  reportPath?: string;
  dryRunCompleted?: boolean;
}) {
  if (input.target === "production") {
    throw new Error("Direct production migration is blocked at N03 handoff boundary");
  }

  if (input.approvedByFounder !== true) {
    throw new Error("Migration handoff requires founder approval");
  }

  if (!input.reportPath) {
    throw new Error("Migration handoff requires reportPath");
  }

  if (input.dryRunCompleted !== true) {
    throw new Error("Migration handoff requires dry run completion");
  }

  return true;
}

export function buildN03MigrationHandoff(input: {
  handoffId: string;
  target: "local" | "staging" | "production";
  approvedByFounder: boolean;
  reportPath: string;
  dryRunCompleted: boolean;
}) {
  assertN03MigrationHandoffAllowed(input);

  return {
    handoffId: input.handoffId,
    productionReady: false,
    decision: input.target === "local" ? "ready_for_local_migration_review" : "ready_for_staging_migration_review",
    directProductionMutationBlocked: true,
    migrationRequiresApproval: true,
    migrationRequiresReport: true,
    oracleLiteDisciplineRequired: true,
    approvedByFounder: input.approvedByFounder,
    reportPath: input.reportPath,
    createdAt: new Date().toISOString()
  } as const;
}