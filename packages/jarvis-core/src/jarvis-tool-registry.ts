import type { JarvisToolCapabilityCard } from '../../contracts/src/jarvis';

export const JARVIS_CORE_TOOL_REGISTRY: readonly JarvisToolCapabilityCard[] = [
  {
    toolRef: 'jarvis.repo.reader',
    displayName: 'Kingsmen Repo Reader',
    trustLevel: 'TRUST_1_READ_ONLY',
    allowedModes: ['safe_chat_mode', 'controlled_command_mode', 'builder_mode', 'research_mode', 'diagnostic_repair_mode'],
    allowedChannels: ['hud', 'voice', 'github', 'local_terminal', 'system'],
    authorityCeiling: 'LEVEL_1_READ_ONLY',
    productionWriteCapable: false,
    candidateDataCapable: false,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.patch.writer',
    displayName: 'Kingsmen Patch Writer',
    trustLevel: 'TRUST_2_DRY_RUN',
    allowedModes: ['builder_mode', 'diagnostic_repair_mode'],
    allowedChannels: ['hud', 'github', 'local_terminal', 'system'],
    authorityCeiling: 'LEVEL_2_GENERATE_FILES',
    productionWriteCapable: false,
    candidateDataCapable: false,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.validator.runner',
    displayName: 'Kingsmen Validator Runner',
    trustLevel: 'TRUST_2_DRY_RUN',
    allowedModes: ['controlled_command_mode', 'builder_mode', 'diagnostic_repair_mode'],
    allowedChannels: ['hud', 'github', 'local_terminal', 'system'],
    authorityCeiling: 'LEVEL_3_TEST_VALIDATE',
    productionWriteCapable: false,
    candidateDataCapable: false,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.github.commit.planner',
    displayName: 'Kingsmen GitHub Commit Planner',
    trustLevel: 'TRUST_2_DRY_RUN',
    allowedModes: ['builder_mode', 'diagnostic_repair_mode'],
    allowedChannels: ['hud', 'github', 'system'],
    authorityCeiling: 'LEVEL_3_TEST_VALIDATE',
    productionWriteCapable: false,
    candidateDataCapable: false,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.connector.github',
    displayName: 'Kingsmen GitHub Connector',
    trustLevel: 'TRUST_3_STAGING_WRITE',
    allowedModes: ['builder_mode', 'diagnostic_repair_mode', 'production_approval_mode'],
    allowedChannels: ['hud', 'github', 'system'],
    authorityCeiling: 'LEVEL_4_STAGING_DEPLOY',
    productionWriteCapable: false,
    candidateDataCapable: false,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.connector.airtable',
    displayName: 'Kingsmen Airtable Mirror Connector',
    trustLevel: 'TRUST_4_PRODUCTION_APPROVAL_REQUIRED',
    allowedModes: ['connector_dry_run_mode', 'production_approval_mode'],
    allowedChannels: ['hud', 'system'],
    authorityCeiling: 'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED',
    productionWriteCapable: true,
    candidateDataCapable: true,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.connector.n8n',
    displayName: 'Kingsmen n8n Thin Worker Connector',
    trustLevel: 'TRUST_4_PRODUCTION_APPROVAL_REQUIRED',
    allowedModes: ['connector_dry_run_mode', 'production_approval_mode'],
    allowedChannels: ['hud', 'system'],
    authorityCeiling: 'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED',
    productionWriteCapable: true,
    candidateDataCapable: true,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.connector.payfast',
    displayName: 'Kingsmen PayFast Connector',
    trustLevel: 'TRUST_4_PRODUCTION_APPROVAL_REQUIRED',
    allowedModes: ['connector_dry_run_mode', 'production_approval_mode'],
    allowedChannels: ['hud', 'system'],
    authorityCeiling: 'LEVEL_5_PRODUCTION_RISK_APPROVAL_REQUIRED',
    productionWriteCapable: true,
    candidateDataCapable: true,
    secretsCapable: false,
    requiresEvidenceLedger: true
  },
  {
    toolRef: 'jarvis.browser.scout',
    displayName: 'Kingsmen Browser Scout',
    trustLevel: 'TRUST_2_DRY_RUN',
    allowedModes: ['research_mode', 'connector_dry_run_mode', 'diagnostic_repair_mode'],
    allowedChannels: ['hud', 'local_terminal', 'system'],
    authorityCeiling: 'LEVEL_3_TEST_VALIDATE',
    productionWriteCapable: false,
    candidateDataCapable: false,
    secretsCapable: false,
    requiresEvidenceLedger: true
  }
];

export function jarvisGetTool(toolRef: string): JarvisToolCapabilityCard | undefined {
  return JARVIS_CORE_TOOL_REGISTRY.find((tool) => tool.toolRef === toolRef);
}

export function jarvisRequireTool(toolRef: string): JarvisToolCapabilityCard {
  const tool = jarvisGetTool(toolRef);
  if (!tool) {
    throw new Error(`Unknown Jarvis tool: ${toolRef}`);
  }
  return tool;
}

export function jarvisListToolRefs(): readonly string[] {
  return JARVIS_CORE_TOOL_REGISTRY.map((tool) => tool.toolRef);
}
