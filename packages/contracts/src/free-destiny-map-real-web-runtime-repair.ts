export const FREE_DESTINY_MAP_REAL_WEB_RUNTIME_REPAIR_MODULE =
  "BATCH 13 - Repair Real Web Build Blockers / Add Next App Package Runtime" as const;

export const FREE_DESTINY_MAP_REAL_WEB_RUNTIME_REPAIR_PACKAGE =
  "apps/web/package.json" as const;

export type FreeDestinyMapRuntimeRepairStatus =
  | "WEB_RUNTIME_REPAIR_APPLIED"
  | "WEB_RUNTIME_REPAIR_BLOCKED";

export interface FreeDestinyMapRuntimeRepairCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapRuntimeRepairReport {
  schema: "kingsmen.real-web-runtime-repair-report.v1";
  module: typeof FREE_DESTINY_MAP_REAL_WEB_RUNTIME_REPAIR_MODULE;
  status: FreeDestinyMapRuntimeRepairStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  canAttemptNextControlledBoot: boolean;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapRuntimeRepairCheck[];
  failed: FreeDestinyMapRuntimeRepairCheck[];
  nextAction: string;
}
