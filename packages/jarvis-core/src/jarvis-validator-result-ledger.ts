import type {
  JarvisValidatorResultLedger,
  JarvisValidatorResultRecord,
  JarvisValidatorStatus
} from '../../contracts/src/jarvis/patch-plan';

export function jarvisResolveValidatorStatus(
  results: readonly JarvisValidatorResultRecord[]
): JarvisValidatorStatus {
  if (results.length === 0) return 'not_run';
  if (results.some((result) => result.status === 'failed')) return 'failed';
  if (results.some((result) => result.status === 'warning')) return 'warning';
  if (results.every((result) => result.status === 'passed')) return 'passed';
  return 'not_run';
}

export function jarvisCreateValidatorResultLedger(input: {
  readonly ledgerRef: string;
  readonly commandRef: string;
  readonly moduleRef: string;
  readonly results: readonly JarvisValidatorResultRecord[];
  readonly safeSummary?: string;
}): JarvisValidatorResultLedger {
  const overallStatus = jarvisResolveValidatorStatus(input.results);
  return {
    ledgerRef: input.ledgerRef,
    commandRef: input.commandRef,
    moduleRef: input.moduleRef,
    results: input.results,
    overallStatus,
    safeSummary:
      input.safeSummary ??
      `Jarvis validator ledger recorded ${input.results.length} validator result(s) with overall status ${overallStatus}.`
  };
}
