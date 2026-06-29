export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    intent: 'GITHUB_REPO_EVIDENCE_OR_CHANGE_CONTROL',
    repoRole: 'repository_evidence_and_change_control_not_runtime_truth',
    status: {
      repoBoundary: 'built',
      commitProof: 'repo_change_only',
      buildProof: 'requires_validator_or_ci_output',
      runtimeProof: 'not_proven',
      productionCompletion: 'not_claimed'
    },
    lockedRules: {
      noBlindOverwrite: true,
      noSecretExposure: true,
      exactPathRequired: true,
      commitShaIsRepoProofOnly: true,
      runtimeProofRequiredForLiveClaims: true
    },
    completionStatus: 'route_built_not_runtime_proven'
  });
}
