const DIGEST_WINDOWS = new Set(["morning", "midday", "evening", "incident", "end_of_day"]);

export function buildN08FounderDigest(input: {
  digestId: string;
  window: "morning" | "midday" | "evening" | "incident" | "end_of_day";
  queueUnsafe: boolean;
  providerUnsafe: boolean;
  candidateHarmRisk: boolean;
  stopSellingRisk: boolean;
  actionPacketIds: string[];
  evidenceId: string;
  auditId: string;
}) {
  if (!input.digestId || !input.evidenceId || !input.auditId) {
    throw new Error("N08 founder digest requires digestId, evidenceId, and auditId");
  }

  if (!DIGEST_WINDOWS.has(input.window)) {
    throw new Error(`N08 founder digest blocked: invalid digest window ${input.window}`);
  }

  const founderReviewRequired =
    input.queueUnsafe ||
    input.providerUnsafe ||
    input.candidateHarmRisk ||
    input.stopSellingRisk ||
    input.actionPacketIds.length > 0;

  return {
    digestId: input.digestId,
    window: input.window,
    title: `Kingsmen ${input.window} founder digest`,
    summary: founderReviewRequired ? "Founder review required." : "No founder intervention required.",
    queueHealthSummary: input.queueUnsafe ? "Queue risk requires review." : "Queue within current boundary.",
    providerHealthSummary: input.providerUnsafe ? "Provider risk requires review." : "Providers within current boundary.",
    candidateHarmSummary: input.candidateHarmRisk ? "Candidate harm risk requires review." : "No candidate harm risk flagged.",
    stopSellingSummary: input.stopSellingRisk ? "Stop-selling review required." : "No stop-selling action required.",
    actionPacketIds: input.actionPacketIds,
    founderReviewRequired,
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    productionReady: false
  } as const;
}