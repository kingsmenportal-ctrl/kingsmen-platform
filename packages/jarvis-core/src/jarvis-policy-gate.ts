import type {
  JarvisActionRisk,
  JarvisAuthorityLevel,
  JarvisCommandEnvelope,
  JarvisDecision,
  JarvisPolicyDecision,
  JarvisToolCapabilityCard
} from '../../contracts/src/jarvis';

const AUTHORITY_RANK: Record<JarvisAuthorityLevel, number> = {
  LEVEL_1_READ_ONLY: 1,
  LEVEL_2_GENERATE_FILES: 2,
  LEVEL_3_TEST_VALIDATE: 3,
  LEVEL_4_STAGING_DEPLOY: 4,
  LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED: 5
};

const PRODUCTION_TERMS = [
  'production',
  'prod',
  'deploy',
  'release',
  'payment',
  'refund',
  'payfast',
  'candidate submission',
  'send message',
  'bulk',
  'delete',
  'drop table',
  'rotate secret',
  'branch protection'
];

const BLOCKED_TERMS = [
  'bypass captcha',
  'bypass otp',
  'dump secrets',
  'disable rls',
  'remove approval gate',
  'ignore doctrine',
  'skip validators',
  'force production without approval'
];

export class JarvisPolicyError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly decision?: JarvisPolicyDecision
  ) {
    super(message);
    this.name = 'JarvisPolicyError';
  }
}

function includesAny(text: string, patterns: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
}

function authorityExceeds(requested: JarvisAuthorityLevel, ceiling: JarvisAuthorityLevel): boolean {
  return AUTHORITY_RANK[requested] > AUTHORITY_RANK[ceiling];
}

function isProductionRisk(command: JarvisCommandEnvelope, tool?: JarvisToolCapabilityCard): boolean {
  const text = `${command.commandTextSafe} ${command.intendedAction}`;
  return (
    command.requestedAuthorityLevel === 'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED' ||
    command.mode === 'production_approval_mode' ||
    tool?.productionWriteCapable === true ||
    includesAny(text, PRODUCTION_TERMS)
  );
}

function isBlocked(command: JarvisCommandEnvelope, tool?: JarvisToolCapabilityCard): boolean {
  const text = `${command.commandTextSafe} ${command.intendedAction}`;
  return tool?.trustLevel === 'TRUST_5_BLOCKED' || includesAny(text, BLOCKED_TERMS);
}

function classifyRisk(command: JarvisCommandEnvelope, tool?: JarvisToolCapabilityCard): JarvisActionRisk {
  if (isBlocked(command, tool)) return 'BLOCKED_UNSAFE';
  if (isProductionRisk(command, tool)) return 'HIGH_PRODUCTION_RISK';
  if (tool?.trustLevel === 'TRUST_4_PRODUCTION_APPROVAL_REQUIRED') return 'HIGH_CONNECTOR_WRITE';
  if (command.channel === 'local_terminal') return 'MEDIUM_LOCAL_EXECUTION';
  if (command.mode === 'builder_mode' || command.mode === 'diagnostic_repair_mode') return 'MEDIUM_REPO_WRITE';
  return 'LOW_INFORMATIONAL';
}

function makeDecision(
  decision: JarvisDecision,
  risk: JarvisActionRisk,
  reasonCode: string,
  safeReason: string,
  allowedAuthorityLevel: JarvisAuthorityLevel,
  approvalRequired = false,
  evidenceRequired = true
): JarvisPolicyDecision {
  return {
    decision,
    risk,
    reasonCode,
    safeReason,
    approvalRequired,
    evidenceRequired,
    allowedAuthorityLevel
  };
}

export function jarvisEvaluatePolicy(
  command: JarvisCommandEnvelope,
  tool?: JarvisToolCapabilityCard
): JarvisPolicyDecision {
  const risk = classifyRisk(command, tool);

  if (!command.commandTextSafe.trim()) {
    return makeDecision(
      'BLOCK',
      'BLOCKED_UNSAFE',
      'JARVIS_EMPTY_COMMAND',
      'Jarvis command text is empty.',
      'LEVEL_1_READ_ONLY'
    );
  }

  if (tool && !tool.allowedModes.includes(command.mode)) {
    return makeDecision(
      'BLOCK',
      'BLOCKED_UNSAFE',
      'JARVIS_TOOL_MODE_NOT_ALLOWED',
      `Tool ${tool.toolRef} is not allowed in ${command.mode}.`,
      'LEVEL_1_READ_ONLY'
    );
  }

  if (tool && !tool.allowedChannels.includes(command.channel)) {
    return makeDecision(
      'BLOCK',
      'BLOCKED_UNSAFE',
      'JARVIS_TOOL_CHANNEL_NOT_ALLOWED',
      `Tool ${tool.toolRef} is not allowed from ${command.channel}.`,
      'LEVEL_1_READ_ONLY'
    );
  }

  if (tool && authorityExceeds(command.requestedAuthorityLevel, tool.authorityCeiling)) {
    return makeDecision(
      'APPROVAL_REQUIRED',
      risk,
      'JARVIS_AUTHORITY_EXCEEDS_TOOL_CEILING',
      `Requested authority exceeds ${tool.toolRef} ceiling.`,
      tool.authorityCeiling,
      true
    );
  }

  if (risk === 'BLOCKED_UNSAFE') {
    return makeDecision(
      'BLOCK',
      risk,
      'JARVIS_BLOCKED_UNSAFE_ACTION',
      'Jarvis command matches a blocked unsafe action pattern.',
      'LEVEL_1_READ_ONLY'
    );
  }

  if (risk === 'HIGH_PRODUCTION_RISK' || risk === 'HIGH_CONNECTOR_WRITE') {
    return makeDecision(
      command.founderApprovalRef ? 'ALLOW' : 'APPROVAL_REQUIRED',
      risk,
      command.founderApprovalRef ? 'JARVIS_APPROVAL_PRESENT' : 'JARVIS_APPROVAL_REQUIRED',
      command.founderApprovalRef
        ? 'Founder approval reference is present for this high-risk action.'
        : 'Founder approval is required before this high-risk action can run.',
      command.requestedAuthorityLevel,
      !command.founderApprovalRef
    );
  }

  if (tool?.trustLevel === 'TRUST_0_UNKNOWN') {
    return makeDecision(
      'DRY_RUN_ONLY',
      risk,
      'JARVIS_UNKNOWN_TOOL_DRY_RUN_ONLY',
      `Tool ${tool.toolRef} is unknown and limited to dry-run behavior.`,
      'LEVEL_1_READ_ONLY'
    );
  }

  return makeDecision(
    'ALLOW',
    risk,
    'JARVIS_ALLOWED_BY_POLICY',
    'Jarvis command is allowed inside declared authority and tool policy.',
    command.requestedAuthorityLevel
  );
}

export function jarvisAssertAllowed(command: JarvisCommandEnvelope, tool?: JarvisToolCapabilityCard): JarvisPolicyDecision {
  const decision = jarvisEvaluatePolicy(command, tool);
  if (decision.decision === 'BLOCK') {
    throw new JarvisPolicyError(decision.reasonCode, decision.safeReason, decision);
  }
  return decision;
}
