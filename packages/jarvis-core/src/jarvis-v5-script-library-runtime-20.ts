export interface JarvisV5ScriptLibraryEntry20 {
  readonly number: 20;
  readonly title: 'When the Commander Asks About PayFast';
  readonly path: 'docs/jarvis/v5/script-library/NUMBER_20_WHEN_THE_COMMANDER_ASKS_ABOUT_PAYFAST.md';
  readonly commandFamily: 'payfast_payment_provider_boundary';
  readonly controllingLine: string;
  readonly mustDo: readonly string[];
  readonly mustNeverDo: readonly string[];
  readonly proofRequired: readonly string[];
  readonly completionStatus: 'repo_registry_built_not_payment_provider_runtime_proven';
}

export const JARVIS_V5_SCRIPT_LIBRARY_NUMBER_20: JarvisV5ScriptLibraryEntry20 = {
  number: 20,
  title: 'When the Commander Asks About PayFast',
  path: 'docs/jarvis/v5/script-library/NUMBER_20_WHEN_THE_COMMANDER_ASKS_ABOUT_PAYFAST.md',
  commandFamily: 'payfast_payment_provider_boundary',
  controllingLine:
    'Commander, Payfast must be treated as the payment provider. Paid execution must remain locked until payment proof or provider confirmation is verified.',
  mustDo: [
    'treat PayFast as payment provider only',
    'keep paid execution locked until verified proof exists',
    'separate checkout intent from payment success',
    'require backend payment state and evidence ledger reference',
    'separate sandbox proof from live provider proof'
  ],
  mustNeverDo: [
    'unlock paid execution without provider confirmation or verified proof',
    'treat screenshots as final payment truth',
    'treat checkout URL as payment success',
    'expose payment secrets client-side',
    'claim provider runtime from repo files alone'
  ],
  proofRequired: [
    'provider confirmation or verified payment proof',
    'backend payment state record',
    'evidence ledger reference',
    'finance reconciliation for refund or dispute matters',
    'runtime provider output before live payment success claims'
  ],
  completionStatus: 'repo_registry_built_not_payment_provider_runtime_proven'
} as const;

export function jarvisSummarizeV5ScriptRuntime20() {
  return {
    range: '20',
    totalRegistered: 1,
    runtimeRegistry: 'built',
    paymentProviderRuntime: 'not_proven_by_registry',
    productionCompletion: 'not_claimed_without_runtime_execution'
  } as const;
}
