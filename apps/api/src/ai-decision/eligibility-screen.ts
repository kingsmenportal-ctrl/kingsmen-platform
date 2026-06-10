import type { CandidateDecisionSignals, EligibilityScreenResult, RouteOptionSignal } from "./ai-decision-types";

export function screenEligibility(input: {
  candidate: CandidateDecisionSignals;
  route: RouteOptionSignal;
  requiredDocuments?: string[];
  candidateDocuments?: string[];
}): EligibilityScreenResult {
  const requiredDocuments = input.requiredDocuments ?? [];
  const candidateDocuments = new Set((input.candidateDocuments ?? []).map((doc) => doc.toLowerCase()));
  const missingDocuments = requiredDocuments.filter((doc) => !candidateDocuments.has(doc.toLowerCase()));
  const blockers: string[] = [];

  if (input.route.portalHealth === "DOWN") blockers.push("Portal is down.");
  if (input.route.portalHealth === "CAPTCHA") blockers.push("Portal requires CAPTCHA; MAP/manual fallback may be needed.");
  if (input.route.portalHealth === "OTP_REQUIRED") blockers.push("Portal requires OTP; candidate/operator action needed.");
  if (input.candidate.profileCompleteness < 60) blockers.push("Candidate profile completeness is below safe route threshold.");
  if (input.candidate.academicFit < 40) blockers.push("Academic fit appears weak and needs review.");

  const eligibilityStatus =
    blockers.length > 0 ? "NEEDS_REVIEW" :
    missingDocuments.length > 0 ? "LIKELY_ELIGIBLE" :
    input.route.sourceConfidence === "LOW" ? "UNKNOWN" :
    "ELIGIBLE";

  return {
    screenRef: `screen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateRef: input.candidate.candidateRef,
    routeRef: input.route.routeRef,
    eligibilityStatus,
    blockers,
    missingDocuments,
    reviewRequired: eligibilityStatus !== "ELIGIBLE",
    explanation: [
      `Eligibility screen for route ${input.route.routeRef}.`,
      blockers.length ? `Review reasons: ${blockers.join(" ")}` : "No hard eligibility blocker found by rules.",
      missingDocuments.length ? `Missing documents: ${missingDocuments.join(", ")}.` : "Required document set appears ready."
    ].join(" "),
    evidenceRefs: [...input.candidate.evidenceRefs, ...input.route.evidenceRefs]
  };
}