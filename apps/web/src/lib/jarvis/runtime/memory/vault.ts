import type { VaultEntry, VaultWriteInput, VaultWriteResult } from './types';

const MAX_SUMMARY_LENGTH = 1200;

export function createVaultEntry(input: VaultWriteInput): VaultWriteResult {
  if (!input.domain || !input.title || !input.summary || !input.sourceReference || !input.statusLabel) {
    return { status: 'blocked', reason: 'missing_required_memory_fields' };
  }

  if (input.summary.length > MAX_SUMMARY_LENGTH) {
    return { status: 'needs_review', reason: 'summary_too_long' };
  }

  const entry: VaultEntry = {
    id: `mem_${Date.now()}`,
    domain: input.domain,
    title: input.title,
    summary: input.summary,
    sourceReference: input.sourceReference,
    statusLabel: input.statusLabel,
    createdAt: new Date().toISOString(),
  };

  return { status: 'accepted', entry };
}

export function filterVaultEntries(entries: VaultEntry[], domain?: string): VaultEntry[] {
  if (!domain) return entries;
  return entries.filter((entry) => entry.domain === domain);
}
