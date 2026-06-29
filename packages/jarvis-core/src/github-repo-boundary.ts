export type JarvisGitHubOperation = 'read' | 'create' | 'update' | 'delete' | 'search' | 'commit_check' | 'ci_check';

export type JarvisGitHubPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export type JarvisGitHubProofClass =
  | 'repo_file_exists'
  | 'repo_file_changed'
  | 'commit_created'
  | 'ci_status_observed'
  | 'runtime_not_proven'
  | 'blocked';

export interface JarvisGitHubRepoRequest {
  readonly commandRef: string;
  readonly repositoryFullName: string;
  readonly path: string;
  readonly operation: JarvisGitHubOperation;
  readonly fileAlreadyInspected: boolean;
  readonly touchesSecrets: boolean;
  readonly touchesPrivateRecords: boolean;
  readonly touchesPaymentOrOfficialStatus: boolean;
  readonly touchesProductionRuntime: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisGitHubRepoDecision {
  readonly intent: 'GITHUB_REPO_EVIDENCE_OR_CHANGE_CONTROL';
  readonly repoRole: 'repository_evidence_and_change_control_not_runtime_truth';
  readonly repositoryFullName: string;
  readonly path: string;
  readonly operation: JarvisGitHubOperation;
  readonly policyStatus: JarvisGitHubPolicyStatus;
  readonly proofClass: JarvisGitHubProofClass;
  readonly approvalRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'github_boundary_built_not_runtime_proven';
}

const forbiddenClaims = [
  'commit_sha_must_not_be_treated_as_runtime_proof',
  'file_exists_must_not_be_treated_as_build_passed',
  'migration_file_must_not_be_treated_as_applied_database_proof',
  'github_change_must_not_be_treated_as_deployment_success',
  'repo_status_must_not_be_treated_as_candidate_or_payment_truth',
  'secret_or_private_record_exposure_is_blocked'
] as const;

export function jarvisAssessGitHubRepoRequest(request: JarvisGitHubRepoRequest): JarvisGitHubRepoDecision {
  const sensitive = request.touchesSecrets || request.touchesPrivateRecords || request.touchesPaymentOrOfficialStatus;
  const writeAction = request.operation === 'create' || request.operation === 'update' || request.operation === 'delete';
  const missingInspection = writeAction && !request.fileAlreadyInspected && request.operation !== 'create';

  const policyStatus: JarvisGitHubPolicyStatus = request.touchesSecrets || missingInspection
    ? 'blocked'
    : sensitive || request.touchesProductionRuntime || request.operation === 'delete'
      ? 'needs_approval'
      : 'allowed';

  const proofClass: JarvisGitHubProofClass = policyStatus === 'blocked'
    ? 'blocked'
    : writeAction
      ? 'repo_file_changed'
      : request.operation === 'commit_check'
        ? 'commit_created'
        : request.operation === 'ci_check'
          ? 'ci_status_observed'
          : 'repo_file_exists';

  return {
    intent: 'GITHUB_REPO_EVIDENCE_OR_CHANGE_CONTROL',
    repoRole: 'repository_evidence_and_change_control_not_runtime_truth',
    repositoryFullName: request.repositoryFullName,
    path: request.path,
    operation: request.operation,
    policyStatus,
    proofClass,
    approvalRequired: policyStatus === 'needs_approval',
    forbiddenClaims,
    requiredProof: [
      'exact_repository_confirmed',
      'exact_path_confirmed',
      'existing_file_inspected_before_update_or_delete',
      'commit_sha_for_repo_change',
      'ci_or_validator_output_before_claiming_build_passed',
      'deployment_runtime_evidence_before_claiming_live_status'
    ],
    runtimeProof: null,
    completionStatus: 'github_boundary_built_not_runtime_proven'
  };
}

export const JARVIS_GITHUB_REPO_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  repoProof: 'commit_sha_or_file_sha_only',
  buildProof: 'requires_validator_or_ci_output',
  runtimeProof: 'requires_deployed_execution_or_local_run_evidence',
  productionCompletion: 'not_claimed_from_commit_alone'
} as const;
