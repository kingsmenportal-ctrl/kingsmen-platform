export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'COMMAND_COMPLETE_CLOSEOUT_CONTROL',
    completionRole: 'evidence_backed_closeout_not_casual_done',
    status: {
      repoBoundary: 'built',
      verifiedOutput: 'not_proven',
      validatorOutput: 'not_proven',
      evidenceRefs: 'not_proven',
      runtimeCompletion: 'not_proven',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      noDoneWithoutProof: true,
      partialMeansPartial: true,
      blockedMeansBlocked: true,
      verifiedOutputRequired: true,
      remainingMatterMustRemainVisible: true,
      riskMustRemainVisible: true,
      nextCommandRequired: true
    },
    completionStatus: 'route_built_not_live_completion_proven'
  });
}
