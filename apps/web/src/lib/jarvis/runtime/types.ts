export type JarvisActor = 'commander' | 'founder_operator' | 'blocked_actor';

export type JarvisRiskLevel =
  | 'safe_read'
  | 'safe_generate'
  | 'review_required'
  | 'approval_required'
  | 'blocked';

export type JarvisIntentId =
  | 'general_dialogue'
  | 'live_research'
  | 'kingsmen_knowledge'
  | 'repo_inspection'
  | 'public_repo_integration'
  | 'system_health'
  | 'validation_build'
  | 'database_read_model'
  | 'playwright_scout'
  | 'report_generation'
  | 'approval_flow'
  | 'visual_hud_request'
  | 'blocked_unsafe_action';

export type JarvisConfidence = 'high' | 'medium' | 'low' | 'blocked';

export type JarvisSourceConfidenceBand =
  | 'verified_official'
  | 'high_trusted_recent'
  | 'medium_needs_review'
  | 'low_unverified_or_stale'
  | 'blocked_or_unsafe';

export type JarvisCommandId =
  | 'ASK_GENERAL'
  | 'LIVE_RESEARCH'
  | 'SEARCH_KINGSMEN_KNOWLEDGE'
  | 'GITHUB_REPO_INSPECT'
  | 'PUBLIC_REPO_INTEGRATION_BOARD'
  | 'SYSTEM_STATUS'
  | 'VALIDATE_PHASE'
  | 'RUN_WEB_BUILD'
  | 'POSTGRES_READ_MODEL_SCAN'
  | 'PLAYWRIGHT_PORTAL_HEALTH'
  | 'GENERATE_FOUNDER_DIGEST'
  | 'GENERATE_EVIDENCE_PACK'
  | 'REQUEST_APPROVAL'
  | 'SEND_EXTERNAL_MESSAGE'
  | 'MAKE_PAYMENT_DECISION'
  | 'SUBMIT_OFFICIAL_APPLICATION_SILENTLY'
  | 'BLOCKED_UNKNOWN_COMMAND';

export interface JarvisRuntimeRequest {
  input: string;
  actor: JarvisActor;
  nowIso?: string;
  approvalToken?: string;
}

export interface JarvisIntentResult {
  intentId: JarvisIntentId;
  confidence: JarvisConfidence;
  freshnessRequired: boolean;
  policyGateRequired: boolean;
  reason: string;
}

export interface JarvisCommandDefinition {
  commandId: JarvisCommandId;
  label: string;
  category: string;
  riskLevel: JarvisRiskLevel;
  approvalRequired: boolean;
  evidenceRequired: boolean;
  adapterId: string;
  blockedReason?: string;
}

export interface JarvisPolicyDecision {
  allowed: boolean;
  riskLevel: JarvisRiskLevel;
  approvalRequired: boolean;
  reason: string;
}

export interface JarvisToolRoute {
  adapterId: string;
  allowed: boolean;
  reason: string;
  outputSurfaces: string[];
}

export interface JarvisSourceConfidenceDecision {
  band: JarvisSourceConfidenceBand;
  mayAnswerConfidently: boolean;
  mayTriggerAction: boolean;
  requiresReview: boolean;
  reason: string;
}

export interface JarvisEvidenceEntry {
  evidenceId: string;
  timestamp: string;
  actor: JarvisActor;
  intentId: JarvisIntentId;
  commandId: JarvisCommandId;
  adapterId: string;
  riskLevel: JarvisRiskLevel;
  sourceConfidenceBand: JarvisSourceConfidenceBand;
  resultSummary: string;
  nextSafeAction: string;
}

export interface JarvisRuntimeResult {
  ok: boolean;
  answer: string;
  intent: JarvisIntentResult;
  command: JarvisCommandDefinition;
  policy: JarvisPolicyDecision;
  toolRoute: JarvisToolRoute;
  sourceConfidence: JarvisSourceConfidenceDecision;
  evidence: JarvisEvidenceEntry;
}
