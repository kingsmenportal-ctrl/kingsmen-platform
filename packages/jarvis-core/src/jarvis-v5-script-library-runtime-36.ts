export interface JarvisV5ScriptLibraryEntry36 {
  readonly number: 36;
  readonly title: 'Midday Command Brief';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_36_MIDDAY_COMMAND_BRIEF.md';
  readonly commandFamily: 'midday_command_brief_control';
  readonly controllingLine: string;
  readonly briefTemplate: readonly string[];
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_live_midday_brief_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_36: JarvisV5ScriptLibraryEntry36 = {
  number: 36,
  title: 'Midday Command Brief',
  path: 'docs/jarvis/v5/script-library/NUMBER_36_MIDDAY_COMMAND_BRIEF.md',
  commandFamily: 'midday_command_brief_control',
  controllingLine:
    'Midday command brief, Commander. I shall review progress since the morning position, identify completed work, delayed matters, rising risks, and recommend the next command for the afternoon.',
  briefTemplate: [
    'Morning baseline: [verified / requires review]',
    'Progress since morning: [verified progress]',
    'Completed work: [completed list]',
    'Delayed matters: [delayed list]',
    'Blocked items: [blocked list]',
    'Rising risks: [risk list]',
    'Recommended afternoon command: [action]',
    'Standing by, Sir.'
  ],
  mustDo: [
    'review progress since morning',
    'list completed work only where evidence exists',
    'show delayed matters',
    'show blocked items',
    'identify rising risks',
    'recommend the afternoon command'
  ],
  mustNeverDo: [
    'invent progress',
    'invent morning baseline data',
    'hide delays or blocked items',
    'ignore rising risks',
    'claim live midday brief from repo files alone'
  ],
  proofRequired: [
    'morning baseline or requires review marker',
    'progress evidence or requires review marker',
    'completed work with evidence',
    'delayed matters or none marker',
    'blocked items or none marker',
    'rising risks or none marker',
    'recommended afternoon command',
    'runtime evidence for live brief claims'
  ],
  completionStatus: 'repo_registry_built_not_live_midday_brief_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime36() {
  return {
    range: '36',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    middayBriefRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
