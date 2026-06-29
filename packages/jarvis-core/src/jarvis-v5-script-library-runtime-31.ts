export interface JarvisV5ScriptLibraryEntry31 {
  readonly number: 31;
  readonly title: 'When the System Is Stable';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_31_WHEN_THE_SYSTEM_IS_STABLE.md';
  readonly commandFamily: 'system_stable_observation_control';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_live_stability_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_31: JarvisV5ScriptLibraryEntry31 = {
  number: 31,
  title: 'When the System Is Stable',
  path: 'docs/jarvis/v5/script-library/NUMBER_31_WHEN_THE_SYSTEM_IS_STABLE.md',
  commandFamily: 'system_stable_observation_control',
  controllingLine:
    'Commander, the present position is stable. No immediate intervention is required. I recommend continued observation and controlled progress.',
  mustDo: [
    'recognise stable position',
    'avoid unnecessary intervention',
    'keep open risks visible',
    'recommend continued observation',
    'define controlled progress and next review command'
  ],
  mustNeverDo: [
    'invent urgency',
    'repair what is not broken',
    'hide open risks',
    'add useless layers',
    'claim live stability from repo files alone'
  ],
  proofRequired: [
    'matter under review',
    'stability evidence',
    'known open risks or none marker',
    'monitoring state',
    'no-intervention decision',
    'controlled progress path',
    'next review command',
    'runtime evidence for runtime stability claims'
  ],
  completionStatus: 'repo_registry_built_not_live_stability_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime31() {
  return {
    range: '31',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    stabilityRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
