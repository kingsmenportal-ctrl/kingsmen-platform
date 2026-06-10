import { AIRTABLE_BASE_REGISTRY } from "./airtable-base-registry";

export interface AirtableRuntimeHealth {
  configuredBases: number;
  missingBaseEnvVars: string[];
  hasApiKey: boolean;
  readyForMirrorWrites: boolean;
}

export function checkAirtableRuntimeHealth(env: NodeJS.ProcessEnv = process.env): AirtableRuntimeHealth {
  const missingBaseEnvVars = AIRTABLE_BASE_REGISTRY
    .map((base) => base.envVar)
    .filter((envVar) => !env[envVar]);

  const hasApiKey = Boolean(env.AIRTABLE_API_KEY);

  return {
    configuredBases: AIRTABLE_BASE_REGISTRY.length - missingBaseEnvVars.length,
    missingBaseEnvVars,
    hasApiKey,
    readyForMirrorWrites: hasApiKey && missingBaseEnvVars.length === 0
  };
}