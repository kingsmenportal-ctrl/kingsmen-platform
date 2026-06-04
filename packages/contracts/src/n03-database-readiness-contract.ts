export type N03DatabaseReadinessReport = {
  schema: "kingsmen.n03-database-readiness.v1";
  productionReady: false;
  postgresIsTruth: true;
  coreSchemaDeclared: boolean;
  rlsBoundaryDeclared: boolean;
  statusTransitionGuardsPresent: boolean;
  caoParentChildPolicyPresent: boolean;
  sixGateVisibilityPolicyPresent: boolean;
  popiaAccessLogPolicyPresent: boolean;
  evidenceImmutabilityPolicyPresent: boolean;
  sourceAuthorityPolicyPresent: boolean;
  migrationHandoffRequired: true;
  checkedAt: string;
};