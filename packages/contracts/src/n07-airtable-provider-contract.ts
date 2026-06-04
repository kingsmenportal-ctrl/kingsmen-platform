export type N07AirtableProviderStatus =
  | "not_configured"
  | "configured_unverified"
  | "verified"
  | "degraded"
  | "disabled";

export type N07AirtableProviderGate = {
  provider: "airtable";
  status: N07AirtableProviderStatus;
  hasApiKey: boolean;
  hasBaseMap: boolean;
  liveClaimAllowed: false;
  missingCredentialsDegradeGracefully: true;
  productionReady: false;
};

export type N07AirtableMirrorEnvelope = {
  mirrorJobId: string;
  sourceTable: string;
  sourceRecordId: string;
  targetBaseName: string;
  targetTableName: string;
  operation: "upsert" | "archive" | "health_check";
  postgresTruthPreserved: true;
  airtableMirrorOnly: true;
  productionReady: false;
};