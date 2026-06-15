export type JarvisOrchestratorState =
  | 'queued'
  | 'normalizing'
  | 'classifying'
  | 'resolving_command'
  | 'checking_policy'
  | 'selecting_adapter'
  | 'retrieving_context'
  | 'checking_live_data'
  | 'scoring_confidence'
  | 'recording_evidence'
  | 'composing_answer'
  | 'presenting'
  | 'completed'
  | 'blocked'
  | 'failed';

export type JarvisOrchestratorStep = {
  id: string;
  roleId: string;
  state: JarvisOrchestratorState;
  ok: boolean;
  note: string;
};

export type JarvisOrchestratorPlan = {
  planId: string;
  input: string;
  createdAt: string;
  state: JarvisOrchestratorState;
  steps: JarvisOrchestratorStep[];
  finalNote: string;
};
