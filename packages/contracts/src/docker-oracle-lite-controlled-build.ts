export const DOCKER_ORACLE_LITE_CONTROLLED_BUILD_MODULE =
  "BATCH 20 - Controlled Docker Local Build Proof" as const;

export const DOCKER_ORACLE_LITE_CONTROLLED_BUILD_WEB_IMAGE =
  "kingsmen/web:oracle-lite-local" as const;

export const DOCKER_ORACLE_LITE_CONTROLLED_BUILD_API_IMAGE =
  "kingsmen/api:oracle-lite-local" as const;

export type DockerOracleLiteControlledBuildStatus =
  | "DOCKER_LOCAL_BUILD_PROVEN"
  | "DOCKER_LOCAL_BUILD_UNAVAILABLE"
  | "DOCKER_LOCAL_BUILD_FAILED";

export interface DockerOracleLiteControlledBuildCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface DockerOracleLiteControlledBuildReport {
  schema: "kingsmen.docker-oracle-lite-controlled-build-report.v1";
  module: typeof DOCKER_ORACLE_LITE_CONTROLLED_BUILD_MODULE;
  status: DockerOracleLiteControlledBuildStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  dockerAvailable: boolean;
  dockerBuildsAttempted: boolean;
  dockerBuildsSucceeded: boolean;
  dockerRunsInThisBatch: false;
  composeUpInThisBatch: false;
  oracleLiteImpact: "controlled_local_docker_build_only";
  checks: DockerOracleLiteControlledBuildCheck[];
  failed: DockerOracleLiteControlledBuildCheck[];
  nextAction: string;
}
