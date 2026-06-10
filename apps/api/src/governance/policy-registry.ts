import type { GovernancePolicy, PolicyDomain } from "./governance-types";

export const GOVERNANCE_POLICIES: GovernancePolicy[] = [
  {
    policyRef: "POL-AI-BOUNDARY-001",
    policyDomain: "AI_BOUNDARY",
    policyName: "AI hard decision boundary",
    policyVersion: "v1",
    enforcementLevel: "HARD_BLOCK",
    policyStatus: "ACTIVE",
    policyText: "AI may suggest but must not govern money, refunds, official status, submissions, fraud, privacy, or hard blockers.",
    evidenceRequired: true,
    humanReviewRequired: true
  },
  {
    policyRef: "POL-SUBMISSION-001",
    policyDomain: "SUBMISSION",
    policyName: "Official submission approval boundary",
    policyVersion: "v1",
    enforcementLevel: "REVIEW_REQUIRED",
    policyStatus: "ACTIVE",
    policyText: "Official submissions require permitted state, evidence, source confidence, and human/operator approval where required.",
    evidenceRequired: true,
    humanReviewRequired: true
  },
  {
    policyRef: "POL-POPIA-001",
    policyDomain: "POPIA_PRIVACY",
    policyName: "POPIA lawful processing boundary",
    policyVersion: "v1",
    enforcementLevel: "HARD_BLOCK",
    policyStatus: "ACTIVE",
    policyText: "Privacy-sensitive processing requires lawful basis, minimum data, consent/contract/legal basis, and audit evidence.",
    evidenceRequired: true,
    humanReviewRequired: true
  },
  {
    policyRef: "POL-GROWTH-001",
    policyDomain: "GROWTH_CAP",
    policyName: "Growth cap quality gate",
    policyVersion: "v1",
    enforcementLevel: "REVIEW_REQUIRED",
    policyStatus: "ACTIVE",
    policyText: "Growth cap increases require outcome-quality evidence, system health, and founder/operator approval.",
    evidenceRequired: true,
    humanReviewRequired: true
  }
];

export function findPolicy(policyRef: string): GovernancePolicy {
  const policy = GOVERNANCE_POLICIES.find((item) => item.policyRef === policyRef);
  if (!policy) throw new Error(`POLICY_NOT_REGISTERED: ${policyRef}`);
  return policy;
}

export function listPoliciesByDomain(domain: PolicyDomain): GovernancePolicy[] {
  return GOVERNANCE_POLICIES.filter((policy) => policy.policyDomain === domain && policy.policyStatus === "ACTIVE");
}