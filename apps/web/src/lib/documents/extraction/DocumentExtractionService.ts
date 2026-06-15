import { mapExtractedTextToCandidateDraftFields, type DocumentDraftField } from './DocumentFieldMapper';

export type DocumentExtractionEngine = 'docling_sidecar' | 'plain_text_fallback';

export interface DocumentExtractionRequest {
  documentId: string;
  candidateId?: string;
  filename?: string;
  mimeType?: string;
  extractedText?: string;
  engine?: DocumentExtractionEngine;
}

export interface DocumentExtractionEvidence {
  evidenceId: string;
  documentId: string;
  candidateId?: string;
  engine: DocumentExtractionEngine;
  createdAt: string;
  source: 'document_text' | 'sidecar_pending';
  warnings: string[];
}

export interface DocumentExtractionResult {
  ok: boolean;
  mode: 'candidate_draft_review';
  documentId: string;
  candidateId?: string;
  engine: DocumentExtractionEngine;
  fields: DocumentDraftField[];
  warnings: string[];
  reviewRequired: boolean;
  mayWriteCandidateTruth: false;
  nextAction: string;
  evidence: DocumentExtractionEvidence;
}

const normalizeEngine = (engine?: DocumentExtractionEngine): DocumentExtractionEngine => engine ?? 'plain_text_fallback';

const createEvidenceId = (documentId: string) => {
  const safeId = documentId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'document';
  return `doc_extract_${safeId}_${Date.now()}`;
};

export function extractCandidateDraftFromDocument(request: DocumentExtractionRequest): DocumentExtractionResult {
  const engine = normalizeEngine(request.engine);
  const warnings: string[] = [];

  if (!request.documentId?.trim()) {
    warnings.push('Document id is required for extraction evidence.');
  }

  if (engine === 'docling_sidecar') {
    warnings.push('Docling sidecar contract is selected, but this service only consumes reviewed extracted text until the sidecar is installed and validated.');
  }

  const text = request.extractedText?.trim() ?? '';
  if (!text) {
    warnings.push('No extracted text was supplied. The document must be parsed by Docling or a fallback extractor before field mapping.');
  }

  const mapping = text ? mapExtractedTextToCandidateDraftFields(text) : { fields: [], warnings: [], reviewRequired: true };
  const mergedWarnings = [...warnings, ...mapping.warnings];

  return {
    ok: text.length > 0 && mapping.fields.length > 0,
    mode: 'candidate_draft_review',
    documentId: request.documentId,
    candidateId: request.candidateId,
    engine,
    fields: mapping.fields,
    warnings: mergedWarnings,
    reviewRequired: true,
    mayWriteCandidateTruth: false,
    nextAction: mapping.fields.length > 0
      ? 'Show extracted draft fields to candidate/operator for confirmation before writing profile truth.'
      : 'Parse the document with Docling or upload clearer text before profile review.',
    evidence: {
      evidenceId: createEvidenceId(request.documentId || 'missing'),
      documentId: request.documentId,
      candidateId: request.candidateId,
      engine,
      createdAt: new Date().toISOString(),
      source: text ? 'document_text' : 'sidecar_pending',
      warnings: mergedWarnings,
    },
  };
}
