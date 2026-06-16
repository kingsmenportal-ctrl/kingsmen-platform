export interface JarvisConsoleReadModelCacheEntry<TViewModel = unknown> {
  readonly cacheRef: string;
  readonly viewRef: string;
  readonly storedAtIso: string;
  readonly expiresAtIso: string | null;
  readonly viewModel: TViewModel;
  readonly safeSummary: string;
}

export interface JarvisConsoleReadModelCache<TViewModel = unknown> {
  readonly cacheName: 'JarvisConsoleReadModelCache';
  readonly maxEntries: number;
  readonly entries: readonly JarvisConsoleReadModelCacheEntry<TViewModel>[];
  readonly readOnly: true;
}

export function jarvisCreateConsoleReadModelCache<TViewModel>(input: {
  readonly maxEntries?: number;
  readonly entries?: readonly JarvisConsoleReadModelCacheEntry<TViewModel>[];
}): JarvisConsoleReadModelCache<TViewModel> {
  return {
    cacheName: 'JarvisConsoleReadModelCache',
    maxEntries: input.maxEntries ?? 25,
    entries: input.entries ?? [],
    readOnly: true
  };
}

export function jarvisAddConsoleReadModelCacheEntry<TViewModel>(input: {
  readonly cache: JarvisConsoleReadModelCache<TViewModel>;
  readonly entry: JarvisConsoleReadModelCacheEntry<TViewModel>;
}): JarvisConsoleReadModelCache<TViewModel> {
  const nextEntries = [input.entry, ...input.cache.entries].slice(0, input.cache.maxEntries);
  return {
    cacheName: 'JarvisConsoleReadModelCache',
    maxEntries: input.cache.maxEntries,
    entries: nextEntries,
    readOnly: true
  };
}
