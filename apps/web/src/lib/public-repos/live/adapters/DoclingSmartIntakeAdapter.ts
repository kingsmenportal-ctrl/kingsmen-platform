import { extractCandidateDraftFromDocument, type DocumentExtractionRequest, type DocumentExtractionResult } from '@/lib/documents/extraction/DocumentExtractionService';
import { assertDoclingAdapterRequestSafe, type DoclingAdapterRequest } from './DoclingAdapter.contract';

export interface DoclingSmartIntakeAdapterInput extends DoclingAdapterRequest {
  extractedText?: string;
  engine?: 'docling_sidecar' | 'plain_text_fallback';
}

export interface DoclingSmartIntakeAdapterResult {
  ok: boolean;
  adapterId: 'DoclingAdapter';
  repository: 'DS4SD/docling';
  safetyWarnings: string[];
  extraction: DocumentExtractionResult;
}

export function runDoclingSmartIntakeAdapter(input: DoclingSmartIntakeAdapterInput): DoclingSmartIntakeAdapterResult {
  const safetyWarnings = assertDoclingAdapterRequestSafe(input);

  const extractionRequest: DocumentExtractionRequest = {
    documentId: input.documentId,
    candidateId: input.candidateId,
    filename: input.filename,
    mimeType: input.mimeType,
    extractedText: input.extractedText,
    engine: input.engine ?? 'plain_text_fallback',
  };

  const extraction = extractCandidateDraftFromDocument(extractionRequest);

  return {
    ok: safetyWarnings.length === 0 && extraction.ok,
    adapterId: 'DoclingAdapter',
    repository: 'DS4SD/docling',
    safetyWarnings,
    extraction: {
      ...extraction,
      mayWriteCandidateTruth: false,
      reviewRequired: true,
    },
  };
}
