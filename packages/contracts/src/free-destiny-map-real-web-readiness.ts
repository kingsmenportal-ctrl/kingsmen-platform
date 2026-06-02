export const FREE_DESTINY_MAP_REAL_WEB_READINESS_MODULE =
  "BATCH 12 - Real Local Web Build / Dev-Server Readiness Gate" as const;

export const FREE_DESTINY_MAP_REAL_WEB_READINESS_WEB_ROUTE = "/free-destiny-map" as const;

export const FREE_DESTINY_MAP_REAL_WEB_READINESS_API_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export type FreeDestinyMapReadinessStatus =
  | "READY_FOR_CONTROLLED_LOCAL_BOOT"
  | "BLOCKED_WITH_REPAIR_ACTIONS";

export interface FreeDestinyMapRealWebReadinessCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapRealWebReadinessReport {
  schema: "kingsmen.real-web-readiness-report.v1";
  module: typeof FREE_DESTINY_MAP_REAL_WEB_READINESS_MODULE;
  status: FreeDestinyMapReadinessStatus;
  passed: boolean;
  productionReady: false;
  canAttemptLocalWebBoot: boolean;
  canClaimProduction: false;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapRealWebReadinessCheck[];
  blockers: FreeDestinyMapRealWebReadinessCheck[];
  nextAction: string;
}
