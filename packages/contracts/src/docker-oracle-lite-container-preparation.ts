export const DOCKER_ORACLE_LITE_CONTAINER_PREPARATION_MODULE =
  "BATCH 19 - Docker / Oracle Lite Local Runtime Container Preparation" as const;

export const DOCKER_ORACLE_LITE_WEB_DOCKERFILE =
  "apps/web/Dockerfile.oracle-lite" as const;

export const DOCKER_ORACLE_LITE_API_DOCKERFILE =
  "apps/api/Dockerfile.oracle-lite" as const;

export const DOCKER_ORACLE_LITE_COMPOSE_FILE =
  "docker/oracle-lite/docker-compose.local.yml" as const;

export type DockerOracleLiteContainerPreparationStatus =
  | "DOCKER_ORACLE_LITE_CONTAINER_PREPARED"
  | "DOCKER_ORACLE_LITE_CONTAINER_PREPARATION_FAILED";

export interface DockerOracleLiteContainerPreparationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface DockerOracleLiteContainerPreparationReport {
  schema: "kingsmen.docker-oracle-lite-container-preparation-report.v1";
  module: typeof DOCKER_ORACLE_LITE_CONTAINER_PREPARATION_MODULE;
  status: DockerOracleLiteContainerPreparationStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  dockerRunsInThisBatch: false;
  dockerBuildsInThisBatch: false;
  composeUpInThisBatch: false;
  oracleLiteImpact: "container_preparation_only";
  checks: DockerOracleLiteContainerPreparationCheck[];
  failed: DockerOracleLiteContainerPreparationCheck[];
  nextAction: string;
}
