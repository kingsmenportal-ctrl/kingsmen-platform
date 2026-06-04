export type N07AirtableMirrorTableGroup =
  | "candidate_portal"
  | "applications"
  | "documents"
  | "routes"
  | "communications"
  | "finance"
  | "partners"
  | "operations"
  | "automation"
  | "ai_logs";

export type N07AirtableTableMapRow = {
  baseName: string;
  tableName: string;
  tableGroup: N07AirtableMirrorTableGroup;
  postgresTruthTable: string;
  mirrorOnly: true;
  canGovernTruth: false;
  rawDocumentAllowed: false;
  secretsAllowed: false;
  serviceRoleAllowed: false;
  productionReady: false;
};