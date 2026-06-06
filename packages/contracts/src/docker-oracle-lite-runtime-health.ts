export type DockerOracleLiteRuntimeHealthCycle = {
  cycle: number;
  composeUpSucceeded: boolean;
  composeDownSucceeded: boolean;
  apiHealthStatus: number;
  webStatus: number;
  apiProductionReady: boolean | null;
  apiCanClaimProduction: boolean | null;
  apiDeployedToOracle: boolean | null;
  apiLogCaptured: boolean;
  webLogCaptured: boolean;
  portsReleasedAfterDown: boolean;
};

export type DockerOracleLiteRuntimeHealthHardeningReport = {
  schema: "kingsmen.docker-oracle-lite-runtime-health-hardening-report.v1";
  module: "BATCH 22 - Docker Oracle Lite Runtime Health Hardening";
  status: "DOCKER_RUNTIME_HEALTH_HARDENED_LOCAL" | "DOCKER_RUNTIME_HEALTH_HARDENING_FAILED";
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  deployedToOracle: false;
  runtimeScope: "controlled_local_docker_runtime_health_only";
  cycles: DockerOracleLiteRuntimeHealthCycle[];
  failed: Array<{ name: string; passed: false; detail: string }>;
};
