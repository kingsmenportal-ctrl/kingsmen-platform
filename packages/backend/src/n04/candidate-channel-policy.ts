export function assertN04CandidateChannelAllowed(input: {
  channel: "email" | "whatsapp" | "sms" | "portal";
  purpose: "routine" | "urgent" | "backup" | "ceremonial" | "bulk_reminder";
}) {
  if (input.purpose === "routine" && input.channel !== "email" && input.channel !== "portal") {
    throw new Error("Routine candidate communication must be email-first or portal-safe");
  }

  if (input.channel === "whatsapp" && input.purpose !== "urgent" && input.purpose !== "ceremonial") {
    throw new Error("WhatsApp is urgent-only or ceremonial only; bulk/routine WhatsApp is blocked");
  }

  if (input.channel === "sms" && input.purpose !== "backup") {
    throw new Error("SMS is backup-only");
  }

  if (input.purpose === "bulk_reminder" && input.channel === "whatsapp") {
    throw new Error("Bulk WhatsApp reminders are blocked");
  }

  return true;
}