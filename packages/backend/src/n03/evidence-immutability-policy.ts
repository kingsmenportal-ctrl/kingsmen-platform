export function assertN03EvidenceAppendOnly(input: {
  action: "create_evidence" | "read_evidence" | "update_evidence" | "delete_evidence" | "overwrite_evidence";
}) {
  if (input.action === "delete_evidence") {
    throw new Error("Evidence deletion is blocked; create correction evidence instead");
  }

  if (input.action === "overwrite_evidence" || input.action === "update_evidence") {
    throw new Error("Evidence overwrite/update is blocked; append correction evidence instead");
  }

  return true;
}

export function buildN03EvidenceRecord(input: {
  evidenceId: string;
  entityType: string;
  entityId: string;
  evidenceType: string;
  safeSummary: string;
  candidateId?: string;
  storageRef?: string;
  sha256?: string;
}) {
  if (!input.evidenceId || !input.entityType || !input.entityId || !input.evidenceType || !input.safeSummary) {
    throw new Error("Evidence record requires evidenceId, entity, evidenceType, and safeSummary");
  }

  return {
    ...input,
    appendOnly: true,
    canDelete: false,
    canOverwrite: false,
    createdAt: new Date().toISOString()
  } as const;
}