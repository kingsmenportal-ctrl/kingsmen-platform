export type EvidenceType =
  | "COMMAND"
  | "WORKFLOW"
  | "DOCUMENT"
  | "SOURCE_CHECK"
  | "MANUAL_MAP"
  | "COMMUNICATION"
  | "PAYMENT"
  | "STATUS"
  | "OVERRIDE";

export type SourceConfidenceBand = "A" | "B" | "C" | "D";

export interface EvidenceLedgerInput {
  evidenceType: EvidenceType;
  candidateId?: string;
  applicationId?: string;
  commandId?: string;
  workflowRunId?: string;
  sourceName: string;
  sourceUrl?: string;
  sourceConfidenceBand: SourceConfidenceBand;
  summary: string;
  protectedData?: boolean;
  payload?: Record<string, unknown>;
}

export interface EvidenceLedgerRecord extends EvidenceLedgerInput {
  evidenceRef: string;
  createdAt: string;
}

export function createEvidenceRef(prefix = "evd"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function buildEvidenceRecord(input: EvidenceLedgerInput): EvidenceLedgerRecord {
  if (!input.sourceName) throw new Error("Evidence sourceName is required.");
  if (!input.summary || input.summary.trim().length < 3) throw new Error("Evidence summary is required.");

  return {
    ...input,
    evidenceRef: createEvidenceRef(),
    protectedData: input.protectedData ?? false,
    payload: input.payload ?? {},
    createdAt: new Date().toISOString()
  };
}