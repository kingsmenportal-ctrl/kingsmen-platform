import { assertN05OcrFraudReviewSafe } from "./ocr-fraud-review-policy";

export function buildN05OcrFraudReviewMethod(input: {
  documentId: string;
  candidateId: string;
  fraudRisk: "unknown" | "low" | "medium" | "high" | "critical";
  extractedTextSafeSummary?: string;
  evidenceId: string;
  auditId: string;
  humanReviewRequired?: boolean;
}) {
  assertN05OcrFraudReviewSafe({
    fraudRisk: input.fraudRisk,
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    humanReviewRequired: input.humanReviewRequired,
    ocrDecisionAuthority: false,
    aiDecisionAuthority: false
  });

  return {
    reviewId: `ocr_fraud_${input.documentId}_${Date.now()}`,
    documentId: input.documentId,
    candidateId: input.candidateId,
    fraudRisk: input.fraudRisk,
    extractedTextSafeSummary: input.extractedTextSafeSummary,
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    ocrAssistiveOnly: true,
    aiMaySuggestNotGovern: true,
    humanReviewRequired: input.humanReviewRequired === true || ["medium", "high", "critical"].includes(input.fraudRisk),
    productionReady: false,
    createdAt: new Date().toISOString()
  } as const;
}