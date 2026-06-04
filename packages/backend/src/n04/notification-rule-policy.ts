export function assertN04NotificationRuleSafe(input: {
  primaryChannel: "email" | "portal" | "whatsapp" | "sms";
  portalCopyRequired: boolean;
  whatsappAllowedOnlyIfUrgent: boolean;
  smsAllowedOnlyAsBackup: boolean;
  bulkWhatsAppAllowed: boolean;
  evidenceLedgerRequired: boolean;
}) {
  if (input.primaryChannel !== "email") {
    throw new Error("N04 notification primary channel must be email");
  }

  if (input.portalCopyRequired !== true) {
    throw new Error("N04 notification must create portal copy");
  }

  if (input.whatsappAllowedOnlyIfUrgent !== true) {
    throw new Error("N04 WhatsApp must remain urgent-only");
  }

  if (input.smsAllowedOnlyAsBackup !== true) {
    throw new Error("N04 SMS must remain backup-only");
  }

  if (input.bulkWhatsAppAllowed !== false) {
    throw new Error("N04 bulk WhatsApp must remain blocked");
  }

  if (input.evidenceLedgerRequired !== true) {
    throw new Error("N04 notification requires evidence ledger");
  }

  return true;
}