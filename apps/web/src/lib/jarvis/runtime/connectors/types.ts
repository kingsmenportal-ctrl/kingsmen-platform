export type JarvisConnectorId =
  | 'web_research'
  | 'github_repo'
  | 'system_health'
  | 'build_validation'
  | 'postgres_read_model'
  | 'playwright_scout'
  | 'utility_api'
  | 'knowledge_search'
  | 'evidence_ledger'
  | 'blocked_manual_review';

export type JarvisConnectorStatus = 'success' | 'review' | 'blocked' | 'failed';

export type JarvisConnectorRequest = {
  connectorId: JarvisConnectorId;
  adapterId: string;
  intentId: string;
  commandId: string;
  need: string;
  query?: string;
  payload?: Record<string, unknown>;
};

export type JarvisConnectorResult = {
  connectorId: JarvisConnectorId;
  adapterId: string;
  status: JarvisConnectorStatus;
  summary: string;
  sourceRefs: string[];
  confidenceBand: string;
  checkedAt: string;
  failureReason?: string;
  nextSafeAction: string;
};

export type JarvisConnectorDefinition = {
  connectorId: JarvisConnectorId;
  label: string;
  adapterId: string;
  readOnly: boolean;
  liveData: boolean;
  requiresSourceConfidence: boolean;
  requiresEvidence: boolean;
  defaultFailure: string;
};
