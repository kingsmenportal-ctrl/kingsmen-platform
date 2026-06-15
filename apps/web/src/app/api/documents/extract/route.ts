import { NextRequest, NextResponse } from 'next/server';
import { extractCandidateDraftFromDocument } from '@/lib/documents/extraction/DocumentExtractionService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    documentId?: string;
    candidateId?: string;
    filename?: string;
    mimeType?: string;
    extractedText?: string;
    engine?: 'docling_sidecar' | 'plain_text_fallback';
  };

  if (!body.documentId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DOCUMENT_ID_REQUIRED',
        message: 'Document extraction requires documentId so evidence can be tied back to the Document Vault record.',
      },
      { status: 400 },
    );
  }

  const result = extractCandidateDraftFromDocument({
    documentId: body.documentId,
    candidateId: body.candidateId,
    filename: body.filename,
    mimeType: body.mimeType,
    extractedText: body.extractedText,
    engine: body.engine,
  });

  return NextResponse.json(
    {
      ...result,
      doctrine: {
        truthBoundary: 'This endpoint creates draft review fields only. It never writes candidate truth directly.',
        reviewBoundary: 'Candidate/operator confirmation is required before profile update.',
        documentBoundary: 'Original documents remain governed by Document Vault.',
      },
    },
    { status: result.ok ? 200 : 422 },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'Kingsmen Document Smart Intake Extraction API',
    mode: 'candidate_draft_review',
    accepts: {
      method: 'POST',
      body: ['documentId', 'candidateId', 'filename', 'mimeType', 'extractedText', 'engine'],
    },
    engines: ['plain_text_fallback', 'docling_sidecar'],
    doctrine: 'Draft extraction only. No candidate truth update without review.',
  });
}
