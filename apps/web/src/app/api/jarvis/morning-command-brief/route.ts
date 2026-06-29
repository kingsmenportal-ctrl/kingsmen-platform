export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'MORNING_COMMAND_BRIEF_CONTROL',
    role: 'daily_command_opening_position_report_not_live_proof',
    status: {
      repoBoundary: 'built',
      currentContext: 'not_proven',
      commandPosition: 'not_proven',
      runtimeBrief: 'not_proven',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      noInventedCurrentFields: true,
      liveFieldsRequireVerification: true,
      positionRequiresEvidence: true,
      attentionMattersRequired: true,
      recommendedFirstCommandRequired: true
    },
    completionStatus: 'route_built_not_live_morning_brief_proven'
  });
}
