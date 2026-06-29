export type JarvisEvidenceMissingAction =
  | 'check_evidence'
  | 'classify_missing_proof'
  | 'hold_execution'
  | 'request_required_proof'
  | 'mark_unverified'
  | 'review_source_confidence'
  | 'review_runtime_proof'
  | 'review_official_status_proof';

export type JarvisEvidenceVerificationStatus = 'verified' | 'unverified' | 'blocked_missing_evidence';
export type JarvisEvidencePolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisEvidenceMissingRequest {
  readonly commandRef: string;
  readonly action: JarvisEvidenceMissingAction;
  readonly matter: string;
  readonly claimBeingVerified: string;
  readonly presentEvidence: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly requiredProofPresent: boolean;
  readonly affectsSensitiveState: boolean;
  readonly executionRequested: boolean;
  readonly runtimeOrProductionClaimed: boolean;
  readonly officialStatusClaimed: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisEvidenceMissingDecision {
  readonly intent: 'EVIDENCE_MISSING_VERIFICATION_HOLD_CONTROL';
  readonly evidenceRole: 'missing_evidence_blocks_verified_status_and_execution';
  readonly action: JarvisEvidenceMissingAction;
  readonly matter: string;
  readonly claimBeingVerified: string;
  readonly verificationStatus: JarvisEvidenceVerificationStatus;
  readonly policyStatus: JarvisEvidencePolicyStatus;
  readonly holdExecution: boolean;
  readonly proofRequestRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredEvidenceSteps: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'evidence_missing_boundary_built_not_live_verification_proven';
}

const requiredEvidenceSteps = [
  'claim_identified',
  'present_evidence_listed',
  'missing_evidence_listed',
  'verification_status_marked_unverified_when_incomplete',
  'execution_held_when_required_proof_is_missing',
  'next_proof_command_set'
] as const;

const forbiddenClaims = [
  'incomplete_evidence_must_not_be_marked_verified',
  'assumption_must_not_be_presented_as_proof',
  'screenshot_or_summary_must_not_be_treated_as_final_proof_without_verification',
  'official_status_must_not_be_claimed_without_source_proof',
  'runtime_or_production_status_must_not_be_claimed_without_runtime_evidence',
  'repo_files_must_not_be_treated_as_live_evidence_verification_proof'
] as const;

export function jarvisAssessEvidenceMissingRequest(
  request: JarvisEvidenceMissingRequest
): JarvisEvidenceMissingDecision {
  const evidenceIncomplete = !request.requiredProofPresent || request.missingEvidence.length > 0;
  const highImpactClaim = request.affectsSensitiveState || request.runtimeOrProductionClaimed || request.officialStatusClaimed;
  const mustHold = evidenceIncomplete && (request.executionRequested || highImpactClaim);

  const verificationStatus: JarvisEvidenceVerificationStatus = evidenceIncomplete
    ? mustHold
      ? 'blocked_missing_evidence'
      : 'unverified'
    : 'verified';

  const policyStatus: JarvisEvidencePolicyStatus = mustHold
    ? 'blocked'
    : evidenceIncomplete || highImpactClaim
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'EVIDENCE_MISSING_VERIFICATION_HOLD_CONTROL',
    evidenceRole: 'missing_evidence_blocks_verified_status_and_execution',
    action: request.action,
    matter: request.matter,
    claimBeingVerified: request.claimBeingVerified,
    verificationStatus,
    policyStatus,
    holdExecution: mustHold,
    proofRequestRequired: evidenceIncomplete,
    forbiddenClaims,
    requiredEvidenceSteps,
    requiredProof: [
      'matter_under_review',
      'claim_being_verified',
      'present_evidence_list',
      'missing_evidence_list',
      'verification_status',
      'hold_decision_when_required_proof_is_missing',
      'next_proof_command',
      'runtime_evidence_for_runtime_or_production_claims'
    ],
    runtimeProof: null,
    completionStatus: 'evidence_missing_boundary_built_not_live_verification_proven'
  };
}

export const JARVIS_EVIDENCE_MISSING_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  liveEvidenceInspection: 'not_proven_without_source_or_tool_confirmation',
  verifiedStatus: 'blocked_when_required_proof_is_missing',
  execution: 'held_until_required_proof_is_secured',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
