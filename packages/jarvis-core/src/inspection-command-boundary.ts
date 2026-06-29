export type JarvisInspectionAction =
  | 'inspect_file'
  | 'inspect_layer'
  | 'inspect_doctrine_alignment'
  | 'inspect_runtime_boundary'
  | 'inspect_api_route'
  | 'inspect_hud_panel'
  | 'inspect_validator'
  | 'inspect_package_script'
  | 'inspect_evidence_gap'
  | 'recommend_correction_path';

export type JarvisInspectionPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';
export type JarvisInspectionSeverity = 'none' | 'low' | 'watch' | 'high' | 'blocked';

export interface JarvisInspectionCommandRequest {
  readonly commandRef: string;
  readonly action: JarvisInspectionAction;
  readonly affectedLayer: string;
  readonly sourceInspected: boolean;
  readonly doctrineAlignmentChecked: boolean;
  readonly weaknessFound: boolean;
  readonly correctionPathDefined: boolean;
  readonly repairRequested: boolean;
  readonly touchesPrivateData: boolean;
  readonly touchesSensitiveOperations: boolean;
  readonly evidenceRefsAttached: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisInspectionCommandDecision {
  readonly intent: 'INSPECTION_LAYER_REVIEW_CONTROL';
  readonly inspectionRole: 'disciplined_examination_before_judgment_not_repair_execution';
  readonly action: JarvisInspectionAction;
  readonly affectedLayer: string;
  readonly policyStatus: JarvisInspectionPolicyStatus;
  readonly severity: JarvisInspectionSeverity;
  readonly approvalRequired: boolean;
  readonly repairRequired: boolean;
  readonly evidenceRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredInspectionSteps: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'inspection_boundary_built_not_inspection_runtime_proven';
}

const requiredInspectionSteps = [
  'affected_layer_identified',
  'source_inspected',
  'doctrine_alignment_checked',
  'weakness_exposed_without_exaggeration',
  'severity_stated',
  'clean_correction_path_returned',
  'inspection_separated_from_repair'
] as const;

const forbiddenClaims = [
  'inspection_must_not_be_treated_as_repair_completion',
  'repo_inspection_must_not_be_treated_as_runtime_proof',
  'weakness_must_not_be_hidden_or_exaggerated',
  'correction_path_must_not_add_useless_layers',
  'private_content_must_not_be_exposed_unnecessarily',
  'source_free_judgment_is_blocked'
] as const;

export function jarvisAssessInspectionCommandRequest(
  request: JarvisInspectionCommandRequest
): JarvisInspectionCommandDecision {
  const missingInspectionBasis = !request.sourceInspected || !request.doctrineAlignmentChecked;
  const evidenceRequired = request.weaknessFound || request.touchesSensitiveOperations || request.touchesPrivateData;
  const missingEvidence = evidenceRequired && !request.evidenceRefsAttached;

  const policyStatus: JarvisInspectionPolicyStatus = missingInspectionBasis || missingEvidence
    ? 'blocked'
    : request.touchesPrivateData || request.touchesSensitiveOperations || request.repairRequested
      ? 'needs_approval'
      : 'allowed';

  const severity: JarvisInspectionSeverity = policyStatus === 'blocked'
    ? 'blocked'
    : request.touchesSensitiveOperations
      ? 'high'
      : request.weaknessFound
        ? 'watch'
        : 'none';

  return {
    intent: 'INSPECTION_LAYER_REVIEW_CONTROL',
    inspectionRole: 'disciplined_examination_before_judgment_not_repair_execution',
    action: request.action,
    affectedLayer: request.affectedLayer,
    policyStatus,
    severity,
    approvalRequired: policyStatus === 'needs_approval',
    repairRequired: request.weaknessFound && request.correctionPathDefined,
    evidenceRequired,
    forbiddenClaims,
    requiredInspectionSteps,
    requiredProof: [
      'affected_layer_or_file',
      'source_inspection_confirmation',
      'doctrine_alignment_result',
      'weakness_list_or_no_weakness_result',
      'severity_reasoning',
      'clean_correction_path',
      'evidence_reference_for_private_sensitive_or_weakness_claims'
    ],
    runtimeProof: null,
    completionStatus: 'inspection_boundary_built_not_inspection_runtime_proven'
  };
}

export const JARVIS_INSPECTION_COMMAND_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  inspectionExecution: 'not_proven_without_source_or_runtime_confirmation',
  repairExecution: 'not_implied_by_inspection',
  evidence: 'required_for_weakness_or_sensitive_claims',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
