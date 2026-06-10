import type { FounderReport } from "./observability-types";

export interface ReportDeliveryIntent {
  deliveryRef: string;
  reportRef: string;
  channel: "EMAIL" | "PORTAL" | "WHATSAPP_URGENT" | "SMS_BACKUP" | "CONTROL_PLANE";
  deliveryStatus: "PENDING" | "SENT" | "FAILED" | "CANCELLED";
  recipientRef: string;
  failureReason?: string;
  evidenceRefs: string[];
}

export function buildReportDeliveryIntent(input: {
  report: FounderReport;
  channel?: ReportDeliveryIntent["channel"];
  recipientRef?: string;
  evidenceRefs: string[];
}): ReportDeliveryIntent {
  const channel = input.channel ?? "EMAIL";
  if (channel === "WHATSAPP_URGENT" && input.report.reportType !== "INCIDENT") {
    throw new Error("REPORT_DELIVERY_WHATSAPP_BLOCKED_FOR_NON_INCIDENT");
  }
  if (input.evidenceRefs.length === 0) throw new Error("REPORT_DELIVERY_EVIDENCE_REQUIRED");

  return {
    deliveryRef: `delivery_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    reportRef: input.report.reportRef,
    channel,
    deliveryStatus: "PENDING",
    recipientRef: input.recipientRef ?? "founder",
    evidenceRefs: input.evidenceRefs
  };
}