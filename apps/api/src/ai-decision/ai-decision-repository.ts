export interface AiDecisionRepositoryRecord {
  table: string;
  ref: string;
  candidateRef?: string;
  routeRef?: string;
  evidenceRefs: string[];
}

export class AiDecisionRepository {
  private readonly records: AiDecisionRepositoryRecord[] = [];

  save(record: AiDecisionRepositoryRecord): AiDecisionRepositoryRecord {
    if (!record.table.trim()) throw new Error("Repository record table is required.");
    if (!record.ref.trim()) throw new Error("Repository record ref is required.");
    if (record.evidenceRefs.length === 0) throw new Error("AI decision repository records require evidence.");
    this.records.push(record);
    return record;
  }

  listByCandidate(candidateRef: string): AiDecisionRepositoryRecord[] {
    return this.records.filter((record) => record.candidateRef === candidateRef);
  }

  listAll(): AiDecisionRepositoryRecord[] {
    return [...this.records];
  }
}