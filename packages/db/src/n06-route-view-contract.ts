export type N06CandidateRouteReadinessViewRow = {
  readinessId: string;
  candidateId: string;
  routeId: string;
  gateCode: string;
  routeSystemCode: string;
  institutionOrProviderName: string;
  programmeOrOpportunityName: string;
  readinessStatus: string;
  candidateCanVerifySource: false;
  candidateCanMarkSubmitted: false;
  candidateCanMarkPaid: false;
  productionReady: false;
};

export type N06CandidateCaoChoicesViewRow = {
  parentApplicationId: string;
  candidateId: string;
  choiceId: string;
  programmeName: string;
  institutionName: string;
  choiceOrder: number;
  childChoiceCountsAsSeparateKingsmenApplication: false;
  productionReady: false;
};