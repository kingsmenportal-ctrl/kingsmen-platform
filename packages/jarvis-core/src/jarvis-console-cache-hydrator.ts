import { jarvisAddConsoleReadModelCacheEntry, jarvisCreateConsoleReadModelCache } from './jarvis-console-read-model-cache';

export function jarvisHydrateConsoleReadModelCache<TViewModel>(input: {
  readonly cacheRef: string;
  readonly viewRef: string;
  readonly storedAtIso: string;
  readonly expiresAtIso?: string | null;
  readonly viewModel: TViewModel;
  readonly safeSummary: string;
}) {
  const emptyCache = jarvisCreateConsoleReadModelCache<TViewModel>({ maxEntries: 25 });

  return jarvisAddConsoleReadModelCacheEntry({
    cache: emptyCache,
    entry: {
      cacheRef: input.cacheRef,
      viewRef: input.viewRef,
      storedAtIso: input.storedAtIso,
      expiresAtIso: input.expiresAtIso ?? null,
      viewModel: input.viewModel,
      safeSummary: input.safeSummary
    }
  });
}

export const JARVIS_CONSOLE_CACHE_HYDRATOR = 'JarvisConsoleCacheHydrator';
