export interface DoclingAdapterRequest {
  documentId: string;
  candidateId?: string;
  storagePath?: string;
  filename?: string;
  mimeType?: string;
  purpose: 'candidate_smart_intake' | 'document_review' | 'manual_package_support';
}

export interface DoclingAdapterResponse {
  ok: boolean;
  documentId: string;
  candidateId?: string;
  extractedText?: string;
  tables?: Array<{ title?: string; rows: string[][] }>;
  warnings: string[];
  evidence: {
    adapterId: 'DoclingAdapter';
    repository: 'DS4SD/docling';
    mode: 'sidecar_or_local_parser_contract';
    reviewRequired: true;
  };
}

export const DoclingAdapterContract = {
  adapterId: 'DoclingAdapter',
  repository: 'DS4SD/docling',
  status: 'contract_ready',
  productionTruthWrite: false,
  requiresReviewBeforeProfileUpdate: true,
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ],
  blockedPayloads: [
    'api_keys',
    'payment_secrets',
    'raw_candidate_bundle_in_llm_prompt',
    'automatic_truth_write'
  ],
  outputMustInclude: [
    'extractedText_or_tables',
    'warnings',
    'reviewRequired',
    'evidence'
  ]
} as const;

export function assertDoclingAdapterRequestSafe(request: DoclingAdapterRequest): string[] {
  const warnings: string[] = [];

  if (!request.documentId?.trim()) warnings.push('documentId is required.');
  if (!request.purpose) warnings.push('purpose is required.');
  if (request.storagePath?.includes('..')) warnings.push('storagePath may not contain path traversal segments.');

  return warnings;
}
