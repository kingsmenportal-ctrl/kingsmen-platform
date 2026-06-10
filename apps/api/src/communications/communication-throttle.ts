import type { CommunicationChannel, CommunicationUrgency } from "./communication-types";

export interface RateLimitState {
  channel: CommunicationChannel;
  maxCount: number;
  currentCount: number;
  status: "NORMAL" | "WATCH" | "THROTTLE" | "STOP";
}

export interface QuietHoursRule {
  timezone: "Africa/Johannesburg" | string;
  startsAtLocal: string;
  endsAtLocal: string;
  appliesToChannels: CommunicationChannel[];
  emergencyOverrideAllowed: boolean;
}

export function evaluateRateLimit(limit: RateLimitState): RateLimitState["status"] {
  if (limit.currentCount >= limit.maxCount) return "STOP";
  if (limit.currentCount >= Math.floor(limit.maxCount * 0.9)) return "THROTTLE";
  if (limit.currentCount >= Math.floor(limit.maxCount * 0.75)) return "WATCH";
  return "NORMAL";
}

export function assertRateLimitAllowsSend(limit: RateLimitState): void {
  const status = evaluateRateLimit(limit);
  if (status === "STOP") throw new Error(`COMMUNICATION_RATE_LIMIT_STOP: ${limit.channel} limit reached.`);
}

export function isHeldByQuietHours(input: {
  channel: CommunicationChannel;
  urgency: CommunicationUrgency;
  nowLocalHHMM: string;
  rule: QuietHoursRule;
}): boolean {
  if (!input.rule.appliesToChannels.includes(input.channel)) return false;
  if (input.urgency === "EMERGENCY" && input.rule.emergencyOverrideAllowed) return false;

  const start = input.rule.startsAtLocal;
  const end = input.rule.endsAtLocal;
  const now = input.nowLocalHHMM;

  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}