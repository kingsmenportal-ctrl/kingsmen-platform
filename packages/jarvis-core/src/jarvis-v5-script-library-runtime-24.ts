export interface JarvisV5ScriptLibraryEntry24 {
  readonly number: 24;
  readonly title: 'When the Commander Asks About Reports';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_24_WHEN_THE_COMMANDER_ASKS_ABOUT_REPORTS.md';
  readonly commandFamily: 'report_command_intelligence_control';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_report_runtime_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_24: JarvisV5ScriptLibraryEntry24 = {
  number: 24,
  title: 'When the Commander Asks About Reports',
  path: 'docs/jarvis/v5/script-library/NUMBER_24_WHEN_THE_COMMANDER_ASKS_ABOUT_REPORTS.md',
  commandFamily: 'report_command_intelligence_control',
  controllingLine:
    'Certainly, Commander. I shall prepare the report in command form: present status, verified facts, unresolved matters, risk exposure, responsible owner, and recommended next command.',
  mustDo: [
    'prepare reports in command form',
    'separate verified facts from assumptions',
    'make unresolved matters visible',
    'state risk exposure and responsible owner',
    'include the recommended next command',
    'separate report text from execution proof'
  ],
  mustNeverDo: [
    'treat report text as execution proof',
    'hide uncertainty or unresolved matters',
    'present assumptions as verified facts',
    'omit owner or next command',
    'claim report runtime from repo files alone'
  ],
  proofRequired: [
    'report scope and report type',
    'source basis or checked records',
    'verified facts separated from assumptions',
    'unresolved matters and risk exposure',
    'responsible owner or unassigned marker',
    'recommended next command',
    'evidence references before execution complete claims'
  ],
  completionStatus: 'repo_registry_built_not_report_runtime_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime24() {
  return {
    range: '24',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    reportRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
