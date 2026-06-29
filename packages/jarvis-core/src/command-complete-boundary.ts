export type JarvisCommandCompleteAction =
  | 'close_command'
  | 'record_completed_result'
  | 'record_partial_result'
  | 'record_blocked_result'
  | 'name_verified_output'
  | 'carry_remaining_matter'
  | 'carry_risk_forward'
  | 'recommend_next_command';

export type JarvisCommandResultStatus = 'completed' | 'partially_completed' | 'blocked' | 'unproven';
export type JarvisCommandCompletePolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisCommandCompleteRequest {
  readonly commandRef: string;
  readonly action: JarvisCommandCompleteAction;
  readonly commandName: string;
  readonly resultStatus: JarvisCommandResultStatus;
  readonly verifiedOutput: string;
  readonly remainingMatter: string;
  readonly risk: string;
  readonly recommendedNextCommand: string;
  readonly evidenceRefs: readonly string[];
  readonly validatorOutputPresent: boolean;
  readonly runtimeProofClaimed: boolean;
  readonly productionCompletionClaimed: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisCommandCompleteDecision {
  readonly intent: 'COMMAND_COMPLETE_CLOSEOUT_CONTROL';
  readonly completionRole: 'evidence_backed_closeout_not_casual_done';
  readonly action: JarvisCommandCompleteAction;
  readonly commandName: string;
  readonly resultStatus: JarvisCommandResultStatus;
  readonly policyStatus: JarvisCommandCompletePolicyStatus;
  readonly evidenceRequired: boolean;
  readonly approvalRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredCloseoutSteps: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'command_complete_boundary_built_not_live_completion_proven';
}

const requiredCloseoutSteps = [
  'command_identified',
  'result_status_declared',
  'verified_output_named',
  'remaining_matter_stated',
  'risk_stated_or_none_marked',
  'recommended_next_command_set',
  'proof_state_declared'
] as const;

const forbiddenClaims = [
  'done_must_not_be_claimed_without_verified_output',
  'partial_work_must_not_be_marked_fully_complete',
  'blocked_work_must_not_be_marked_complete',
  'remaining_matter_must_not_be_hidden',
  'risk_must_not_be_hidden_or_erased',
  'runtime_completion_must_not_be_claimed_without_runtime_evidence',
  'repo_files_must_not_be_treated_as_live_command_completion_proof'
] as const;

export function jarvisAssessCommandCompleteRequest(
  request: JarvisCommandCompleteRequest
): JarvisCommandCompleteDecision {
  const hasVerifiedOutput = request.verifiedOutput.length > 0;
  const hasNextCommand = request.recommendedNextCommand.length > 0;
  const hasRiskStatement = request.risk.length > 0;
  const evidenceRequired = request.resultStatus === 'completed' || request.runtimeProofClaimed || request.productionCompletionClaimed;
  const evidencePresent = request.evidenceRefs.length > 0 || request.validatorOutputPresent;
  const proofBoundaryBreached = request.runtimeProofClaimed || request.productionCompletionClaimed;

  const missingCloseout = !hasVerifiedOutput || !hasNextCommand || !hasRiskStatement || request.resultStatus === 'unproven';
  const missingEvidence = evidenceRequired && !evidencePresent;

  const policyStatus: JarvisCommandCompletePolicyStatus = missingCloseout || missingEvidence || proofBoundaryBreached
    ? 'blocked'
    : request.resultStatus === 'partially_completed' || request.resultStatus === 'blocked' || request.remainingMatter.length > 0
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'COMMAND_COMPLETE_CLOSEOUT_CONTROL',
    completionRole: 'evidence_backed_closeout_not_casual_done',
    action: request.action,
    commandName: request.commandName,
    resultStatus: request.resultStatus,
    policyStatus,
    evidenceRequired,
    approvalRequired: policyStatus === 'needs_approval',
    forbiddenClaims,
    requiredCloseoutSteps,
    requiredProof: [
      'command_reference',
      'result_status_completed_partially_completed_or_blocked',
      'verified_output',
      'remaining_matter_or_none_marker',
      'risk_or_none_marker',
      'recommended_next_command',
      'evidence_reference_or_validator_output',
      'runtime_evidence_for_runtime_or_production_completion_claims'
    ],
    runtimeProof: null,
    completionStatus: 'command_complete_boundary_built_not_live_completion_proven'
  };
}

export const JARVIS_COMMAND_COMPLETE_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveCommandCompletion: 'not_proven_without_runtime_or_validator_confirmation',
  evidence: 'required_before_completion_claim',
  partialOrBlocked: 'must_be_declared_plainly',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
