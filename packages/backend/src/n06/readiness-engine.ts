export function calculateN06Readiness(input: {
  candidateId: string;
  routeId: string;
  gate: string;
  knownRoute: boolean;
  documentReady: boolean;
  sourceVerified: boolean;
  paymentReady: boolean;
  deadlineRisk: boolean;
}) {
  const blockers: string[] = [];

  if (!input.documentReady) blockers.push("needs_documents");
  if (!input.sourceVerified) blockers.push("needs_source_verification");
  if (!input.paymentReady) blockers.push("needs_payment");
  if (input.deadlineRisk) blockers.push("deadline_risk");

  const readinessStatus =
    blockers.length === 0
      ? "ready_for_submission"
      : input.knownRoute && input.documentReady
        ? "ready_for_workbench"
        : blockers.includes("needs_documents")
          ? "needs_documents"
          : blockers.includes("needs_source_verification")
            ? "needs_source_verification"
            : "blocked";

  return {
    candidateId: input.candidateId,
    routeId: input.routeId,
    gate: input.gate,
    knownRoute: input.knownRoute,
    documentReady: input.documentReady,
    sourceVerified: input.sourceVerified,
    paymentReady: input.paymentReady,
    deadlineRisk: input.deadlineRisk,
    readinessStatus,
    blockers,
    packageControlsIntensityNotGateAccess: true,
    capLimitsVolumeNotCapability: true,
    productionReady: false
  } as const;
}