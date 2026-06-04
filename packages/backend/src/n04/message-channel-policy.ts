export function assertN04MessageChannelSafe(input: {
  channel: "email" | "portal" | "whatsapp" | "sms";
  purpose: "routine" | "urgent" | "backup" | "ceremonial" | "support" | "evidence_request" | "bulk_reminder";
  evidenceId?: string;
}) {
  if (!input.evidenceId) {
    throw new Error("N04 message requires evidence ledger entry");
  }

  if (input.purpose === "routine" && input.channel !== "email" && input.channel !== "portal") {
    throw new Error("N04 routine messages must be email-first or portal copy");
  }

  if (input.channel === "whatsapp" && input.purpose !== "urgent" && input.purpose !== "ceremonial") {
    throw new Error("N04 WhatsApp is urgent-only or ceremonial only");
  }

  if (input.channel === "sms" && input.purpose !== "backup") {
    throw new Error("N04 SMS is backup-only");
  }

  if (input.channel === "whatsapp" && input.purpose === "bulk_reminder") {
    throw new Error("N04 bulk WhatsApp reminders are blocked");
  }

  return true;
}