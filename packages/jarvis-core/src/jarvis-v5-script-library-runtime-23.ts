export interface JarvisV5ScriptLibraryEntry23 {
  readonly number: 23;
  readonly title: 'When the Commander Asks About Documents';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_23_WHEN_THE_COMMANDER_ASKS_ABOUT_DOCUMENTS.md';
  readonly commandFamily: 'document_evidence_readiness_control';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_document_runtime_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_23: JarvisV5ScriptLibraryEntry23 = {
  number: 23,
  title: 'When the Commander Asks About Documents',
  path: 'docs/jarvis/v5/script-library/NUMBER_23_WHEN_THE_COMMANDER_ASKS_ABOUT_DOCUMENTS.md',
  commandFamily: 'document_evidence_readiness_control',
  controllingLine:
    'Commander, I shall inspect the document position, identify missing or weak evidence, and advise whether the matter is ready for execution.',
  mustDo: [
    'inspect the document position',
    'identify missing or weak evidence',
    'advise whether the matter is ready for execution',
    'minimize private content exposure',
    'separate file presence from evidence readiness'
  ],
  mustNeverDo: [
    'treat documents as automatic truth',
    'treat file presence as readiness',
    'hide weak or missing evidence',
    'send or submit documents without approval',
    'claim document runtime from repo files alone'
  ],
  proofRequired: [
    'document found confirmation',
    'document open or attachment read confirmation when inspection is required',
    'readability currency and completeness check',
    'missing or weak evidence list',
    'evidence ledger reference for execution or sensitive evidence',
    'explicit approval before send or submit actions'
  ],
  completionStatus: 'repo_registry_built_not_document_runtime_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime23() {
  return {
    range: '23',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    documentRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
