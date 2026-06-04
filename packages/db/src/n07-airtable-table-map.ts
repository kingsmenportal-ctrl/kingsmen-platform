export const N07_AIRTABLE_TABLE_MAP = [
  { baseName: "Kingsman Nexus-7", tableName: "Sessions", tableGroup: "candidate_portal", postgresTruthTable: "candidate_sessions" },
  { baseName: "Kingsman Nexus-7", tableName: "Form Drafts", tableGroup: "candidate_portal", postgresTruthTable: "candidate_form_drafts" },
  { baseName: "Kingsman Nexus (MSB)", tableName: "Student Profiles", tableGroup: "candidate_portal", postgresTruthTable: "candidates" },
  { baseName: "Applications Hub", tableName: "Applications", tableGroup: "applications", postgresTruthTable: "applications" },
  { baseName: "Applications Hub", tableName: "Timeline", tableGroup: "applications", postgresTruthTable: "application_timeline" },
  { baseName: "Document Vault", tableName: "Documents", tableGroup: "documents", postgresTruthTable: "candidate_documents" },
  { baseName: "Document Vault", tableName: "Document Requests", tableGroup: "documents", postgresTruthTable: "document_requests" },
  { baseName: "Programs & Intelligence", tableName: "Programs", tableGroup: "routes", postgresTruthTable: "route_universe" },
  { baseName: "Programs & Intelligence", tableName: "Source Authorities", tableGroup: "routes", postgresTruthTable: "route_source_authorities" },
  { baseName: "Communications Center", tableName: "Messages", tableGroup: "communications", postgresTruthTable: "messages" },
  { baseName: "Kingsmen Financial Operations", tableName: "Service Orders", tableGroup: "finance", postgresTruthTable: "service_orders" },
  { baseName: "Kingsmen Financial Operations", tableName: "Payments", tableGroup: "finance", postgresTruthTable: "payments" },
  { baseName: "Partner Ecosystem Directory", tableName: "Partners", tableGroup: "partners", postgresTruthTable: "partners" },
  { baseName: "System Operations", tableName: "Health", tableGroup: "operations", postgresTruthTable: "system_health" },
  { baseName: "Automation Control", tableName: "Execution Logs", tableGroup: "automation", postgresTruthTable: "workflow_runs" },
  { baseName: "AI Engine", tableName: "Execution Logs", tableGroup: "ai_logs", postgresTruthTable: "ai_execution_logs" },
  { baseName: "AI Decision & Orchestration Engine", tableName: "Decision Signals", tableGroup: "ai_logs", postgresTruthTable: "decision_signals" }
].map((row) => ({
  ...row,
  mirrorOnly: true,
  canGovernTruth: false,
  rawDocumentAllowed: false,
  secretsAllowed: false,
  serviceRoleAllowed: false,
  productionReady: false
})) as const;

export function assertN07AirtableTableMapSafe() {
  if (N07_AIRTABLE_TABLE_MAP.length < 12) {
    throw new Error("N07 Airtable table map must include mirror mappings across the 12-base universe");
  }

  for (const row of N07_AIRTABLE_TABLE_MAP) {
    if (row.mirrorOnly !== true || row.canGovernTruth !== false) {
      throw new Error(`N07 table map blocked: Airtable cannot govern truth for ${row.baseName}/${row.tableName}`);
    }

    if (row.rawDocumentAllowed !== false || row.secretsAllowed !== false || row.serviceRoleAllowed !== false) {
      throw new Error(`N07 table map blocked: unsafe fields allowed for ${row.baseName}/${row.tableName}`);
    }
  }

  return true;
}