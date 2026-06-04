export type N03CoreTable =
  | "candidates"
  | "service_orders"
  | "payment_events"
  | "applications"
  | "application_choices"
  | "candidate_documents"
  | "evidence_ledger"
  | "audit_events"
  | "source_authorities"
  | "outcomes";

export type N03CoreTableDefinition = {
  tableName: N03CoreTable;
  authority: "postgres";
  rlsRequired: true;
  appendFirst?: boolean;
  candidateWritable: boolean;
  candidateAuthorityBlocked: string[];
};