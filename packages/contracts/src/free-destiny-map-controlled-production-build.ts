export const FREE_DESTINY_MAP_CONTROLLED_PRODUCTION_BUILD_MODULE =
  "BATCH 16 - Controlled Production Build Proof" as const;

export const FREE_DESTINY_MAP_CONTROLLED_PRODUCTION_BUILD_WEB_PACKAGE =
  "apps/web/package.json" as const;

export const FREE_DESTINY_MAP_CONTROLLED_PRODUCTION_BUILD_OUTPUT =
  "apps/web/.next" as const;

export type FreeDestinyMapControlledProductionBuildStatus =
  | "CONTROLLED_PRODUCTION_BUILD_PROVEN"
  | "CONTROLLED_PRODUCTION_BUILD_FAILED";

export interface FreeDestinyMapControlledProductionBuildCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapControlledProductionBuildReport {
  schema: "kingsmen.controlled-production-build-report.v1";
  module: typeof FREE_DESTINY_MAP_CONTROLLED_PRODUCTION_BUILD_MODULE;
  status: FreeDestinyMapControlledProductionBuildStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  buildStarted: boolean;
  buildExited: boolean;
  buildExitCode: number | null;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapControlledProductionBuildCheck[];
  failed: FreeDestinyMapControlledProductionBuildCheck[];
  nextAction: string;
}
