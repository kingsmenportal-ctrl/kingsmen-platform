export type JarvisStrategyAction =
  | 'strategy_assessment'
  | 'business_strategy'
  | 'national_scope_strategy'
  | 'revenue_protection_strategy'
  | 'candidate_safety_strategy'
  | 'compliance_strategy'
  | 'capacity_strategy'
  | 'launch_strategy'
  | 'risk_tradeoff_strategy'
  | 'next_command_strategy';

export type JarvisStrategyPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export type JarvisStrategyRiskLevel = 'low' | 'watch' | 'high' | 'blocked';

export interface JarvisStrategyCommandRequest {
  readonly commandRef: string;
  readonly action: JarvisStrategyAction;
  readonly objective: string;
  readonly hasVerifiedFacts: boolean;
  readonly hasAssumptionsMarked: boolean;
  readonly hasOperationalValueAssessment: boolean;
  readonly hasNationalScopeAssessment: boolean;
  readonly hasRevenueProtectionAssessment: boolean;
  readonly hasCandidateSafetyAssessment: boolean;
  readonly hasComplianceAssessment: boolean;
  readonly hasCapacityAssessment: boolean;
  readonly hasCommandControlAssessment: boolean;
  readonly proposesNewLayer: boolean;
  readonly layerIsNecessaryAndValidatorProvable: boolean;
  readonly affectsSensitiveOperations: boolean;
  readonly recommendsExecution: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisStrategyCommandDecision {
  readonly intent: 'STRATEGY_COMMAND_ASSESSMENT_CONTROL';
  readonly strategyRole: 'disciplined_command_assessment_not_execution_proof';
  readonly action: JarvisStrategyAction;
  readonly objective: string;
  readonly policyStatus: JarvisStrategyPolicyStatus;
  readonly riskLevel: JarvisStrategyRiskLevel;
  readonly approvalRequired: boolean;
  readonly noUselessLayerCheckRequired: boolean;
  readonly verificationRequired: boolean;
  readonly requiredStrategicLenses: readonly string[];
  readonly forbiddenClaims: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'strategy_boundary_built_not_strategy_execution_proven';
}

const requiredStrategicLenses = [
  'operational_value',
  'national_scope',
  'revenue_protection',
  'candidate_safety',
  'compliance',
  'capacity',
  'command_control',
  'recommended_next_command'
] as const;

const forbiddenClaims = [
  'strategy_text_must_not_be_treated_as_execution_proof',
  'assumptions_must_not_be_presented_as_verified_facts',
  'candidate_safety_must_not_be_traded_for_speed',
  'compliance_must_not_be_skipped_for_convenience',
  'new_layers_must_not_be_added_without_necessity_and_validator_proof',
  'repo_files_must_not_be_treated_as_live_strategy_execution_proof'
] as const;

export function jarvisAssessStrategyCommandRequest(
  request: JarvisStrategyCommandRequest
): JarvisStrategyCommandDecision {
  const missingLens =
    !request.hasVerifiedFacts ||
    !request.hasAssumptionsMarked ||
    !request.hasOperationalValueAssessment ||
    !request.hasNationalScopeAssessment ||
    !request.hasRevenueProtectionAssessment ||
    !request.hasCandidateSafetyAssessment ||
    !request.hasComplianceAssessment ||
    !request.hasCapacityAssessment ||
    !request.hasCommandControlAssessment;

  const uselessLayerRisk = request.proposesNewLayer && !request.layerIsNecessaryAndValidatorProvable;
  const missingProof = missingLens || uselessLayerRisk;

  const policyStatus: JarvisStrategyPolicyStatus = missingProof
    ? 'blocked'
    : request.affectsSensitiveOperations || request.recommendsExecution
      ? 'needs_approval'
      : 'allowed';

  const riskLevel: JarvisStrategyRiskLevel = policyStatus === 'blocked'
    ? 'blocked'
    : request.affectsSensitiveOperations || uselessLayerRisk
      ? 'high'
      : request.recommendsExecution
        ? 'watch'
        : 'low';

  return {
    intent: 'STRATEGY_COMMAND_ASSESSMENT_CONTROL',
    strategyRole: 'disciplined_command_assessment_not_execution_proof',
    action: request.action,
    objective: request.objective,
    policyStatus,
    riskLevel,
    approvalRequired: policyStatus === 'needs_approval',
    noUselessLayerCheckRequired: request.proposesNewLayer,
    verificationRequired: !request.hasVerifiedFacts,
    requiredStrategicLenses,
    forbiddenClaims,
    requiredProof: [
      'strategy_objective',
      'verified_facts_separated_from_assumptions',
      'operational_value_assessment',
      'national_scope_assessment',
      'revenue_protection_assessment',
      'candidate_safety_assessment',
      'compliance_assessment',
      'capacity_assessment',
      'command_control_assessment',
      'recommended_next_command',
      'necessity_and_validator_proof_for_any_new_layer'
    ],
    runtimeProof: null,
    completionStatus: 'strategy_boundary_built_not_strategy_execution_proven'
  };
}

export const JARVIS_STRATEGY_COMMAND_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  strategicAssessment: 'requires_required_lenses_and_source_basis',
  noUselessLayers: 'required_before_new_layer_recommendation',
  execution: 'requires_commander_approval_and_runtime_proof',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
