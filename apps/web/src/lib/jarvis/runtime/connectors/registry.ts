import type { JarvisConnectorDefinition, JarvisConnectorId } from './types';

export const JARVIS_CONNECTORS: Record<JarvisConnectorId, JarvisConnectorDefinition> = {
  web_research: { connectorId: 'web_research', label: 'Web Research', adapterId: 'web_research_adapter', readOnly: true, liveData: true, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Live public check needed.' },
  github_repo: { connectorId: 'github_repo', label: 'GitHub Repo', adapterId: 'github_adapter', readOnly: true, liveData: true, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Repo check needed.' },
  system_health: { connectorId: 'system_health', label: 'System Health', adapterId: 'system_health_adapter', readOnly: true, liveData: true, requiresSourceConfidence: false, requiresEvidence: true, defaultFailure: 'Health check needed.' },
  build_validation: { connectorId: 'build_validation', label: 'Build Validation', adapterId: 'validation_adapter', readOnly: false, liveData: false, requiresSourceConfidence: false, requiresEvidence: true, defaultFailure: 'Validation check needed.' },
  postgres_read_model: { connectorId: 'postgres_read_model', label: 'PostgreSQL Read Model', adapterId: 'postgres_read_model_adapter', readOnly: true, liveData: true, requiresSourceConfidence: false, requiresEvidence: true, defaultFailure: 'Read model check needed.' },
  playwright_scout: { connectorId: 'playwright_scout', label: 'Playwright Scout', adapterId: 'playwright_scout_adapter', readOnly: false, liveData: true, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Scout check needed.' },
  utility_api: { connectorId: 'utility_api', label: 'Utility API', adapterId: 'utility_api_adapter', readOnly: true, liveData: true, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Utility check needed.' },
  knowledge_search: { connectorId: 'knowledge_search', label: 'Knowledge Search', adapterId: 'kingsmen_knowledge_adapter', readOnly: true, liveData: false, requiresSourceConfidence: true, requiresEvidence: true, defaultFailure: 'Knowledge check needed.' },
  evidence_ledger: { connectorId: 'evidence_ledger', label: 'Evidence Ledger', adapterId: 'evidence_pack_adapter', readOnly: false, liveData: false, requiresSourceConfidence: false, requiresEvidence: true, defaultFailure: 'Evidence check needed.' },
  blocked_manual_review: { connectorId: 'blocked_manual_review', label: 'Manual Review', adapterId: 'blocked_adapter', readOnly: true, liveData: false, requiresSourceConfidence: false, requiresEvidence: true, defaultFailure: 'Review needed.' }
};

export function pickJarvisConnector(need: string): JarvisConnectorDefinition {
  const text = need.toLowerCase();
  if (text.includes('repo') || text.includes('github')) return JARVIS_CONNECTORS.github_repo;
  if (text.includes('health') || text.includes('status')) return JARVIS_CONNECTORS.system_health;
  if (text.includes('build') || text.includes('validat')) return JARVIS_CONNECTORS.build_validation;
  if (text.includes('database') || text.includes('read model')) return JARVIS_CONNECTORS.postgres_read_model;
  if (text.includes('portal') || text.includes('scout')) return JARVIS_CONNECTORS.playwright_scout;
  if (text.includes('weather') || text.includes('time') || text.includes('currency')) return JARVIS_CONNECTORS.utility_api;
  if (text.includes('knowledge') || text.includes('doctrine') || text.includes('kingsmen')) return JARVIS_CONNECTORS.knowledge_search;
  if (text.includes('evidence')) return JARVIS_CONNECTORS.evidence_ledger;
  if (text.includes('current') || text.includes('latest') || text.includes('deadline') || text.includes('fee')) return JARVIS_CONNECTORS.web_research;
  return JARVIS_CONNECTORS.blocked_manual_review;
}
