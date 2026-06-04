export function assertN05OcrFraudReviewSafe(input: {
  ocrDecisionAuthority?: boolean;
  aiDecisionAuthority?: boolean;
  fraudRisk: "unknown" | "low" | "medium" | "high" | "critical";
  humanReviewRequired?: boolean;
  evidenceId?: string;
  auditId?: string;
}) {
  if (!input.evidenceId || !input.auditId) {
    throw new Error("N05 OCR/fraud review requires evidence and auditId");
  }

  if (input.ocrDecisionAuthority === true || input.aiDecisionAuthority === true) {
    throw new Error("N05 OCR/AI may suggest, not govern document verification");
  }

  if (["medium", "high", "critical"].includes(input.fraudRisk) && input.humanReviewRequired !== true) {
    throw new Error("N05 medium/high/critical fraud risk requires human review");
  }

  return true;
}