export type N03TruthEntity =
  | "candidate"
  | "service_order"
  | "payment_event"
  | "application"
  | "application_choice"
  | "document"
  | "evidence"
  | "audit_event"
  | "source_authority"
  | "outcome";

export type N03TruthVaultBoundary = {
  schema: "kingsmen.n03-truth-vault-boundary.v1";
  productionReady: false;
  postgresIsTruth: true;
  airtableMirrorOnly: true;
  n8nThinWrapperOnly: true;
  candidateOwnDataBoundary: true;
  evidenceAppendFirst: true;
  auditAppendFirst: true;
};