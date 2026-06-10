import type { CandidateChannel, CandidateUrgency } from "./candidate-types";

export interface CandidateMessagePolicyInput {
  channel: CandidateChannel;
  urgency: CandidateUrgency;
  body: string;
}

export interface CandidateMessagePolicyDecision {
  allowed: boolean;
  reasons: string[];
  fallbackChannel?: CandidateChannel;
}

export function evaluateCandidateMessagePolicy(input: CandidateMessagePolicyInput): CandidateMessagePolicyDecision {
  const reasons: string[] = [];

  if (!input.body || input.body.trim().length < 2) {
    return { allowed: false, reasons: ["Message body is required."] };
  }

  if (input.channel === "WHATSAPP" && input.urgency !== "URGENT" && input.urgency !== "EMERGENCY") {
    return {
      allowed: false,
      reasons: ["WhatsApp is urgent-only in Kingsmen doctrine."],
      fallbackChannel: "EMAIL"
    };
  }

  if (input.channel === "SMS" && input.urgency === "ROUTINE") {
    return {
      allowed: false,
      reasons: ["SMS is backup-only and should not be used for routine messages."],
      fallbackChannel: "EMAIL"
    };
  }

  reasons.push("Message follows candidate communication doctrine.");

  return {
    allowed: true,
    reasons
  };
}

export function buildEmailFirstSubject(topic: string): string {
  return `Kingsmen Update: ${topic}`.trim();
}