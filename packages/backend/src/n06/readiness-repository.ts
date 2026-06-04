export type N06ReadinessRecord = {
  readinessId: string;
  candidateId: string;
  routeId: string;
  readinessStatus: string;
  blockers: string[];
  candidateCanVerifySource: false;
  candidateCanMarkSubmitted: false;
  candidateCanMarkPaid: false;
  productionReady: false;
};

const readinessRecords = new Map<string, N06ReadinessRecord>();

export const n06ReadinessRepository = {
  async saveReadiness(record: N06ReadinessRecord) {
    if (!record.readinessId || !record.candidateId || !record.routeId) {
      throw new Error("N06 readiness repository save requires readinessId, candidateId, and routeId");
    }

    readinessRecords.set(record.readinessId, record);
    return record;
  },

  async listCandidateReadiness(candidateId: string) {
    return [...readinessRecords.values()].filter((record) => record.candidateId === candidateId);
  }
} as const;