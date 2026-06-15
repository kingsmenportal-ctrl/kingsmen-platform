export interface JarvisRepoChangeSummary {
  readonly summaryRef: string;
  readonly commandRef: string;
  readonly branch: string;
  readonly paths: readonly string[];
  readonly safeSummary: string;
}

export function jarvisCreateRepoChangeSummary(input: {
  readonly summaryRef: string;
  readonly commandRef: string;
  readonly branch: string;
  readonly paths: readonly string[];
  readonly safeSummary?: string;
}): JarvisRepoChangeSummary {
  return {
    summaryRef: input.summaryRef,
    commandRef: input.commandRef,
    branch: input.branch,
    paths: input.paths,
    safeSummary:
      input.safeSummary ??
      `Jarvis repo change summary recorded ${input.paths.length} path(s) on ${input.branch}.`
  };
}
