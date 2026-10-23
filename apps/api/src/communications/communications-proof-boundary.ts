export type ProofCommunicationChannel = "email" | "whatsapp" | "sms";
export type ProofCommunicationPurpose = "transactional" | "urgent" | "support" | "marketing" | "bulk";

export interface CommunicationBoundaryRequest {
  channel: ProofCommunicationChannel;
  purpose: ProofCommunicationPurpose;
  candidateRef?: string;
  templateRef: string;
  recipientCount: number;
  hasConsent: boolean;
  founderApproved?: boolean;
  providerStagingProofPresent?: boolean;
}

export interface CommunicationBoundaryDecision {
  allowed: boolean;
  queuedOnly: boolean;
  reason: string;
  channel: ProofCommunicationChannel;
  evidence: {
    policyRef: "COMMUNICATIONS_BOUNDARY_SOURCE_ONLY";
    emailPrimary: true;
    whatsappUrgentOnly: true;
    smsBackupOnly: true;
    bulkMarketingDenied: boolean;
    providerSendRequiresStagingProof: true;
    rawRecipientDataRedacted: true;
    liveSendExecuted: false;
  };
}

export const COMMUNICATIONS_BOUNDARY_POLICY = {
  policyRef: "COMMUNICATIONS_BOUNDARY_SOURCE_ONLY",
  productionReady: false,
  publicLaunchAllowed: false,
  emailPrimary: true,
  whatsappUrgentOnly: true,
  smsBackupOnly: true,
  bulkMarketingDenied: true,
  providerSendRequiresStagingProof: true,
  providerSecretsMayBeLogged: false,
  rawRecipientDataRedacted: true,
  liveSendExecutedBySourceProof: false,
  marketingRequiresExplicitConsent: true,
  bounceHandlingRequired: true,
  unsubscribeRequiredForMarketing: true,
  founderApprovalRequiredForBulkOrHighRiskMessages: true
} as const;

export function decideCommunicationBoundary(request: CommunicationBoundaryRequest): CommunicationBoundaryDecision {
  // Reject malformed or ambiguous recipient counts before applying channel policy.
  // This boundary never sends live messages; malformed requests must not be queued.
  if (!Number.isSafeInteger(request.recipientCount) || request.recipientCount !== 1) {
    return {
      allowed: false,
      queuedOnly: true,
      reason: "invalidRecipientCount",
      channel: request.channel,
      evidence: {
        policyRef: "COMMUNICATIONS_BOUNDARY_SOURCE_ONLY",
        emailPrimary: true,
        whatsappUrgentOnly: true,
        smsBackupOnly: true,
        bulkMarketingDenied: true,
        providerSendRequiresStagingProof: true,
        rawRecipientDataRedacted: true,
        liveSendExecuted: false
      }
    };
  }

  const evidence = {
    policyRef: "COMMUNICATIONS_BOUNDARY_SOURCE_ONLY" as const,
    emailPrimary: true as const,
    whatsappUrgentOnly: true as const,
    smsBackupOnly: true as const,
    bulkMarketingDenied: request.purpose === "bulk" || request.recipientCount > 1,
    providerSendRequiresStagingProof: true as const,
    rawRecipientDataRedacted: true as const,
    liveSendExecuted: false as const
  };

  if (request.recipientCount > 1 || request.purpose === "bulk") {
    return { allowed: false, queuedOnly: true, reason: "bulkMarketingDenied", channel: request.channel, evidence };
  }

  if (request.purpose === "marketing" && !request.hasConsent) {
    return { allowed: false, queuedOnly: true, reason: "marketingRequiresExplicitConsent", channel: request.channel, evidence };
  }

  if (request.channel === "whatsapp" && request.purpose !== "urgent") {
    return { allowed: false, queuedOnly: true, reason: "whatsappUrgentOnly", channel: request.channel, evidence };
  }

  if (request.channel === "sms" && request.purpose !== "urgent") {
    return { allowed: false, queuedOnly: true, reason: "smsBackupOnly", channel: request.channel, evidence };
  }

  if (!request.providerStagingProofPresent) {
    return { allowed: true, queuedOnly: true, reason: "providerSendRequiresStagingProof", channel: request.channel, evidence };
  }

  return { allowed: true, queuedOnly: true, reason: "sourceProofNeverExecutesLiveSend", channel: request.channel, evidence };
}

export function redactCommunicationEvidence(input: { recipient?: string; subject?: string; bodyPreview?: string }) {
  return {
    recipient: input.recipient ? "[redacted-recipient]" : undefined,
    subject: input.subject ? "[redacted-subject]" : undefined,
    bodyPreview: input.bodyPreview ? "[redacted-preview]" : undefined,
    rawRecipientDataRedacted: true,
    rawMessageBodyRedacted: true
  };
}
