import { NextRequest, NextResponse } from 'next/server';
import { runDoclingSmartIntakeAdapter } from '@/lib/public-repos/live/adapters/DoclingSmartIntakeAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    documentId?: string;
    candidateId?: string;
    storagePath?: string;
    filename?: string;
    mimeType?: string;
    purpose?: 'candidate_smart_intake' | 'document_review' | 'manual_package_support';
    extractedText?: string;
    engine?: 'docling_sidecar' | 'plain_text_fallback';
  };

  if (!body.documentId) {
    return NextResponse.json({ ok: false, error: 'DOCUMENT_ID_REQUIRED' }, { status: 400 });
  }

  const result = runDoclingSmartIntakeAdapter({
    documentId: body.documentId,
    candidateId: body.candidateId,
    storagePath: body.storagePath,
    filename: body.filename,
    mimeType: body.mimeType,
    purpose: body.purpose ?? 'candidate_smart_intake',
    extractedText: body.extractedText,
    engine: body.engine ?? 'plain_text_fallback',
  });

  return NextResponse.json(
    {
      ...result,
      doctrine: {
        adapterBoundary: 'DoclingAdapter prepares review-safe candidate draft fields only.',
        truthBoundary: 'No candidate profile truth is written by this adapter route.',
        reviewBoundary: 'Candidate/operator confirmation remains required.',
      },
    },
    { status: result.ok ? 200 : 422 },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    adapterId: 'DoclingAdapter',
    repository: 'DS4SD/docling',
    mode: 'candidate_smart_intake_review',
    method: 'POST',
    required: ['documentId'],
    optional: ['candidateId', 'storagePath', 'filename', 'mimeType', 'purpose', 'extractedText', 'engine'],
    safety: 'Draft fields only. Review required. No candidate truth write.',
  });
}
