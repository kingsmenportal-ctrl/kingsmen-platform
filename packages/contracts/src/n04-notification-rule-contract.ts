export type N04NotificationRule = {
  ruleId: string;
  eventType: string;
  primaryChannel: "email";
  portalCopyRequired: true;
  whatsappAllowedOnlyIfUrgent: true;
  smsAllowedOnlyAsBackup: true;
  bulkWhatsAppAllowed: false;
  evidenceLedgerRequired: true;
  productionReady: false;
};