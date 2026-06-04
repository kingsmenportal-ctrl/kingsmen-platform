export type N04MobileJourneyStep =
  | "welcome"
  | "identity"
  | "intake"
  | "six_gate_review"
  | "documents"
  | "payments"
  | "applications"
  | "messages"
  | "support"
  | "outcomes";

export type N04MobileJourney = {
  schema: "kingsmen.n04-mobile-journey.v1";
  candidateId: string;
  currentStep: N04MobileJourneyStep;
  mobileFirst: true;
  lowDataFriendly: true;
  candidateSafeGuidance: true;
  productionReady: false;
};