export function optimizeN06CaoChoices(input: {
  parentApplicationId: string;
  choices: Array<{
    choiceId: string;
    programmeName: string;
    institutionName: string;
    candidatePreferenceRank?: number;
    sourceConfidence: "unverified" | "low" | "medium" | "high" | "official_verified";
    fitScore: number;
    riskScore: number;
  }>;
}) {
  if (!input.parentApplicationId) {
    throw new Error("N06 CAO optimizer requires parentApplicationId");
  }

  if (input.choices.length < 1) {
    throw new Error("N06 CAO optimizer requires at least one child choice");
  }

  const orderedChoices = [...input.choices]
    .map((choice) => ({
      ...choice,
      parentApplicationId: input.parentApplicationId,
      recommendedOrder: 0,
      countsAsSeparateKingsmenApplication: false,
      productionReady: false
    }))
    .sort((a, b) => {
      const scoreA = a.fitScore - a.riskScore - (a.candidatePreferenceRank ?? 99);
      const scoreB = b.fitScore - b.riskScore - (b.candidatePreferenceRank ?? 99);
      return scoreB - scoreA;
    })
    .map((choice, index) => ({
      ...choice,
      recommendedOrder: index + 1
    }));

  return {
    parentApplicationId: input.parentApplicationId,
    countsAsOneKingsmenApplication: true,
    orderedChoices,
    noGuaranteeLanguageRequired: true,
    productionReady: false
  } as const;
}