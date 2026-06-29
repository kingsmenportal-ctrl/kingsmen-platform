export interface JarvisV5ScriptLibraryEntry27 {
  readonly number: 27;
  readonly title: 'When the Commander Asks for Inspection';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_27_WHEN_THE_COMMANDER_ASKS_FOR_INSPECTION.md';
  readonly commandFamily: 'inspection_layer_review_control';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_inspection_runtime_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_27: JarvisV5ScriptLibraryEntry27 = {
  number: 27,
  title: 'When the Commander Asks for Inspection',
  path: 'docs/jarvis/v5/script-library/NUMBER_27_WHEN_THE_COMMANDER_ASKS_FOR_INSPECTION.md',
  commandFamily: 'inspection_layer_review_control',
  controllingLine:
    'Inspection mode engaged, Commander. I shall examine the affected layer, confirm doctrine alignment, expose any weakness, and return the cleanest correction path.',
  mustDo: [
    'examine the affected layer',
    'confirm doctrine alignment',
    'expose weaknesses without exaggeration',
    'return the cleanest correction path',
    'separate inspection from repair execution'
  ],
  mustNeverDo: [
    'judge without source inspection',
    'treat inspection as repair completion',
    'hide weakness or overstate severity',
    'add useless layers',
    'claim inspection runtime from repo files alone'
  ],
  proofRequired: [
    'affected layer or file',
    'source inspection confirmation',
    'doctrine alignment result',
    'weakness list or no weakness result',
    'severity reasoning',
    'clean correction path',
    'evidence reference for sensitive or weakness claims'
  ],
  completionStatus: 'repo_registry_built_not_inspection_runtime_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime27() {
  return {
    range: '27',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    inspectionRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
