export type N04CandidateChannel = "email" | "whatsapp" | "sms" | "portal";

export type N04CandidateCommunicationPolicy = {
  schema: "kingsmen.n04-communication-channel-policy.v1";
  routineChannel: "email";
  urgentChannel: "whatsapp";
  backupChannel: "sms";
  bulkWhatsAppAllowed: false;
  routineWhatsAppAllowed: false;
  emailFirst: true;
  productionReady: false;
};