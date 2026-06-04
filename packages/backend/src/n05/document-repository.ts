export type N05DocumentRepositoryRecord = {
  documentId: string;
  candidateId: string;
  documentTypeCode: string;
  storageRef: string;
  status: string;
  evidenceId?: string;
  auditId?: string;
};

const documents = new Map<string, N05DocumentRepositoryRecord>();

export const n05DocumentRepository = {
  async saveUploadedDocument(record: N05DocumentRepositoryRecord) {
    if (!record.documentId || !record.candidateId || !record.storageRef) {
      throw new Error("N05 repository save requires documentId, candidateId, and storageRef");
    }

    documents.set(record.documentId, record);
    return record;
  },

  async findCandidateDocument(input: { candidateId: string; documentId: string }) {
    const record = documents.get(input.documentId);
    if (!record) return null;

    if (record.candidateId !== input.candidateId) {
      throw new Error("N05 repository blocked: candidate can access only own documents");
    }

    return record;
  },

  async listCandidateDocuments(input: { candidateId: string }) {
    return [...documents.values()].filter((record) => record.candidateId === input.candidateId);
  }
} as const;