export type N06CaoChoiceOptimizerRow = {
  choiceId: string;
  parentApplicationId: string;
  programmeName: string;
  institutionName: string;
  candidatePreferenceRank?: number;
  sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
  fitScore: number;
  riskScore: number;
  recommendedOrder: number;
  countsAsSeparateKingsmenApplication: false;
  productionReady: false;
};

export type N06CaoChoiceOptimizerResult = {
  parentApplicationId: string;
  countsAsOneKingsmenApplication: true;
  orderedChoices: N06CaoChoiceOptimizerRow[];
  noGuaranteeLanguageRequired: true;
  productionReady: false;
};