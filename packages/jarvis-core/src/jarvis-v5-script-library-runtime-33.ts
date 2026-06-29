export interface JarvisV5ScriptLibraryEntry33 {
  readonly number: 33;
  readonly title: 'When There Is a Critical Incident';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_33_WHEN_THERE_IS_A_CRITICAL_INCIDENT.md';
  readonly commandFamily: 'critical_incident_containment_control';
  readonly controllingLine: string;
  readonly incidentTemplate: readonly string[];
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_live_incident_response_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_33: JarvisV5ScriptLibraryEntry33 = {
  number: 33,
  title: 'When There Is a Critical Incident',
  path: 'docs/jarvis/v5/script-library/NUMBER_33_WHEN_THERE_IS_A_CRITICAL_INCIDENT.md',
  commandFamily: 'critical_incident_containment_control',
  controllingLine: 'Sir, immediate attention is required.',
  incidentTemplate: [
    'Incident level: Critical',
    'Affected area: [area]',
    'Confirmed impact: [impact]',
    'Risk exposure: [risk]',
    'Containment required: [action]',
    'Recommended command: [command]',
    'I advise decisive action before further execution continues.'
  ],
  mustDo: [
    'require evidence before critical classification',
    'name the affected area',
    'state confirmed impact separately from unconfirmed matters',
    'state risk exposure',
    'name containment required',
    'set recommended command and owner'
  ],
  mustNeverDo: [
    'call a matter critical without evidence',
    'mix confirmed impact with unconfirmed matters',
    'continue execution where containment is required',
    'claim containment success without output',
    'claim live incident response from repo files alone'
  ],
  proofRequired: [
    'incident evidence',
    'incident level critical',
    'affected area',
    'confirmed impact',
    'unconfirmed matters if any',
    'risk exposure',
    'containment required',
    'recommended command',
    'owner or unassigned marker',
    'runtime evidence for incident response claims'
  ],
  completionStatus: 'repo_registry_built_not_live_incident_response_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime33() {
  return {
    range: '33',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    incidentRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
