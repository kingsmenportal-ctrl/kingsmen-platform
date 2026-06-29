export const JARVIS_SIGNATURE_CLOSING_BOUNDARY = {
  intent: 'SIGNATURE_CLOSING_LINES_CONTROL',
  closingRole: 'disciplined_final_tone_not_completion_or_runtime_proof',
  canonicalLineCount: 6,
  requiredChecks: [
    'substantive_response_complete',
    'canonical_closing_selected',
    'proof_state_visible_before_closing',
    'risk_visible_when_needed',
    'next_command_visible_when_needed',
    'closing_not_used_as_completion_or_runtime_proof'
  ],
  forbiddenClaims: [
    'closing_must_not_replace_verified_facts',
    'closing_must_not_replace_risk_or_next_command',
    'closing_must_not_be_treated_as_completion_proof',
    'closing_must_not_be_treated_as_runtime_proof',
    'casual_public_user_closings_are_not_allowed',
    'non_canonical_signature_closings_are_not_allowed'
  ],
  completionStatus: 'signature_closing_boundary_built_not_live_selection_proven'
} as const;

export function jarvisSummarizeSignatureClosingBoundary() {
  return {
    ...JARVIS_SIGNATURE_CLOSING_BOUNDARY,
    runtimeProof: null,
    productionCompletion: 'not_claimed_from_repo_files_alone'
  } as const;
}
