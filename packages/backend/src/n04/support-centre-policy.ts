export function assertN04SupportRequestSafe(input: {
  category: string;
  urgency: "low" | "normal" | "high" | "critical";
  candidateHarmRisk?: boolean;
  deadlineRisk?: boolean;
  preferredChannel: "email" | "portal" | "whatsapp" | "sms";
  evidenceId?: string;
  auditId?: string;
}) {
  if (!input.evidenceId) {
    throw new Error("N04 support request requires evidence");
  }

  if (!input.auditId) {
    throw new Error("N04 support request requires auditId");
  }

  if (input.preferredChannel !== "email" && input.preferredChannel !== "portal") {
    throw new Error("N04 routine support must be email-first or portal-safe");
  }

  if ((input.candidateHarmRisk === true || input.deadlineRisk === true) && !["high", "critical"].includes(input.urgency)) {
    throw new Error("N04 candidate harm or deadline risk must be high or critical urgency");
  }

  return true;
}