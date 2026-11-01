export type N04CandidateChannel = "email" | "whatsapp" | "sms" | "portal";

export type N04CandidateCommunicationPolicy = {
  schema: "kingsmen.n04-communication-channel-policy.v1";
  routineChannel: "email";
  urgentChannel: "email";
  backupChannel: "email";
  whatsappEnabled: false;
  smsEnabled: false;
  whatsappDisabled: true;
  smsDisabled: true;
  bulkWhatsAppAllowed: false;
  routineWhatsAppAllowed: false;
  emailFirst: true;
  productionReady: false;
};
