const URGENT_ALERT_REASONS = new Set([
  "candidate_harm",
  "provider_failure",
  "queue_danger",
  "payment_refund_risk",
  "source_risk",
  "privacy_risk",
  "stop_selling_risk",
  "security_incident"
]);

export function buildN08FounderMobileAlert(input: {
  alertId: string;
  reason: string;
  severity: "urgent" | "critical" | "info" | "watch";
  title: string;
  message: string;
  actionPacketId: string;
  evidenceId: string;
  auditId: string;
}) {
  if (!input.alertId || !input.actionPacketId || !input.evidenceId || !input.auditId) {
    throw new Error("N08 mobile alert requires alertId, actionPacketId, evidenceId, and auditId");
  }

  if (!URGENT_ALERT_REASONS.has(input.reason)) {
    throw new Error(`N08 mobile alert blocked: reason is not urgent-only ${input.reason}`);
  }

  if (!["urgent", "critical"].includes(input.severity)) {
    throw new Error("N08 mobile alert blocked: founder mobile alerts must be urgent or critical");
  }

  return {
    alertId: input.alertId,
    reason: input.reason,
    severity: input.severity,
    title: input.title,
    message: input.message,
    actionPacketId: input.actionPacketId,
    evidenceId: input.evidenceId,
    auditId: input.auditId,
    urgentOnly: true,
    productionReady: false
  } as const;
}