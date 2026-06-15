import type { JarvisOrchestratorPlan, JarvisOrchestratorStep } from './types';

const sequence: Array<{ id: string; roleId: string; state: JarvisOrchestratorStep['state'] }> = [
  { id: 'normalize', roleId: 'commander_interface', state: 'normalizing' },
  { id: 'classify_intent', roleId: 'intent_classifier', state: 'classifying' },
  { id: 'resolve_command', roleId: 'command_resolver', state: 'resolving_command' },
  { id: 'apply_policy', roleId: 'policy_guard', state: 'checking_policy' },
  { id: 'select_adapter', roleId: 'tool_dispatcher', state: 'selecting_adapter' },
  { id: 'retrieve_context', roleId: 'knowledge_retriever', state: 'retrieving_context' },
  { id: 'live_data_if_required', roleId: 'live_data_researcher', state: 'checking_live_data' },
  { id: 'score_confidence', roleId: 'source_confidence_judge', state: 'scoring_confidence' },
  { id: 'record_evidence', roleId: 'evidence_recorder', state: 'recording_evidence' },
  { id: 'compose_answer', roleId: 'answer_composer', state: 'composing_answer' },
  { id: 'present', roleId: 'hud_presenter', state: 'presenting' }
];

export function createJarvisOrchestrationPlan(input: string): JarvisOrchestratorPlan {
  const trimmed = input.trim();
  const createdAt = new Date().toISOString();
  const planId = `jarvis-plan-${createdAt.replace(/[^0-9]/g, '').slice(0, 14)}`;

  if (!trimmed) {
    return {
      planId,
      input,
      createdAt,
      state: 'blocked',
      steps: [
        {
          id: 'normalize',
          roleId: 'commander_interface',
          state: 'blocked',
          ok: false,
          note: 'No Commander request was supplied.'
        }
      ],
      finalNote: 'Blocked: empty request.'
    };
  }

  const steps: JarvisOrchestratorStep[] = sequence.map((step) => ({
    ...step,
    ok: true,
    note: `Prepared ${step.id} through ${step.roleId}.`
  }));

  return {
    planId,
    input: trimmed,
    createdAt,
    state: 'completed',
    steps,
    finalNote: 'Governed orchestration plan prepared.'
  };
}
