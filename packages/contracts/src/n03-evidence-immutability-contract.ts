export type N03EvidenceRecord = {
  evidenceId: string;
  candidateId?: string;
  entityType: string;
  entityId: string;
  evidenceType: string;
  safeSummary: string;
  storageRef?: string;
  sha256?: string;
  appendOnly: true;
  canDelete: false;
  canOverwrite: false;
  createdAt: string;
};