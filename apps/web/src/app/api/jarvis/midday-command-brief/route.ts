export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'MIDDAY_COMMAND_BRIEF_CONTROL',
    role: 'operational_checkpoint_not_live_progress_proof',
    status: {
      repoBoundary: 'built',
      morningBaseline: 'not_proven',
      progressEvidence: 'not_proven',
      risksAndBlocks: 'not_proven',
      runtimeBrief: 'not_proven',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      noInventedProgress: true,
      morningBaselineRequiresEvidenceOrReviewMarker: true,
      completedWorkRequiresEvidence: true,
      delaysAndBlocksMustRemainVisible: true,
      risingRisksMustBeChecked: true,
      recommendedAfternoonCommandRequired: true
    },
    completionStatus: 'route_built_not_live_midday_brief_proven'
  });
}
