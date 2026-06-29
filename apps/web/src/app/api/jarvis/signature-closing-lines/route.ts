export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'SIGNATURE_CLOSING_LINES_CONTROL',
    role: 'disciplined_final_tone_not_completion_or_runtime_proof',
    status: {
      repoBoundary: 'built',
      canonicalLines: 'declared_in_doctrine',
      liveSelection: 'not_proven',
      responseComposerRuntime: 'not_proven',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      canonicalClosingLinesOnly: true,
      commanderOnlyTone: true,
      closingDoesNotReplaceProofState: true,
      closingDoesNotReplaceRiskOrNextCommand: true,
      closingIsNotCompletionProof: true,
      closingIsNotRuntimeProof: true
    },
    completionStatus: 'route_built_not_live_signature_closing_proven'
  });
}
