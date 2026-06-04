export type N04SuccessTransition = {
  transitionId: string;
  candidateId: string;
  outcomeId: string;
  nextMode:
    | "registration_support"
    | "funding_support"
    | "accommodation_support"
    | "work_onboarding"
    | "alumni"
    | "referral"
    | "upskill_pathway";
  proofId: string;
  consentId?: string;
  candidateVisible: true;
  createdAt: string;
  productionReady: false;
};