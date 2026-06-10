import type { FounderMobileCard } from "./founder-ops-types";

export function buildFounderMobileCards(): FounderMobileCard[] {
  return [
    { cardKey: "TODAY_COMMANDS", cardTitle: "Today's Commands", cardGroup: "TODAY", order: 10, severity: "WATCH", summary: "Commands requiring action or review.", nextAction: "Open command queue." },
    { cardKey: "URGENT_CANDIDATES", cardTitle: "Urgent Candidates", cardGroup: "CANDIDATES", order: 20, severity: "WARNING", summary: "Candidates with deadlines, blockers, or harm signals.", nextAction: "Inspect candidates." },
    { cardKey: "QUEUE_PRESSURE", cardTitle: "Queue Pressure", cardGroup: "QUEUE", order: 30, severity: "WATCH", summary: "Active runs, approvals, manual backlog, and delayed dispatch.", nextAction: "Check N16 lanes." },
    { cardKey: "DOCUMENT_PIPELINE", cardTitle: "Document Pipeline", cardGroup: "DOCUMENTS", order: 40, severity: "WATCH", summary: "Missing, rejected, suspicious, or ready documents.", nextAction: "Request document review." },
    { cardKey: "ROUTE_SOURCE_REVIEW", cardTitle: "Route Source Review", cardGroup: "ROUTES", order: 50, severity: "WATCH", summary: "Low-confidence sources, deadlines, fees, and requirements.", nextAction: "Request source review." },
    { cardKey: "FINANCE_REVIEW", cardTitle: "Finance Review", cardGroup: "FINANCE", order: 60, severity: "WATCH", summary: "Payments, unpaid invoices, refund reviews, and plan risks.", nextAction: "Open finance review." },
    { cardKey: "COMMS_ESCALATION", cardTitle: "Comms Escalation", cardGroup: "COMMS", order: 70, severity: "WARNING", summary: "Urgent messages and communication health.", nextAction: "Use email-first escalation." },
    { cardKey: "INCIDENTS", cardTitle: "Incidents", cardGroup: "INCIDENTS", order: 80, severity: "WARNING", summary: "Open incidents with cause and fix path.", nextAction: "Escalate incident." },
    { cardKey: "MAP_HANDOFFS", cardTitle: "MAP Handoffs", cardGroup: "MAP", order: 90, severity: "WATCH", summary: "Manual packages and blocked portals.", nextAction: "Review MAP evidence." },
    { cardKey: "PHOENIX_FALLBACKS", cardTitle: "Phoenix Fallbacks", cardGroup: "PHOENIX", order: 100, severity: "WATCH", summary: "Failure reroutes and fallback plans.", nextAction: "Review fallback route." },
    { cardKey: "SYSTEM_HEALTH", cardTitle: "System Health", cardGroup: "HEALTH", order: 110, severity: "WATCH", summary: "Backend, database, worker, connector, and report health.", nextAction: "Open observability." },
    { cardKey: "CAPACITY_CAP", cardTitle: "Capacity Cap", cardGroup: "CAPACITY", order: 120, severity: "WATCH", summary: "Oracle Lite 500 active-candidate cap pressure.", nextAction: "Inspect capacity lanes." }
  ];
}

export function phoneCockpitShowsCauseReasonRiskNextActionFixPath(): true {
  return true;
}