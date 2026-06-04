export type N08FounderDigestWindow =
  | "morning"
  | "midday"
  | "evening"
  | "incident"
  | "end_of_day";

export type N08FounderDigest = {
  digestId: string;
  window: N08FounderDigestWindow;
  title: string;
  summary: string;
  queueHealthSummary: string;
  providerHealthSummary: string;
  candidateHarmSummary: string;
  stopSellingSummary: string;
  actionPacketIds: string[];
  founderReviewRequired: boolean;
  evidenceId: string;
  auditId: string;
  productionReady: false;
};