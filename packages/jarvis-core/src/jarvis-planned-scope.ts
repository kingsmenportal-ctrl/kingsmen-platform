export interface JarvisPlannedScope {
  readonly planRef: string;
  readonly requestRef: string;
  readonly moduleRef: string;
  readonly safeOnly: true;
  readonly scopePaths: readonly string[];
  readonly labels: readonly string[];
  readonly createdAtIso: string;
}

export function jarvisCreatePlannedScope(input: JarvisPlannedScope): JarvisPlannedScope {
  return {
    ...input,
    safeOnly: true,
  };
}
