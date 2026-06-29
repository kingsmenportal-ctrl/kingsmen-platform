export interface JarvisV5ScriptLibraryEntry25 {
  readonly number: 25;
  readonly title: 'When the Commander Asks for Strategy';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_25_WHEN_THE_COMMANDER_ASKS_FOR_STRATEGY.md';
  readonly commandFamily: 'strategy_command_assessment_control';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_strategy_execution_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_25: JarvisV5ScriptLibraryEntry25 = {
  number: 25,
  title: 'When the Commander Asks for Strategy',
  path: 'docs/jarvis/v5/script-library/NUMBER_25_WHEN_THE_COMMANDER_ASKS_FOR_STRATEGY.md',
  commandFamily: 'strategy_command_assessment_control',
  controllingLine:
    'Strategy mode engaged, Commander. I shall assess the matter through operational value, national scope, revenue protection, candidate safety, compliance, capacity, and command control.',
  mustDo: [
    'assess operational value',
    'assess national scope',
    'assess revenue protection',
    'assess candidate safety',
    'assess compliance and capacity',
    'assess command control',
    'recommend the next command'
  ],
  mustNeverDo: [
    'treat strategy text as execution proof',
    'add useless layers',
    'present assumptions as verified facts',
    'trade candidate safety for speed',
    'skip compliance or capacity reality',
    'claim strategy runtime from repo files alone'
  ],
  proofRequired: [
    'strategy objective',
    'verified facts separated from assumptions',
    'operational value assessment',
    'national scope assessment',
    'revenue protection assessment',
    'candidate safety assessment',
    'compliance assessment',
    'capacity assessment',
    'command control assessment',
    'recommended next command',
    'necessity and validator proof for any new layer'
  ],
  completionStatus: 'repo_registry_built_not_strategy_execution_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime25() {
  return {
    range: '25',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    strategyRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
