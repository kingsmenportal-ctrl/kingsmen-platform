export const FREE_DESTINY_MAP_BACKEND_RUNTIME_BOUNDARY_MODULE =
  "BATCH 17 - Backend Runtime Integration Shell / Local API Service Boundary" as const;

export const FREE_DESTINY_MAP_BACKEND_RUNTIME_MODULE_PATH =
  "apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs" as const;

export const FREE_DESTINY_MAP_BACKEND_RUNTIME_HEALTH_ENDPOINT = "/health" as const;

export const FREE_DESTINY_MAP_BACKEND_RUNTIME_INTAKE_ENDPOINT =
  "/api/public/free-destiny-map/intake/local" as const;

export type FreeDestinyMapBackendRuntimeBoundaryStatus =
  | "BACKEND_RUNTIME_BOUNDARY_PROVEN"
  | "BACKEND_RUNTIME_BOUNDARY_FAILED";

export interface FreeDestinyMapBackendRuntimeBoundaryCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapBackendRuntimeBoundaryReport {
  schema: "kingsmen.backend-runtime-boundary-report.v1";
  module: typeof FREE_DESTINY_MAP_BACKEND_RUNTIME_BOUNDARY_MODULE;
  status: FreeDestinyMapBackendRuntimeBoundaryStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  serverStarted: boolean;
  serverStopped: boolean;
  healthStatus: number;
  intakeStatus: number;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapBackendRuntimeBoundaryCheck[];
  failed: FreeDestinyMapBackendRuntimeBoundaryCheck[];
  nextAction: string;
}
