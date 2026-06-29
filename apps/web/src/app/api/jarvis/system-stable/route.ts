export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'SYSTEM_STABLE_OBSERVATION_CONTROL',
    stableRole: 'controlled_observation_not_unnecessary_intervention',
    status: {
      repoBoundary: 'built',
      stabilityEvidence: 'not_proven',
      monitoringState: 'not_proven',
      runtimeStability: 'not_proven',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      doNotInventUrgency: true,
      doNotRepairWhatIsNotBroken: true,
      openRisksRemainVisible: true,
      monitoringStateMustRemainVisible: true,
      observationIsNotProductionCompletion: true,
      runtimeStabilityRequiresRuntimeEvidence: true
    },
    completionStatus: 'route_built_not_live_stability_proven'
  });
}
