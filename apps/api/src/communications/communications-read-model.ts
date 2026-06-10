import type { NotificationStatus } from "./communication-types";

export interface CommunicationRuntimeSnapshot {
  queued: number;
  heldForApproval: number;
  sentToday: number;
  failedToday: number;
  urgentInbound: number;
  whatsappPendingApproval: number;
  rateLimitStatus: string;
}

export function buildCommunicationFounderSummary(snapshot: CommunicationRuntimeSnapshot) {
  const actions: string[] = [];
  if (snapshot.heldForApproval > 0) actions.push(`${snapshot.heldForApproval} notification(s) need approval.`);
  if (snapshot.failedToday > 0) actions.push(`${snapshot.failedToday} notification(s) failed today.`);
  if (snapshot.urgentInbound > 0) actions.push(`${snapshot.urgentInbound} urgent inbound message(s) need review.`);
  if (snapshot.whatsappPendingApproval > 0) actions.push(`${snapshot.whatsappPendingApproval} WhatsApp urgent escalation(s) need approval.`);
  if (snapshot.rateLimitStatus === "THROTTLE" || snapshot.rateLimitStatus === "STOP") {
    actions.push(`Communication rate limit is ${snapshot.rateLimitStatus}.`);
  }
  return {
    headline: actions.length ? "Founder action required" : "Communication runtime normal",
    actions
  };
}

export function countByStatus(items: Array<{ status: NotificationStatus }>) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
}