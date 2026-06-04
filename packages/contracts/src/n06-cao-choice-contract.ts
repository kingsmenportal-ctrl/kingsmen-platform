export type N06CaoParentApplication = {
  applicationId: string;
  candidateId: string;
  applicationSystem: "cao";
  countsAsKingsmenManagedApplication: true;
  childChoices: N06CaoProgrammeChoice[];
  productionReady: false;
};

export type N06CaoProgrammeChoice = {
  choiceId: string;
  parentApplicationId: string;
  programmeName: string;
  institutionName: string;
  campus?: string;
  choiceOrder: number;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
};