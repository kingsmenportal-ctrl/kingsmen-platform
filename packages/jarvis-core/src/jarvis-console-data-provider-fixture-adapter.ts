import type { JarvisConsoleBackendSnapshot } from '../../contracts/src/jarvis/console-backend-read-contract';

export interface JarvisConsoleDataProviderFixtureInput {
  readonly nowIso: string;
  readonly sourceName?: string;
}

export function jarvisConsoleDataProviderFixtureAdapter(
  input: JarvisConsoleDataProviderFixtureInput,
): JarvisConsoleBackendSnapshot {
  return {
    snapshotRef: 'jarvis-console-fixture-snapshot',
    generatedAtIso: input.nowIso,
    sourceName: input.sourceName ?? 'fixture',
    status: 'ready',
    activeSessionCount: 1,
    pendingReviewCount: 1,
    latestValidatorStatus: 'pass',
    safeSummary: 'Fixture-backed read model for founder console smoke checks.',
  };
}
