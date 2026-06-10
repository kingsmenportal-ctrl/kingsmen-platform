import type { AirtableSyncTarget } from "./airtable-types";

export const AIRTABLE_SYNC_TARGETS: readonly AirtableSyncTarget[] = [
  {
    baseKey: "applications_hub",
    tableKey: "applications",
    tableName: "Applications",
    postgresTable: "applications",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 10,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "applications_hub",
    tableKey: "timeline",
    tableName: "Timeline",
    postgresTable: "application_timeline",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 20,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "document_vault",
    tableKey: "documents",
    tableName: "Documents",
    postgresTable: "candidate_documents",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 10,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "document_vault",
    tableKey: "document_requests",
    tableName: "Document Requests",
    postgresTable: "document_requests",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 10,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "programs_intelligence",
    tableKey: "programs",
    tableName: "Programs",
    postgresTable: "route_programs",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 40,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "programs_intelligence",
    tableKey: "institutions",
    tableName: "Institutions",
    postgresTable: "route_institutions",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 40,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "partner_ecosystem",
    tableKey: "portal_dna",
    tableName: "Portal DNA",
    postgresTable: "portal_dna",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 30,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "automation_control",
    tableKey: "approvals_queue",
    tableName: "Approvals Queue",
    postgresTable: "operator_approvals",
    direction: "BIDIRECTIONAL_REVIEWED",
    priority: 5,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "communications_center",
    tableKey: "messages",
    tableName: "Messages",
    postgresTable: "candidate_messages",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 15,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "financial_operations",
    tableKey: "invoices",
    tableName: "Invoices",
    postgresTable: "invoices",
    direction: "POSTGRES_TO_AIRTABLE",
    priority: 15,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "nexus_7",
    tableKey: "form_drafts",
    tableName: "Form Drafts",
    postgresTable: "candidate_form_drafts",
    direction: "AIRTABLE_TO_POSTGRES_INTAKE_ONLY",
    priority: 10,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  },
  {
    baseKey: "nexus_msb",
    tableKey: "student_profiles",
    tableName: "Student Profiles",
    postgresTable: "candidate_profiles",
    direction: "BIDIRECTIONAL_REVIEWED",
    priority: 10,
    backendStateAuthoritative: true,
    inboundRequiresOperatorReview: true
  }
] as const;

export function getAirtableSyncTarget(baseKey: string, tableKey: string): AirtableSyncTarget {
  const target = AIRTABLE_SYNC_TARGETS.find((item) => item.baseKey === baseKey && item.tableKey === tableKey);
  if (!target) {
    throw new Error(`Unknown Airtable sync target: ${baseKey}.${tableKey}`);
  }
  return target;
}