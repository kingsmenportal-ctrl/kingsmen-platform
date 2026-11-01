export const N04_MESSAGE_EVIDENCE_POLICY = {
  productionReady: false,
  emailFirst: true,
  portalCopyRequired: true,
  whatsappUrgentOnly: false,
  smsBackupOnly: false,
  whatsappDisabled: true,
  smsDisabled: true,
  bulkWhatsAppBlocked: true,
  messageEvidenceLedgerRequired: true,
  candidateSafeMessageReadModelOnly: true
} as const;

export function assertN04MessageEvidencePolicySafe() {
  if (N04_MESSAGE_EVIDENCE_POLICY.productionReady !== false) {
    throw new Error("N04 message evidence policy cannot claim productionReady=true");
  }
  if (!N04_MESSAGE_EVIDENCE_POLICY.whatsappDisabled || !N04_MESSAGE_EVIDENCE_POLICY.smsDisabled) {
    throw new Error("N04 message evidence policy must keep WhatsApp and SMS disabled");
  }
  return true;
}
