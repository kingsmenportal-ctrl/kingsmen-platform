export const FREE_DESTINY_MAP_CONTROLLED_WEB_API_INTEGRATION_MODULE =
  "BATCH 15B - Controlled Local Web + Local API Integration Proof" as const;

export const FREE_DESTINY_MAP_CONTROLLED_WEB_API_ROUTE =
  "/free-destiny-map" as const;

export const FREE_DESTINY_MAP_CONTROLLED_LOCAL_API_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export const FREE_DESTINY_MAP_CONTROLLED_NEXT_ROUTE_HANDLER =
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts" as const;

export type FreeDestinyMapControlledWebApiIntegrationStatus =
  | "CONTROLLED_WEB_API_INTEGRATION_PROVEN"
  | "CONTROLLED_WEB_API_INTEGRATION_FAILED";

export interface FreeDestinyMapControlledWebApiIntegrationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapControlledWebApiIntegrationReport {
  schema: "kingsmen.controlled-web-api-integration-report.v1";
  module: typeof FREE_DESTINY_MAP_CONTROLLED_WEB_API_INTEGRATION_MODULE;
  status: FreeDestinyMapControlledWebApiIntegrationStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  serverStarted: boolean;
  serverStopped: boolean;
  webStatus: number;
  apiStatus: number;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapControlledWebApiIntegrationCheck[];
  failed: FreeDestinyMapControlledWebApiIntegrationCheck[];
  nextAction: string;
}
