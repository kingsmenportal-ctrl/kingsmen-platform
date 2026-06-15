import type { JarvisCommandDefinition, JarvisPolicyDecision, JarvisToolRoute } from './types';

const known = new Set<string>([
  'dialogue_brain',
  'web_research_adapter',
  'kingsmen_knowledge_adapter',
  'github_adapter',
  'public_repo_registry_adapter',
  'jarvis_voice_gateway_adapter',
  'langfuse_trace_gateway_adapter',
  'system_health_adapter',
  'validation_adapter',
  'build_adapter',
  'postgres_read_model_adapter',
  'playwright_scout_adapter',
  'report_generation_adapter',
  'evidence_pack_adapter',
  'approval_adapter',
  'blocked_adapter',
]);

export function selectJarvisAdapter(command: JarvisCommandDefinition, policy: JarvisPolicyDecision): JarvisToolRoute {
  if (!policy.allowed) {
    return { adapterId: 'blocked_adapter', allowed: false, reason: policy.reason, outputSurfaces: ['jarvis_hud', 'blocked_card'] };
  }

  if (!known.has(command.adapterId)) {
    return { adapterId: 'blocked_adapter', allowed: false, reason: 'Adapter is not registered.', outputSurfaces: ['jarvis_hud', 'blocked_card'] };
  }

  return { adapterId: command.adapterId, allowed: true, reason: 'Registered adapter selected.', outputSurfaces: ['jarvis_hud', 'evidence_drawer'] };
}
