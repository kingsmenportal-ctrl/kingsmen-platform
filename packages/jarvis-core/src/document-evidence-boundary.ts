export type JarvisDocumentAction =
  | 'search_documents'
  | 'open_document'
  | 'inspect_document'
  | 'summarize_document'
  | 'classify_document'
  | 'read_attachment'
  | 'prepare_evidence_pack'
  | 'send_document'
  | 'submit_document'
  | 'link_evidence';

export type JarvisDocumentPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export type JarvisDocumentReadiness = 'ready' | 'missing_evidence' | 'weak_evidence' | 'blocked' | 'unproven';

export interface JarvisDocumentEvidenceRequest {
  readonly commandRef: string;
  readonly action: JarvisDocumentAction;
  readonly documentScope: string;
  readonly documentFound: boolean;
  readonly documentOpened: boolean;
  readonly containsPrivateData: boolean;
  readonly containsSensitiveIdentityOrFinanceData: boolean;
  readonly documentCurrentAndReadable: boolean;
  readonly missingEvidenceDetected: boolean;
  readonly weakEvidenceDetected: boolean;
  readonly executionRequested: boolean;
  readonly explicitExecutionApproval: boolean;
  readonly hasEvidenceLedgerRef: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisDocumentEvidenceDecision {
  readonly intent: 'DOCUMENT_EVIDENCE_READINESS_CONTROL';
  readonly documentRole: 'evidence_bearing_material_not_automatic_truth';
  readonly action: JarvisDocumentAction;
  readonly documentScope: string;
  readonly policyStatus: JarvisDocumentPolicyStatus;
  readonly readiness: JarvisDocumentReadiness;
  readonly approvalRequired: boolean;
  readonly privacyMinimizationRequired: boolean;
  readonly evidenceLedgerRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'document_boundary_built_not_document_runtime_proven';
}

const forbiddenClaims = [
  'file_presence_must_not_be_treated_as_evidence_readiness',
  'document_summary_must_not_be_treated_as_official_status',
  'private_document_contents_must_not_be_exposed_unnecessarily',
  'weak_or_missing_evidence_must_not_be_hidden',
  'documents_must_not_be_sent_or_submitted_without_approval',
  'repo_files_must_not_be_treated_as_live_document_runtime_proof'
] as const;

export function jarvisAssessDocumentEvidenceRequest(
  request: JarvisDocumentEvidenceRequest
): JarvisDocumentEvidenceDecision {
  const openingRequired = request.action !== 'search_documents';
  const executionAction = request.action === 'send_document' || request.action === 'submit_document' || request.executionRequested;
  const evidenceLedgerRequired = executionAction || request.action === 'link_evidence' || request.containsSensitiveIdentityOrFinanceData;
  const privacyMinimizationRequired = request.containsPrivateData || request.containsSensitiveIdentityOrFinanceData;

  const missingProof =
    !request.documentFound ||
    (openingRequired && !request.documentOpened) ||
    !request.documentCurrentAndReadable ||
    (evidenceLedgerRequired && !request.hasEvidenceLedgerRef) ||
    (executionAction && !request.explicitExecutionApproval);

  const policyStatus: JarvisDocumentPolicyStatus = missingProof
    ? 'blocked'
    : executionAction || privacyMinimizationRequired || request.weakEvidenceDetected || request.missingEvidenceDetected
      ? 'needs_approval'
      : 'allowed';

  const readiness: JarvisDocumentReadiness = policyStatus === 'blocked'
    ? 'blocked'
    : request.missingEvidenceDetected
      ? 'missing_evidence'
      : request.weakEvidenceDetected
        ? 'weak_evidence'
        : request.documentFound && request.documentOpened && request.documentCurrentAndReadable
          ? 'ready'
          : 'unproven';

  return {
    intent: 'DOCUMENT_EVIDENCE_READINESS_CONTROL',
    documentRole: 'evidence_bearing_material_not_automatic_truth',
    action: request.action,
    documentScope: request.documentScope,
    policyStatus,
    readiness,
    approvalRequired: policyStatus === 'needs_approval',
    privacyMinimizationRequired,
    evidenceLedgerRequired,
    forbiddenClaims,
    requiredProof: [
      'document_found_confirmation',
      'document_open_or_attachment_read_confirmation_when_inspection_is_required',
      'readability_currency_and_completeness_check',
      'missing_or_weak_evidence_list',
      'evidence_ledger_reference_for_execution_or_sensitive_evidence',
      'explicit_approval_before_send_or_submit_actions'
    ],
    runtimeProof: null,
    completionStatus: 'document_boundary_built_not_document_runtime_proven'
  };
}

export const JARVIS_DOCUMENT_EVIDENCE_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  documentConnection: 'not_proven_without_file_tool_confirmation',
  documentInspection: 'required_before_readiness_claim',
  evidenceLedger: 'required_for_sensitive_or_execution_affecting_documents',
  execution: 'requires_explicit_approval_and_route_proof',
  productionCompletion: 'not_claimed_from_repo_files_alone'
} as const;
