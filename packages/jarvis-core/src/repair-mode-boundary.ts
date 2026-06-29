export const JARVIS_REPAIR_MODE_BOUNDARY = {
  intent: 'REPAIR_FAULT_ISOLATION_CONTROL',
  repairRole: 'fault_isolation_and_restoration_not_blind_rewrite',
  controllingLine:
    'Repair mode engaged, Sir. I shall isolate the fault, preserve what remains sound, remove the defective direction, and restore the matter to a disciplined Kingsmen standard.',
  requiredSteps: [
    'fault_isolated',
    'source_inspected',
    'sound_material_preserved',
    'defective_direction_removed',
    'corrected_path_restored',
    'validation_or_evidence_captured',
    'next_corrective_command_set'
  ],
  forbiddenClaims: [
    'patch_text_must_not_be_treated_as_repair_success',
    'sound_material_must_be_preserved',
    'defective_direction_must_be_named',
    'validation_required_before_success_claim',
    'repo_files_must_not_be_treated_as_live_repair_execution_proof'
  ],
  completionStatus: 'repair_boundary_built_not_repair_execution_proven'
} as const;

export function jarvisSummarizeRepairModeBoundary() {
  return JARVIS_REPAIR_MODE_BOUNDARY;
}
