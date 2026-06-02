export const FREE_DESTINY_MAP_NEXT_BACKEND_BRIDGE_MODULE =
  "BATCH 18 - Controlled Next-to-Backend Bridge Proof" as const;

export const FREE_DESTINY_MAP_NEXT_BACKEND_BRIDGE_NEXT_API_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export const FREE_DESTINY_MAP_NEXT_BACKEND_BRIDGE_BACKEND_HEALTH_ENDPOINT =
  "/health" as const;

export const FREE_DESTINY_MAP_NEXT_BACKEND_BRIDGE_BACKEND_INTAKE_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export type FreeDestinyMapNextBackendBridgeStatus =
  | "NEXT_BACKEND_BRIDGE_PROVEN"
  | "NEXT_BACKEND_BRIDGE_FAILED";

export interface FreeDestinyMapNextBackendBridgeCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapNextBackendBridgeReport {
  schema: "kingsmen.next-backend-bridge-report.v1";
  module: typeof FREE_DESTINY_MAP_NEXT_BACKEND_BRIDGE_MODULE;
  status: FreeDestinyMapNextBackendBridgeStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  nextServerStarted: boolean;
  nextServerStopped: boolean;
  backendServerStarted: boolean;
  backendServerStopped: boolean;
  webStatus: number;
  backendHealthStatus: number;
  bridgeApiStatus: number;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapNextBackendBridgeCheck[];
  failed: FreeDestinyMapNextBackendBridgeCheck[];
  nextAction: string;
}
