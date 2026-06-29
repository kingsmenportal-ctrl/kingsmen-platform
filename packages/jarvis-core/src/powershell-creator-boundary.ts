export type JarvisPowerShellAction =
  | 'create_file'
  | 'update_file'
  | 'repair_file'
  | 'validate_repo'
  | 'run_build'
  | 'boot_runtime'
  | 'capture_evidence'
  | 'deploy_runtime'
  | 'delete_file';

export type JarvisPowerShellPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisPowerShellCreatorRequest {
  readonly commandRef: string;
  readonly action: JarvisPowerShellAction;
  readonly windowsPath: string;
  readonly repoPath: string;
  readonly fileAlreadyInspected: boolean;
  readonly includesValidation: boolean;
  readonly touchesSecrets: boolean;
  readonly touchesProductionRuntime: boolean;
  readonly destructiveAction: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisPowerShellCreatorDecision {
  readonly intent: 'POWERSHELL_CREATOR_BUILD_HELPER';
  readonly creatorRole: 'windows_build_scribe_and_local_execution_helper_not_doctrine_or_truth';
  readonly action: JarvisPowerShellAction;
  readonly windowsPath: string;
  readonly repoPath: string;
  readonly policyStatus: JarvisPowerShellPolicyStatus;
  readonly approvalRequired: boolean;
  readonly validationRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly safeWriteRules: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'powershell_boundary_built_not_local_execution_proven';
}

const forbiddenClaims = [
  'script_text_must_not_be_treated_as_command_execution_proof',
  'generated_files_must_not_be_treated_as_validator_passed',
  'powershell_must_not_store_or_print_secrets',
  'powershell_must_not_bypass_github_traceability',
  'powershell_must_not_claim_deployment_without_runtime_output'
] as const;

const safeWriteRules = [
  'use_exact_paths_only',
  'inspect_existing_file_before_update_or_delete',
  'create_parent_directories_intentionally',
  'prefer_utf8_no_bom_for_repo_text_files',
  'include_validator_command_after_material_change',
  'capture_command_output_before_claiming_success'
] as const;

export function jarvisAssessPowerShellCreatorRequest(
  request: JarvisPowerShellCreatorRequest
): JarvisPowerShellCreatorDecision {
  const writeAction = ['create_file', 'update_file', 'repair_file', 'delete_file'].includes(request.action);
  const missingInspection = writeAction && request.action !== 'create_file' && !request.fileAlreadyInspected;
  const validationRequired = writeAction || request.action === 'run_build' || request.action === 'boot_runtime' || request.action === 'deploy_runtime';

  const policyStatus: JarvisPowerShellPolicyStatus = request.touchesSecrets || missingInspection
    ? 'blocked'
    : request.destructiveAction || request.touchesProductionRuntime || request.action === 'deploy_runtime'
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'POWERSHELL_CREATOR_BUILD_HELPER',
    creatorRole: 'windows_build_scribe_and_local_execution_helper_not_doctrine_or_truth',
    action: request.action,
    windowsPath: request.windowsPath,
    repoPath: request.repoPath,
    policyStatus,
    approvalRequired: policyStatus === 'needs_approval',
    validationRequired,
    forbiddenClaims,
    safeWriteRules,
    requiredProof: [
      'exact_windows_path',
      'exact_repo_path',
      'file_inspection_before_update_delete_or_repair',
      'generated_script_or_command_text',
      'validator_or_command_output_before_success_claim',
      'github_commit_or_local_diff_for_repo_traceability'
    ],
    runtimeProof: null,
    completionStatus: 'powershell_boundary_built_not_local_execution_proven'
  };
}

export const JARVIS_POWERSHELL_CREATOR_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  localWindowsExecution: 'not_proven_without_terminal_output',
  validatorOutput: 'not_proven_without_command_run',
  githubTraceability: 'required_for_repo_changes',
  productionCompletion: 'not_claimed_from_script_generation_alone'
} as const;
