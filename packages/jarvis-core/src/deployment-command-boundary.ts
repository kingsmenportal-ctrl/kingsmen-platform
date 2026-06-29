export type JarvisDeploymentAction =
  | 'readiness_review'
  | 'validator_sequence'
  | 'build_check'
  | 'environment_check'
  | 'database_readiness_check'
  | 'preview_rollout'
  | 'release_gate'
  | 'runtime_evidence_capture';

export type JarvisDeploymentPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisDeploymentCommandRequest {
  readonly commandRef: string;
  readonly action: JarvisDeploymentAction;
  readonly targetEnvironment: string;
  readonly commitRef: string;
  readonly validatorsPassed: boolean;
  readonly buildPassed: boolean;
  readonly environmentReady: boolean;
  readonly databaseReady: boolean;
  readonly oracleLiteCapacityFit: boolean;
  readonly restorePathReady: boolean;
  readonly finalReleaseRequested: boolean;
  readonly explicitApproval: boolean;
  readonly runtimeEvidenceCaptured: boolean;
}

export interface JarvisDeploymentCommandDecision {
  readonly intent: 'DEPLOYMENT_RELEASE_READINESS_CONTROL';
  readonly deploymentRole: 'controlled_release_readiness_not_runtime_proof';
  readonly action: JarvisDeploymentAction;
  readonly targetEnvironment: string;
  readonly commitRef: string;
  readonly policyStatus: JarvisDeploymentPolicyStatus;
  readonly approvalRequired: boolean;
  readonly runtimeEvidenceRequired: boolean;
  readonly requiredChecks: readonly string[];
  readonly forbiddenClaims: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'deployment_boundary_built_not_deployment_runtime_proven';
}

const requiredChecks = [
  'target_environment_confirmed',
  'commit_ref_confirmed',
  'validators_passed',
  'build_passed',
  'environment_ready',
  'database_ready',
  'oracle_lite_capacity_fit',
  'restore_path_ready',
  'runtime_evidence_captured_before_success_claim'
] as const;

const forbiddenClaims = [
  'repo_files_must_not_be_treated_as_deployment_success',
  'markdown_must_not_be_treated_as_release_readiness',
  'validators_must_not_be_skipped',
  'runtime_success_must_not_be_claimed_without_evidence',
  'new_layers_must_not_be_added_without_necessity'
] as const;

export function jarvisAssessDeploymentCommandRequest(
  request: JarvisDeploymentCommandRequest
): JarvisDeploymentCommandDecision {
  const missingReadiness =
    !request.validatorsPassed ||
    !request.buildPassed ||
    !request.environmentReady ||
    !request.databaseReady ||
    !request.oracleLiteCapacityFit ||
    !request.restorePathReady;

  const missingApproval = request.finalReleaseRequested && !request.explicitApproval;
  const missingRuntimeEvidence = request.action === 'runtime_evidence_capture' && !request.runtimeEvidenceCaptured;

  const policyStatus: JarvisDeploymentPolicyStatus = missingReadiness || missingApproval || missingRuntimeEvidence
    ? 'blocked'
    : request.finalReleaseRequested
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'DEPLOYMENT_RELEASE_READINESS_CONTROL',
    deploymentRole: 'controlled_release_readiness_not_runtime_proof',
    action: request.action,
    targetEnvironment: request.targetEnvironment,
    commitRef: request.commitRef,
    policyStatus,
    approvalRequired: policyStatus === 'needs_approval',
    runtimeEvidenceRequired: true,
    requiredChecks,
    forbiddenClaims,
    runtimeProof: null,
    completionStatus: 'deployment_boundary_built_not_deployment_runtime_proven'
  };
}

export const JARVIS_DEPLOYMENT_COMMAND_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  releaseExecution: 'not_proven_without_runtime_evidence',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
