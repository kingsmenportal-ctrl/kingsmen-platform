import fs from "node:fs";

export function buildN03DatabaseReadinessReport() {
  return {
    schema: "kingsmen.n03-database-readiness.v1",
    productionReady: false,
    postgresIsTruth: true,
    coreSchemaDeclared: fs.existsSync("packages/db/src/n03-core-schema.sql"),
    rlsBoundaryDeclared: fs.existsSync("packages/db/src/n03-rls-boundary-policy.ts"),
    statusTransitionGuardsPresent: fs.existsSync("packages/backend/src/n03/status-transition-guard.ts"),
    caoParentChildPolicyPresent: fs.existsSync("packages/backend/src/n03/cao-parent-child-policy.ts"),
    sixGateVisibilityPolicyPresent: fs.existsSync("packages/backend/src/n03/six-gate-visibility-policy.ts"),
    popiaAccessLogPolicyPresent: fs.existsSync("packages/backend/src/n03/popia-access-log-policy.ts"),
    evidenceImmutabilityPolicyPresent: fs.existsSync("packages/backend/src/n03/evidence-immutability-policy.ts"),
    sourceAuthorityPolicyPresent: fs.existsSync("packages/backend/src/n03/source-authority-policy.ts"),
    migrationHandoffRequired: true,
    checkedAt: new Date().toISOString()
  } as const;
}