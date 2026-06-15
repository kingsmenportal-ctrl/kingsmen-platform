import type { JarvisHudTimelineEntry } from '../../contracts/src/jarvis/ops';

export function jarvisCreateHudTimelineEntry(input: {
  readonly entryRef: string;
  readonly commandRef: string;
  readonly stage: string;
  readonly safeSummary: string;
  readonly createdAtIso?: string;
}): JarvisHudTimelineEntry {
  return {
    entryRef: input.entryRef,
    commandRef: input.commandRef,
    stage: input.stage,
    safeSummary: input.safeSummary,
    createdAtIso: input.createdAtIso ?? new Date().toISOString()
  };
}

export function jarvisAppendHudTimelineEntry(
  entries: readonly JarvisHudTimelineEntry[],
  entry: JarvisHudTimelineEntry
): readonly JarvisHudTimelineEntry[] {
  return [...entries, entry];
}
