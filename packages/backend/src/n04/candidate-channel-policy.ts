export function assertN04CandidateChannelAllowed(input: {
  channel: "email" | "whatsapp" | "sms" | "portal";
  purpose: "routine" | "urgent" | "backup" | "ceremonial" | "bulk_reminder";
}) {
  if (input.channel === "whatsapp") {
    throw new Error("WHATSAPP_DISABLED_BY_CURRENT_CHANNEL_POLICY");
  }

  if (input.channel === "sms") {
    throw new Error("SMS_DISABLED_BY_CURRENT_CHANNEL_POLICY");
  }

  if (input.channel !== "email" && input.channel !== "portal") {
    throw new Error("UNSUPPORTED_CANDIDATE_COMMUNICATION_CHANNEL");
  }

  return true;
}
