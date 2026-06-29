export type JarvisEveningCloseoutAction =
  | 'prepare_evening_closeout'
  | 'list_completed_today'
  | 'list_unresolved_matters'
  | 'carry_forward_risks'
  | 'prepare_tomorrow_queue'
  | 'recommend_closeout_state'
  | 'mark_unverified_fields';

export type JarvisEveningCloseoutPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';
export type JarvisEveningOverallStatus = 'Green' | 'Amber' | 'Red' | 'requires_review';
export type JarvisEveningCloseoutDecisionState = 'may_close_stable' | 'requires_attention_before_closeout' | 'blocked';

export interface JarvisEveningCloseoutRequest {
  readonly commandRef: string;
  readonly action: JarvisEveningCloseoutAction;
  readonly dateTimeKnown: boolean;
  readonly completedWorkEvidenceAvailable: boolean;
  readonly completedTodayListed: boolean;
  readonly unresolvedMattersListed: boolean;
  readonly risksCarriedForwardListed: boolean;
  readonly tomorrowQueuePrepared: boolean;
  readonly recommendationProvided: boolean;
  readonly includesPrivateDetails: boolean;
  readonly claimsRuntimeCloseoutGenerated: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisEveningCloseoutDecision {
  readonly intent: 'EVENING_COMMAND_CLOSEOUT_CONTROL';
  readonly closeoutRole: 'end_of_day_command_seal_not_live_completion_proof';
  readonly action: JarvisEveningCloseoutAction;
  readonly overallStatus: JarvisEveningOverallStatus;
  readonly policyStatus: JarvisEveningCloseoutPolicyStatus;
  readonly closeoutDecision: JarvisEveningCloseoutDecisionState;
  readonly reviewRequired: boolean;
  readonly privateDataMinimizationRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredCloseoutSections: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'evening_closeout_boundary_built_not_live_closeout_proven';
}

const requiredCloseoutSections = [
  'evening_opening',
  'date_and_time',
  'overall_status',
  'completed_today',
  'unresolved_matters',
  'risks_carried_forward',
  'tomorrow_command_queue',
  'my_recommendation',
  'closeout_decision',
  'proof_state'
] as const;

const forbiddenClaims = [
  'evening_closeout_must_not_invent_completed_work',
  'unresolved_matters_must_not_be_hidden',
  'risks_must_not_be_erased_before_closeout',
  'tomorrow_queue_must_not_be_random_or_unsequenced',
  'closeout_state_must_not_be_called_stable_without_evidence',
  'repo_files_must_not_be_treated_as_live_evening_closeout_proof'
] as const;

export function jarvisAssessEveningCloseoutRequest(
  request: JarvisEveningCloseoutRequest
): JarvisEveningCloseoutDecision {
  const missingBody =
    !request.completedTodayListed ||
    !request.unresolvedMattersListed ||
    !request.risksCarriedForwardListed ||
    !request.tomorrowQueuePrepared ||
    !request.recommendationProvided;

  const proofMissing = !request.dateTimeKnown || !request.completedWorkEvidenceAvailable;
  const runtimeBoundaryBreached = request.claimsRuntimeCloseoutGenerated;

  const policyStatus: JarvisEveningCloseoutPolicyStatus = missingBody || runtimeBoundaryBreached
    ? 'blocked'
    : proofMissing || request.includesPrivateDetails
      ? 'needs_approval'
      : 'allowed';

  const overallStatus: JarvisEveningOverallStatus = policyStatus === 'blocked'
    ? 'Red'
    : proofMissing || request.includesPrivateDetails
      ? 'Amber'
      : 'Green';

  const closeoutDecision: JarvisEveningCloseoutDecisionState = policyStatus === 'blocked'
    ? 'blocked'
    : policyStatus === 'allowed'
      ? 'may_close_stable'
      : 'requires_attention_before_closeout';

  return {
    intent: 'EVENING_COMMAND_CLOSEOUT_CONTROL',
    closeoutRole: 'end_of_day_command_seal_not_live_completion_proof',
    action: request.action,
    overallStatus,
    policyStatus,
    closeoutDecision,
    reviewRequired: policyStatus !== 'allowed',
    privateDataMinimizationRequired: request.includesPrivateDetails,
    forbiddenClaims,
    requiredCloseoutSections,
    requiredProof: [
      'date_time_source_or_requires_review_marker',
      'completed_today_with_evidence',
      'unresolved_matters_or_none_marker',
      'risks_carried_forward_or_none_marker',
      'tomorrow_command_queue',
      'recommendation',
      'closeout_decision',
      'runtime_evidence_for_live_closeout_claims'
    ],
    runtimeProof: null,
    completionStatus: 'evening_closeout_boundary_built_not_live_closeout_proven'
  };
}

export const JARVIS_EVENING_CLOSEOUT_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveEveningCloseout: 'not_proven_without_current_sources_and_runtime_confirmation',
  closeoutFields: 'must_be_verified_or_marked_requires_review',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
