export type VaultWriteStatus = 'accepted' | 'needs_review' | 'blocked';

export type VaultDomain =
  | 'doctrine_summary'
  | 'build_decision_summary'
  | 'command_outcome_summary'
  | 'source_intelligence_summary'
  | 'incident_summary'
  | 'visual_product_summary';

export interface VaultEntry {
  id: string;
  domain: VaultDomain;
  title: string;
  summary: string;
  sourceReference: string;
  statusLabel: string;
  createdAt: string;
}

export interface VaultWriteInput {
  domain: VaultDomain;
  title: string;
  summary: string;
  sourceReference: string;
  statusLabel: string;
}

export interface VaultWriteResult {
  status: VaultWriteStatus;
  entry?: VaultEntry;
  reason?: string;
}
