export type NsfasSupportType = "APPLICATION_SUPPORT" | "DOCUMENT_SUPPORT" | "STATUS_TRACKING" | "APPEAL_SUPPORT";

export interface NsfasSupportCaseInput {
  candidateId: string;
  applicationId?: string;
  supportType: NsfasSupportType;
  mynsfasStatus?: string;
  requiredDocuments?: string[];
}

export interface NsfasSupportCase {
  nsfasCaseRef: string;
  candidateId: string;
  applicationId?: string;
  supportType: NsfasSupportType;
  supportStatus: "OPEN" | "WAITING_ON_CANDIDATE" | "WAITING_ON_NSFAS" | "READY" | "CLOSED" | "FAILED";
  mynsfasStatus: string;
  requiredDocuments: string[];
  nextAction: string;
}

export function createNsfasSupportCase(input: NsfasSupportCaseInput): NsfasSupportCase {
  if (!input.candidateId) throw new Error("candidateId is required.");

  const requiredDocuments = input.requiredDocuments ?? [];

  return {
    nsfasCaseRef: `nsfas_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    candidateId: input.candidateId,
    applicationId: input.applicationId,
    supportType: input.supportType,
    supportStatus: requiredDocuments.length > 0 ? "WAITING_ON_CANDIDATE" : "OPEN",
    mynsfasStatus: input.mynsfasStatus ?? "UNKNOWN",
    requiredDocuments,
    nextAction: requiredDocuments.length > 0
      ? "Ask candidate for missing NSFAS supporting documents."
      : "Check myNSFAS official status and next action."
  };
}

export function nsfasSupportIsApprovalGuarantee(): false {
  return false;
}