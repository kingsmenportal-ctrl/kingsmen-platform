export type N05OcrFraudReview = {
  reviewId: string;
  documentId: string;
  candidateId: string;
  ocrAssistiveOnly: true;
  extractedTextSafeSummary?: string;
  fraudRisk: "unknown" | "low" | "medium" | "high" | "critical";
  evidenceId: string;
  auditId: string;
  humanReviewRequired: boolean;
  aiMaySuggestNotGovern: true;
  createdAt: string;
  productionReady: false;
};