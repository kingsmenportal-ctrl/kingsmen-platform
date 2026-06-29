export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'EVIDENCE_MISSING_VERIFICATION_HOLD_CONTROL',
    role: 'missing_evidence_blocks_verified_status',
    status: {
      repoBoundary: 'built',
      evidenceInspection: 'not_proven',
      sourceVerification: 'not_proven',
      runtimeProof: 'not_proven',
      verificationStatus: 'unverified_until_required_proof_exists',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      incompleteEvidenceIsUnverified: true,
      requiredProofMustExistBeforeVerifiedStatus: true,
      missingProofMustBeNamed: true,
      assumptionsAreNotProof: true,
      sourceProofRequiredForOfficialStatus: true,
      runtimeEvidenceRequiredForRuntimeClaims: true
    },
    completionStatus: 'route_built_not_live_evidence_verification_proven'
  });
}
