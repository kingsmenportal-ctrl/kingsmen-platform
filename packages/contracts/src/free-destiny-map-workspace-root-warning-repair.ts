export const FREE_DESTINY_MAP_WORKSPACE_ROOT_WARNING_REPAIR_MODULE =
  "BATCH 15A - Workspace Root / Lockfile Warning Repair" as const;

export const FREE_DESTINY_MAP_WORKSPACE_ROOT_WARNING_REPAIR_CONFIG =
  "apps/web/next.config.mjs" as const;

export type FreeDestinyMapWorkspaceRootWarningRepairStatus =
  | "WORKSPACE_ROOT_WARNING_REPAIR_APPLIED"
  | "WORKSPACE_ROOT_WARNING_REPAIR_BLOCKED";

export interface FreeDestinyMapWorkspaceRootWarningRepairCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapWorkspaceRootWarningRepairReport {
  schema: "kingsmen.workspace-root-warning-repair-report.v1";
  module: typeof FREE_DESTINY_MAP_WORKSPACE_ROOT_WARNING_REPAIR_MODULE;
  status: FreeDestinyMapWorkspaceRootWarningRepairStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapWorkspaceRootWarningRepairCheck[];
  failed: FreeDestinyMapWorkspaceRootWarningRepairCheck[];
  nextAction: string;
}
