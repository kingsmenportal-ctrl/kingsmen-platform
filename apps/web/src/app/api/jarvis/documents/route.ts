export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'DOCUMENT_EVIDENCE_READINESS_CONTROL',
    documentRole: 'evidence_bearing_material_not_automatic_truth',
    status: {
      repoBoundary: 'built',
      documentConnection: 'not_proven',
      documentInspection: 'not_proven',
      evidenceReadiness: 'not_proven',
      documentExecution: 'not_proven',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      filePresenceIsNotReadiness: true,
      documentSummaryIsNotOfficialStatus: true,
      privacyMinimizationRequired: true,
      missingWeakEvidenceMustBeFlagged: true,
      noSendOrSubmitWithoutApproval: true,
      fileToolConfirmationRequiredForActionClaims: true
    },
    completionStatus: 'route_built_not_document_runtime_proven'
  });
}
