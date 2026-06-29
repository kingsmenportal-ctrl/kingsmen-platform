export type JarvisSystemStableAction =
  | 'assess_stability'
  | 'confirm_no_intervention_required'
  | 'recommend_observation'
  | 'continue_controlled_progress'
  | 'schedule_next_review'
  | 'preserve_monitoring'
  | 'separate_stable_state_from_runtime_proof';

export type JarvisSystemStablePolicyStatus = 'allowed' | 'needs_approval' | 'blocked';
export type JarvisSystemStabilityStatus = 'stable' | 'stable_with_open_risks' | 'unproven' | 'blocked';

export interface JarvisSystemStableRequest {
  readonly commandRef: string;
  readonly action: JarvisSystemStableAction;
  readonly matter: string;
  readonly stabilityEvidence: readonly string[];
  readonly openRisks: readonly string[];
  readonly monitoringActive: boolean;
  readonly immediateInterventionRequested: boolean;
  readonly controlledProgressDefined: boolean;
  readonly runtimeStabilityClaimed: boolean;
  readonly productionCompletionClaimed: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisSystemStableDecision {
  readonly intent: 'SYSTEM_STABLE_OBSERVATION_CONTROL';
  readonly stableRole: 'controlled_observation_not_unnecessary_intervention';
  readonly action: JarvisSystemStableAction;
  readonly matter: string;
  readonly stabilityStatus: JarvisSystemStabilityStatus;
  readonly policyStatus: JarvisSystemStablePolicyStatus;
  readonly interventionRequired: boolean;
  readonly observationRecommended: boolean;
  readonly controlledProgressAllowed: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredStableSteps: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'system_stable_boundary_built_not_live_stability_proven';
}

const requiredStableSteps = [
  'matter_identified',
  'stability_evidence_listed',
  'open_risks_listed_or_none_stated',
  'monitoring_state_checked',
  'no_intervention_decision_recorded',
  'controlled_progress_path_defined',
  'next_review_command_set'
] as const;

const forbiddenClaims = [
  'stable_language_must_not_hide_open_risks',
  'observation_must_not_be_treated_as_production_completion',
  'repo_files_must_not_be_treated_as_live_stability_proof',
  'unnecessary_repairs_must_not_be_created_when_system_is_stable',
  'new_layers_must_not_be_added_without_operational_need',
  'runtime_stability_must_not_be_claimed_without_runtime_evidence'
] as const;

export function jarvisAssessSystemStableRequest(
  request: JarvisSystemStableRequest
): JarvisSystemStableDecision {
  const hasStabilityEvidence = request.stabilityEvidence.length > 0;
  const runtimeProofBoundaryBreached = request.runtimeStabilityClaimed || request.productionCompletionClaimed;
  const stableButNeedsApproval = request.openRisks.length > 0 || !request.monitoringActive;

  const policyStatus: JarvisSystemStablePolicyStatus = !hasStabilityEvidence || runtimeProofBoundaryBreached
    ? 'blocked'
    : stableButNeedsApproval || request.immediateInterventionRequested
      ? 'needs_approval'
      : 'allowed';

  const stabilityStatus: JarvisSystemStabilityStatus = policyStatus === 'blocked'
    ? 'blocked'
    : request.openRisks.length > 0
      ? 'stable_with_open_risks'
      : hasStabilityEvidence
        ? 'stable'
        : 'unproven';

  return {
    intent: 'SYSTEM_STABLE_OBSERVATION_CONTROL',
    stableRole: 'controlled_observation_not_unnecessary_intervention',
    action: request.action,
    matter: request.matter,
    stabilityStatus,
    policyStatus,
    interventionRequired: request.immediateInterventionRequested,
    observationRecommended: policyStatus !== 'blocked',
    controlledProgressAllowed: policyStatus !== 'blocked' && request.controlledProgressDefined,
    forbiddenClaims,
    requiredStableSteps,
    requiredProof: [
      'matter_under_review',
      'stability_evidence',
      'known_open_risks_or_none_marker',
      'monitoring_state',
      'no_intervention_decision',
      'controlled_progress_path',
      'next_review_command',
      'runtime_evidence_for_runtime_stability_claims'
    ],
    runtimeProof: null,
    completionStatus: 'system_stable_boundary_built_not_live_stability_proven'
  };
}

export const JARVIS_SYSTEM_STABLE_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveStabilityMonitoring: 'not_proven_without_runtime_or_observability_confirmation',
  runtimeStability: 'not_claimed_from_repo_files_alone',
  intervention: 'not_required_when_stability_evidence_supports_observation',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
