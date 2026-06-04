export type N03ApplicationSystem =
  | "cao"
  | "institution_direct"
  | "nsfas"
  | "tvet"
  | "seta"
  | "employer"
  | "bursary"
  | "other";

export type N03ApplicationParent = {
  applicationId: string;
  candidateId: string;
  applicationSystem: N03ApplicationSystem;
  routeGate: "higher_education" | "tvet" | "seta_learnership" | "internship" | "apprenticeship" | "employment";
  countsAsKingsmenManagedApplication: true;
  childChoiceCount: number;
  productionReady: false;
};

export type N03ApplicationChildChoice = {
  choiceId: string;
  parentApplicationId: string;
  programmeName: string;
  institutionName: string;
  choiceOrder: number;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
};