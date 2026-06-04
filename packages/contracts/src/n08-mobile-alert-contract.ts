export type N08MobileAlertReason =
  | "candidate_harm"
  | "provider_failure"
  | "queue_danger"
  | "payment_refund_risk"
  | "source_risk"
  | "privacy_risk"
  | "stop_selling_risk"
  | "security_incident";

export type N08FounderMobileAlert = {
  alertId: string;
  reason: N08MobileAlertReason;
  severity: "urgent" | "critical";
  title: string;
  message: string;
  actionPacketId: string;
  evidenceId: string;
  auditId: string;
  urgentOnly: true;
  productionReady: false;
};