export type JarvisCorrectionAction =
  | 'accept_correction'
  | 'update_operating_rule'
  | 'correct_previous_response'
  | 'repair_affected_output'
  | 'correct_sequence'
  | 'correct_doctrine_scope'
  | 'continue_from_corrected_standard';

export type JarvisCorrectionPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisCorrectionCommandRequest {
  readonly commandRef: string;
  readonly action: JarvisCorrectionAction;
  readonly correctionText: string;
  readonly affectedScope: string;
  readonly correctionAccepted: boolean;
  readonly correctedStandardDefined: boolean;
  readonly operatingRuleUpdated: boolean;
  readonly materialRepairRequired: boolean;
  readonly materialRepairCompleted: boolean;
  readonly validationAvailable: boolean;
  readonly minimisesKingsmenScope: boolean;
  readonly claimsRuntimeProof: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisCorrectionCommandDecision {
  readonly intent: 'CORRECTION_OPERATING_RULE_UPDATE_CONTROL';
  readonly correctionRole: 'commander_correction_updates_operating_standard_not_argument';
  readonly action: JarvisCorrectionAction;
  readonly affectedScope: string;
  readonly policyStatus: JarvisCorrectionPolicyStatus;
  readonly repairRequired: boolean;
  readonly validationRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredCorrectionSteps: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'correction_boundary_built_not_correction_runtime_proven';
}

const requiredCorrectionSteps = [
  'correction_received',
  'correction_accepted',
  'corrected_standard_defined',
  'operating_rule_updated',
  'affected_scope_identified',
  'material_repair_completed_or_marked_not_proven',
  'next_correct_command_set'
] as const;

const forbiddenClaims = [
  'apology_must_not_be_treated_as_material_repair',
  'correction_must_not_minimise_kingsmen_scope',
  'previous_error_must_not_be_hidden',
  'corrected_text_must_not_be_treated_as_runtime_proof',
  'wrong_rule_must_not_continue_after_correction',
  'repo_files_must_not_be_treated_as_live_correction_execution_proof'
] as const;

export function jarvisAssessCorrectionCommandRequest(
  request: JarvisCorrectionCommandRequest
): JarvisCorrectionCommandDecision {
  const missingCorrectionBasis =
    !request.correctionAccepted ||
    !request.correctedStandardDefined ||
    !request.operatingRuleUpdated ||
    request.minimisesKingsmenScope;

  const missingMaterialRepair = request.materialRepairRequired && !request.materialRepairCompleted;
  const missingRuntimeProofBoundary = request.claimsRuntimeProof;

  const policyStatus: JarvisCorrectionPolicyStatus = missingCorrectionBasis || missingMaterialRepair || missingRuntimeProofBoundary
    ? 'blocked'
    : request.materialRepairRequired || request.validationAvailable
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'CORRECTION_OPERATING_RULE_UPDATE_CONTROL',
    correctionRole: 'commander_correction_updates_operating_standard_not_argument',
    action: request.action,
    affectedScope: request.affectedScope,
    policyStatus,
    repairRequired: request.materialRepairRequired,
    validationRequired: request.materialRepairRequired || request.validationAvailable,
    forbiddenClaims,
    requiredCorrectionSteps,
    requiredProof: [
      'exact_commander_correction',
      'previous_wrong_rule_or_output',
      'corrected_kingsmen_standard',
      'affected_scope_or_files',
      'material_repair_state',
      'validator_or_evidence_output_when_repo_material_changes',
      'next_correct_command'
    ],
    runtimeProof: null,
    completionStatus: 'correction_boundary_built_not_correction_runtime_proven'
  };
}

export const JARVIS_CORRECTION_COMMAND_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  correctionExecution: 'not_proven_without_material_repair_or_runtime_confirmation',
  materialRepair: 'required_when_affected_outputs_or_files_remain_wrong',
  validation: 'required_for_repo_material_corrections',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
