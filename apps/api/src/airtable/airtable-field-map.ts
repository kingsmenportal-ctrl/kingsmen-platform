export type AirtableFieldClass =
  | "mirror"
  | "intake"
  | "operator_note"
  | "computed_status"
  | "evidence_pointer";

export interface AirtableFieldMapping {
  postgresColumn: string;
  airtableFieldName: string;
  fieldClass: AirtableFieldClass;
  transformRule: "copy" | "stringify_json" | "status_label" | "evidence_ref" | "redact_sensitive";
  writeToAirtable: boolean;
  readFromAirtable: boolean;
  requiresOperatorReview: boolean;
}

export const CORE_FIELD_MAPPINGS: Record<string, readonly AirtableFieldMapping[]> = {
  applications: [
    {
      postgresColumn: "id",
      airtableFieldName: "Backend Application ID",
      fieldClass: "evidence_pointer",
      transformRule: "copy",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    },
    {
      postgresColumn: "candidate_id",
      airtableFieldName: "Candidate ID",
      fieldClass: "evidence_pointer",
      transformRule: "copy",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    },
    {
      postgresColumn: "current_state",
      airtableFieldName: "Backend State",
      fieldClass: "computed_status",
      transformRule: "status_label",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    },
    {
      postgresColumn: "source_confidence",
      airtableFieldName: "Source Confidence",
      fieldClass: "mirror",
      transformRule: "copy",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    }
  ],
  candidate_documents: [
    {
      postgresColumn: "document_type",
      airtableFieldName: "Document Type",
      fieldClass: "mirror",
      transformRule: "copy",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    },
    {
      postgresColumn: "verification_status",
      airtableFieldName: "Verification Status",
      fieldClass: "computed_status",
      transformRule: "status_label",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    },
    {
      postgresColumn: "evidence_ref",
      airtableFieldName: "Evidence Ref",
      fieldClass: "evidence_pointer",
      transformRule: "evidence_ref",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    }
  ],
  operator_approvals: [
    {
      postgresColumn: "approval_ref",
      airtableFieldName: "Approval Ref",
      fieldClass: "evidence_pointer",
      transformRule: "copy",
      writeToAirtable: true,
      readFromAirtable: false,
      requiresOperatorReview: true
    },
    {
      postgresColumn: "operator_note",
      airtableFieldName: "Operator Note",
      fieldClass: "operator_note",
      transformRule: "copy",
      writeToAirtable: true,
      readFromAirtable: true,
      requiresOperatorReview: true
    }
  ],
  candidate_form_drafts: [
    {
      postgresColumn: "field_source_summary",
      airtableFieldName: "Field Source Summary",
      fieldClass: "intake",
      transformRule: "stringify_json",
      writeToAirtable: true,
      readFromAirtable: true,
      requiresOperatorReview: true
    }
  ]
};

export function getFieldMappings(postgresTable: string): readonly AirtableFieldMapping[] {
  return CORE_FIELD_MAPPINGS[postgresTable] ?? [];
}