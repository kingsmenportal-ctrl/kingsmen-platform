export const DOCKER_ORACLE_LITE_CONTROLLED_RUNTIME_MODULE =
  "BATCH 21 - Controlled Docker Local Runtime Proof" as const;

export const DOCKER_ORACLE_LITE_CONTROLLED_RUNTIME_WEB_URL =
  "http://127.0.0.1:3000/free-destiny-map" as const;

export const DOCKER_ORACLE_LITE_CONTROLLED_RUNTIME_API_HEALTH_URL =
  "http://127.0.0.1:3001/health" as const;

export const DOCKER_ORACLE_LITE_CONTROLLED_RUNTIME_BRIDGE_URL =
  "http://127.0.0.1:3000/api/public/free-destiny-map/intake/local" as const;

export type DockerOracleLiteControlledRuntimeStatus =
  | "DOCKER_LOCAL_RUNTIME_PROVEN"
  | "DOCKER_LOCAL_RUNTIME_FAILED";

export interface DockerOracleLiteControlledRuntimeCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface DockerOracleLiteControlledRuntimeReport {
  schema: "kingsmen.docker-oracle-lite-controlled-runtime-report.v1";
  module: typeof DOCKER_ORACLE_LITE_CONTROLLED_RUNTIME_MODULE;
  status: DockerOracleLiteControlledRuntimeStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  dockerRunsInThisBatch: true;
  dockerBuildsInThisBatch: false;
  composeUpInThisBatch: true;
  composeDownInThisBatch: true;
  composeUpSucceeded: boolean;
  composeDownSucceeded: boolean;
  apiHealthStatus: number;
  webStatus: number;
  bridgeApiStatus: number;
  oracleLiteImpact: "controlled_local_docker_runtime_only";
  checks: DockerOracleLiteControlledRuntimeCheck[];
  failed: DockerOracleLiteControlledRuntimeCheck[];
  nextAction: string;
}
