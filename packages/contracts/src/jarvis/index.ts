export type JarvisChannel =
  | 'hud'
  | 'voice'
  | 'github'
  | 'email'
  | 'whatsapp_urgent'
  | 'n8n'
  | 'airtable'
  | 'supabase'
  | 'local_terminal'
  | 'browser_scout'
  | 'system';

export type JarvisMode =
  | 'safe_chat_mode'
  | 'controlled_command_mode'
  | 'builder_mode'
  | 'research_mode'
  | 'connector_dry_run_mode'
  | 'diagnostic_repair_mode'
  | 'production_approval_mode';

export type JarvisAuthorityLevel =
  | 'LEVEL_1_READ_ONLY'
  | 'LEVEL_2_GENERATE_FILES'
  | 'LEVEL_3_TEST_VALIDATE'
  | 'LEVEL_4_STAGING_DEPLOY'
  | 'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED';

export type JarvisToolTrustLevel =
  | 'TRUST_0_UNKNOWN'
  | 'TRUST_1_READ_ONLY'
  | 'TRUST_2_DRY_RUN'
  | 'TRUST_3_STAGING_WRITE'
  | 'TRUST_4_PRODUCTION_APPROVAL_REQUIRED'
  | 'TRUST_5_BLOCKED';

export type JarvisActionRisk =
  | 'LOW_INFORMATIONAL'
  | 'MEDIUM_REPO_WRITE'
  | 'MEDIUM_LOCAL_EXECUTION'
  | 'HIGH_CONNECTOR_WRITE'
  | 'HIGH_PRODUCTION_RISK'
  | 'BLOCKED_UNSAFE';

export type JarvisDecision = 'ALLOW' | 'DRY_RUN_ONLY' | 'APPROVAL_REQUIRED' | 'BLOCK';

export interface JarvisActorRef {
  readonly actorType: 'founder' | 'operator' | 'system' | 'validator' | 'worker';
  readonly actorRef: string;
}

export interface JarvisCommandEnvelope {
  readonly commandRef: string;
  readonly tenantRef: string;
  readonly correlationId: string;
  readonly requestId: string;
  readonly channel: JarvisChannel;
  readonly mode: JarvisMode;
  readonly actor: JarvisActorRef;
  readonly commandTextSafe: string;
  readonly intendedAction: string;
  readonly targetRefs: readonly string[];
  readonly requestedAuthorityLevel: JarvisAuthorityLevel;
  readonly evidenceRefs?: readonly string[];
  readonly founderApprovalRef?: string;
}

export interface JarvisToolCapabilityCard {
  readonly toolRef: string;
  readonly displayName: string;
  readonly trustLevel: JarvisToolTrustLevel;
  readonly allowedModes: readonly JarvisMode[];
  readonly allowedChannels: readonly JarvisChannel[];
  readonly authorityCeiling: JarvisAuthorityLevel;
  readonly productionWriteCapable: boolean;
  readonly candidateDataCapable: boolean;
  readonly secretsCapable: boolean;
  readonly requiresEvidenceLedger: boolean;
}

export interface JarvisPolicyDecision {
  readonly decision: JarvisDecision;
  readonly risk: JarvisActionRisk;
  readonly reasonCode: string;
  readonly safeReason: string;
  readonly approvalRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly allowedAuthorityLevel: JarvisAuthorityLevel;
}

export interface JarvisEvidenceEvent {
  readonly eventRef: string;
  readonly commandRef: string;
  readonly correlationId: string;
  readonly eventType:
    | 'command_received'
    | 'policy_decision'
    | 'tool_invocation_planned'
    | 'tool_invocation_result'
    | 'validator_result'
    | 'approval_recorded'
    | 'blocked';
  readonly safeSummary: string;
  readonly createdAtIso: string;
}

export const JARVIS_DEFAULT_AUTHORITY_LEVEL: JarvisAuthorityLevel = 'LEVEL_3_TEST_VALIDATE';

export const JARVIS_PRODUCTION_AUTHORITY_LEVEL: JarvisAuthorityLevel =
  'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED';

export const JARVIS_LOCKED_MODES: readonly JarvisMode[] = [
  'safe_chat_mode',
  'controlled_command_mode',
  'builder_mode',
  'research_mode',
  'connector_dry_run_mode',
  'diagnostic_repair_mode',
  'production_approval_mode'
];

export function jarvisMakeRef(prefix: string, value: string): string {
  const safePrefix = prefix.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeValue = value.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safePrefix}_${safeValue}`.slice(0, 180);
}
