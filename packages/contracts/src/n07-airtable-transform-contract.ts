export type N07AirtableMirrorTransformInput = {
  baseName: string;
  tableName: string;
  sourceEntityType: string;
  sourceEntityId: string;
  payload: Record<string, unknown>;
};

export type N07AirtableMirrorTransformOutput = {
  baseName: string;
  tableName: string;
  sourceEntityType: string;
  sourceEntityId: string;
  payload: Record<string, unknown>;
  strippedFields: string[];
  mirrorOnly: true;
  canGovernTruth: false;
  productionReady: false;
};

export type N07AirtableProviderHealthReadModel = {
  provider: "airtable";
  configured: boolean;
  verifiedHealthCheck: boolean;
  degraded: boolean;
  lastCheckedAt?: string;
  liveProviderClaimAllowed: false;
  productionReady: false;
};